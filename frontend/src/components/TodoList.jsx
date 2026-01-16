import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/TodoList.css';

const TodoList = ({ onTaskUpdate }) => {
    const { user } = useAuth(); 
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'pending',
        priority: '',
        assignee: '', // Keep for backward compatibility
        assignees: [], // New: multiple assignees
        dueDate: '',
        documentationLinks: []
    });
    const [newDocLink, setNewDocLink] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        assignee: ''
    });
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc' // 'asc' or 'desc'
    });

    useEffect(() => {
        if (user) {
            fetchTodos();
            if (user.role !== 'member') {
                fetchUsers();
            }
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/activities');
            setUsers(response.data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchTodos = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.assignee) params.append('assignee', filters.assignee);
            
            const queryString = params.toString();
            const url = `/todos${queryString ? '?' + queryString : ''}`;
            const response = await api.get(url);
            setTodos(response.data.data || []); 
        } catch (err) {
            if (err.response?.status === 401) {
                console.error('Authentication required');
                setTodos([]);
            } else {
                console.error('Lỗi lấy danh sách:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTodos();
        }
    }, [filters]);
    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.patch(`/todos/${id}/status`, { status: newStatus });
            setTodos(todos.map(t => t.id === id ? { ...t, status: newStatus } : t));
            if (onTaskUpdate) onTaskUpdate();
        } catch (err) {
            alert(err.response?.data?.message || "Không thể cập nhật trạng thái");
        }
    };
    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa task này?')) {
            try {
                await api.delete(`/todos/${id}`);
                setTodos(todos.filter(t => t.id !== id));
                if (onTaskUpdate) onTaskUpdate();
            } catch (err) {
                alert(err.response?.data?.message || 'Không thể xóa');
            }
        }
    };

    const handleCreateTask = () => {
        setEditingTask(null);
        setFormData({
            title: '',
            description: '',
            status: 'pending',
            priority: '',
            assignee: user.id,
            assignees: [user.id.toString()], // Default to current user
            dueDate: '',
            documentationLinks: []
        });
        setNewDocLink('');
        setShowTaskForm(true);
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        // Parse documentation links (can be JSON string or array)
        let docLinks = [];
        if (task.documentation_links) {
            try {
                docLinks = typeof task.documentation_links === 'string' 
                    ? JSON.parse(task.documentation_links) 
                    : task.documentation_links;
            } catch (e) {
                docLinks = [];
            }
        }
        
        // Get assignees: use assignees array if available, otherwise use user_id (backward compat)
        let assignees = [];
        if (task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0) {
            assignees = task.assignees.map(a => a.id ? a.id.toString() : a.toString());
        } else if (task.user_id) {
            assignees = [task.user_id.toString()];
        } else {
            assignees = [user.id.toString()];
        }
        
        setFormData({
            title: task.title || '',
            description: task.description || '',
            status: task.status || 'pending',
            priority: task.priority || '',
            assignee: task.user_id || user.id, // Keep for backward compatibility
            assignees: assignees, // Multiple assignees
            dueDate: task.due_date ? task.due_date.split('T')[0] : '',
            documentationLinks: Array.isArray(docLinks) ? docLinks : []
        });
        setNewDocLink('');
        setShowTaskForm(true);
    };

    const validateGoogleDocsLink = (url) => {
        try {
            const urlObj = new URL(url);
            // Check if it's a Google Docs link
            const isGoogleDocs = urlObj.hostname === 'docs.google.com' && 
                (urlObj.pathname.includes('/document/') || 
                 urlObj.pathname.includes('/spreadsheets/') || 
                 urlObj.pathname.includes('/presentation/') ||
                 urlObj.pathname.includes('/forms/'));
            return isGoogleDocs;
        } catch (e) {
            return false;
        }
    };

    const handleAddDocLink = () => {
        const trimmedLink = newDocLink.trim();
        if (trimmedLink) {
            if (!validateGoogleDocsLink(trimmedLink)) {
                alert('Vui lòng chỉ nhập link Google Docs (Document, Spreadsheet, Presentation, hoặc Form)');
                return;
            }
            setFormData({
                ...formData,
                documentationLinks: [...formData.documentationLinks, trimmedLink]
            });
            setNewDocLink('');
        }
    };

    const handleRemoveDocLink = (index) => {
        setFormData({
            ...formData,
            documentationLinks: formData.documentationLinks.filter((_, i) => i !== index)
        });
    };

    const handleSubmitTask = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                status: formData.status,
                priority: formData.priority || null,
                assignee: formData.assignee ? parseInt(formData.assignee) : null, // Backward compatibility
                assignees: formData.assignees && formData.assignees.length > 0 
                    ? formData.assignees.map(a => parseInt(a)).filter(id => !isNaN(id))
                    : (formData.assignee ? [parseInt(formData.assignee)] : [user.id]),
                dueDate: formData.dueDate || null,
                documentationLinks: formData.documentationLinks.filter(link => link && link.trim())
            };

            if (editingTask) {
                await api.put(`/todos/${editingTask.id}`, payload);
            } else {
                await api.post('/todos', payload);
            }
            
            setShowTaskForm(false);
            setEditingTask(null);
            fetchTodos();
            if (onTaskUpdate) onTaskUpdate();
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể lưu task');
        }
    };

    const handleCloseForm = () => {
        setShowTaskForm(false);
        setEditingTask(null);
        setFormData({
            title: '',
            description: '',
            status: 'pending',
            priority: '',
            assignee: user.id,
            dueDate: ''
        });
    };

    if (loading) return <div className="list-skeleton">...Loading</div>;

    return (
        <div className="todo-list-wrapper">
            <div className="list-header">
                <h3><i className="fas fa-tasks"></i> QUẢN LÝ CÔNG VIỆC</h3>
                <div className="header-actions">
                    {user.role !== 'member' && (
                        <>
                            <div className="filters">
                                <select 
                                    value={filters.status} 
                                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                                    className="filter-select"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="pending">Chờ xử lý</option>
                                    <option value="in_progress">Đang làm</option>
                                    <option value="done">Hoàn thành</option>
                                </select>
                                <select 
                                    value={filters.priority} 
                                    onChange={(e) => setFilters({...filters, priority: e.target.value})}
                                    className="filter-select"
                                >
                                    <option value="">Tất cả mức độ</option>
                                    <option value="high">Cao</option>
                                    <option value="medium">Trung bình</option>
                                    <option value="low">Thấp</option>
                                </select>
                                <select 
                                    value={filters.assignee} 
                                    onChange={(e) => setFilters({...filters, assignee: e.target.value})}
                                    className="filter-select"
                                >
                                    <option value="">Tất cả người dùng</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.email}</option>
                                    ))}
                                </select>
                                {(filters.status || filters.priority || filters.assignee) && (
                                    <button 
                                        className="clear-filters-btn"
                                        onClick={() => setFilters({ status: '', priority: '', assignee: '' })}
                                    >
                                        Xóa bộ lọc
                                    </button>
                                )}
                            </div>
                            <button className="add-task-btn" onClick={handleCreateTask}>
                                <i className="fas fa-plus"></i> Giao việc mới
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="table-responsive">
                <table className="dt-table">
                    <thead>
                        <tr>
                            <th 
                                className={sortConfig.key === 'title' ? 'sortable active' : 'sortable'}
                                onClick={() => {
                                    setSortConfig({
                                        key: 'title',
                                        direction: sortConfig.key === 'title' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                                    });
                                }}
                            >
                                Nội dung công việc
                                <i className={`fas fa-sort${sortConfig.key === 'title' ? `-${sortConfig.direction === 'asc' ? 'up' : 'down'}` : ''}`}></i>
                            </th>
                            <th>Tài liệu/Links</th>
                            <th 
                                className={sortConfig.key === 'priority' ? 'sortable active' : 'sortable'}
                                onClick={() => {
                                    setSortConfig({
                                        key: 'priority',
                                        direction: sortConfig.key === 'priority' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                                    });
                                }}
                            >
                                Mức độ
                                <i className={`fas fa-sort${sortConfig.key === 'priority' ? `-${sortConfig.direction === 'asc' ? 'up' : 'down'}` : ''}`}></i>
                            </th>
                            <th 
                                className={sortConfig.key === 'status' ? 'sortable active' : 'sortable'}
                                onClick={() => {
                                    setSortConfig({
                                        key: 'status',
                                        direction: sortConfig.key === 'status' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                                    });
                                }}
                            >
                                Trạng thái
                                <i className={`fas fa-sort${sortConfig.key === 'status' ? `-${sortConfig.direction === 'asc' ? 'up' : 'down'}` : ''}`}></i>
                            </th>
                            {user.role !== 'member' && (
                                <th 
                                    className={sortConfig.key === 'assignee' ? 'sortable active' : 'sortable'}
                                    onClick={() => {
                                        setSortConfig({
                                            key: 'assignee',
                                            direction: sortConfig.key === 'assignee' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                                        });
                                    }}
                                >
                                    Nhân sự
                                    <i className={`fas fa-sort${sortConfig.key === 'assignee' ? `-${sortConfig.direction === 'asc' ? 'up' : 'down'}` : ''}`}></i>
                                </th>
                            )}
                            <th 
                                className={sortConfig.key === 'due_date' ? 'sortable active' : 'sortable'}
                                onClick={() => {
                                    setSortConfig({
                                        key: 'due_date',
                                        direction: sortConfig.key === 'due_date' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                                    });
                                }}
                            >
                                Hạn chót
                                <i className={`fas fa-sort${sortConfig.key === 'due_date' ? `-${sortConfig.direction === 'asc' ? 'up' : 'down'}` : ''}`}></i>
                            </th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {todos.length === 0 ? (
                            <tr>
                                <td colSpan={user.role !== 'member' ? 7 : 6} className="empty-state-cell">
                                    <div className="empty-state-message">
                                        <i className="fas fa-inbox"></i>
                                        <p>Không có công việc nào</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            [...todos].sort((a, b) => {
                                if (!sortConfig.key) return 0;
                                
                                let aValue, bValue;
                                
                                switch (sortConfig.key) {
                                    case 'title':
                                        aValue = (a.title || '').toLowerCase();
                                        bValue = (b.title || '').toLowerCase();
                                        break;
                                    case 'priority':
                                        // Priority order: high (3) > medium (2) > low (1)
                                        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1, '': 0 };
                                        aValue = priorityOrder[a.priority || ''] || 0;
                                        bValue = priorityOrder[b.priority || ''] || 0;
                                        break;
                                    case 'status':
                                        const statusOrder = { 'pending': 1, 'in_progress': 2, 'done': 3 };
                                        aValue = statusOrder[a.status || 'pending'] || 0;
                                        bValue = statusOrder[b.status || 'pending'] || 0;
                                        break;
                                    case 'due_date':
                                        aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
                                        bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
                                        break;
                                    case 'assignee':
                                        aValue = (a.assignees?.[0]?.full_name || a.owner_name || '').toLowerCase();
                                        bValue = (b.assignees?.[0]?.full_name || b.owner_name || '').toLowerCase();
                                        break;
                                    default:
                                        return 0;
                                }
                                
                                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                                return 0;
                            }).map(todo => (
                            <tr key={todo.id}>
                                <td className="td-title">
                                    <strong>{todo.title}</strong>
                                    <span className="td-desc">{todo.description}</span>
                                </td>
                                <td className="td-docs">
                                    {todo.documentation_links && (() => {
                                        let links = [];
                                        try {
                                            links = typeof todo.documentation_links === 'string' 
                                                ? JSON.parse(todo.documentation_links) 
                                                : todo.documentation_links;
                                        } catch (e) {
                                            links = [];
                                        }
                                        return links.length > 0 ? (
                                            <div className="doc-links-inline">
                                                {links.map((link, idx) => (
                                                    <a 
                                                        key={idx} 
                                                        href={link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="doc-link-inline"
                                                        title={link}
                                                    >
                                                        <i className="fas fa-link"></i> Tài liệu {idx + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="no-docs">---</span>
                                        );
                                    })()}
                                    {!todo.documentation_links && <span className="no-docs">---</span>}
                                </td>
                                <td>
                                    <span className={`priority-tag ${todo.priority || 'medium'}`}>
                                        {todo.priority === 'high' ? '🔥 Cao' : 
                                         todo.priority === 'low' ? '⬇ Thấp' : 
                                         todo.priority === 'medium' ? '➡ Trung bình' : '➡ Trung bình'}
                                    </span>
                                </td>
                                <td><select 
    className={`status-select ${todo.status}`}
    value={todo.status}
    // 1. Thêm sự kiện onChange ở đây
    onChange={(e) => handleStatusChange(todo.id, e.target.value)}
    // 2. Member chỉ được sửa task của chính mình, Admin/SuperAdmin sửa được tất cả
    disabled={user.role === 'member' && user.id !== todo.user_id && user.id !== todo.created_by}
>
    <option value="pending">Chờ xử lý</option>
    <option value="in_progress">Đang làm</option>
    <option value="done">Hoàn thành</option>
</select>
                                </td>
                                {user.role !== 'member' && (
                                    <td>
                                        {todo.assignees && Array.isArray(todo.assignees) && todo.assignees.length > 0 ? (
                                            <div className="assignees-list">
                                                {todo.assignees.map((assignee, idx) => (
                                                    <div key={assignee.id || idx} className="owner-box">
                                                        <img 
                                                            src={assignee.avatar || 'https://via.placeholder.com/32?text=' + (assignee.full_name?.[0] || assignee.email?.[0] || 'U')} 
                                                            alt="avt"
                                                            onError={(e) => {
                                                                e.target.src = 'https://via.placeholder.com/32?text=' + (assignee.full_name?.[0] || assignee.email?.[0] || 'U');
                                                            }}
                                                        />
                                                        <span>{assignee.full_name || assignee.email || 'Unknown'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="owner-box">
                                                <img 
                                                    src={todo.owner_avatar || 'https://via.placeholder.com/32?text=' + (todo.owner_name?.[0] || 'U')} 
                                                    alt="avt"
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/32?text=' + (todo.owner_name?.[0] || 'U');
                                                    }}
                                                />
                                                <span>{todo.owner_name || '---'}</span>
                                            </div>
                                        )}
                                    </td>
                                )}
                                <td className={todo.due_date && new Date(todo.due_date) < new Date() && todo.status !== 'done' ? 'overdue' : ''}>
    {todo.due_date ? new Date(todo.due_date).toLocaleDateString('vi-VN') : '---'}
</td>
                                <td className="td-actions">
                                    <div className="action-buttons-group">
                                        {(user.role !== 'member' || todo.user_id === user.id) && (
                                            <button 
                                                className="action-btn-text edit" 
                                                onClick={() => handleEditTask(todo)}
                                                title="Chỉnh sửa"
                                            >
                                                Chỉnh sửa
                                            </button>
                                        )}
                                        
                                        {user.role !== 'member' && (
                                            <button 
                                                className="action-btn-text delete" 
                                                onClick={() => handleDelete(todo.id)}
                                                title="Xóa"
                                            >
                                                Xóa
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Task Form Modal */}
            {showTaskForm && (
                <div className="modal-overlay" onClick={handleCloseForm}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingTask ? 'Chỉnh sửa Task' : 'Tạo Task Mới'}</h3>
                            <button className="close-btn" onClick={handleCloseForm}>×</button>
                        </div>
                        <form onSubmit={handleSubmitTask}>
                            <div className="form-group">
                                <label>Tiêu đề *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows="3"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Trạng thái</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="pending">Chờ xử lý</option>
                                        <option value="in_progress">Đang làm</option>
                                        <option value="done">Hoàn thành</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Mức độ ưu tiên</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                    >
                                        <option value="">Chọn mức độ</option>
                                        <option value="high">Cao</option>
                                        <option value="medium">Trung bình</option>
                                        <option value="low">Thấp</option>
                                    </select>
                                </div>
                            </div>
                            {user.role !== 'member' && (
                                <div className="form-group">
                                    <label>Giao cho (có thể chọn nhiều người)</label>
                                    <select
                                        multiple
                                        value={formData.assignees}
                                        onChange={(e) => {
                                            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                            setFormData({
                                                ...formData,
                                                assignees: selectedOptions,
                                                assignee: selectedOptions[0] || user.id // Keep for backward compatibility
                                            });
                                        }}
                                        className="multi-select"
                                        size="5"
                                    >
                                        {users.map(u => (
                                            <option key={u.id} value={u.id.toString()}>
                                                {u.email} ({u.role})
                                            </option>
                                        ))}
                                    </select>
                                    <small className="form-hint">Giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều người</small>
                                </div>
                            )}
                            <div className="form-group">
                                <label>Hạn chót</label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Tài liệu tham khảo / Links (Chỉ Google Docs)</label>
                                <div className="doc-links-input">
                                    <input
                                        type="url"
                                        placeholder="https://docs.google.com/document/d/..."
                                        value={newDocLink}
                                        onChange={(e) => setNewDocLink(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddDocLink();
                                            }
                                        }}
                                    />
                                    <button type="button" onClick={handleAddDocLink} className="add-link-btn">
                                        <i className="fas fa-plus"></i> Thêm
                                    </button>
                                </div>
                                {formData.documentationLinks.length > 0 && (
                                    <div className="doc-links-list">
                                        {formData.documentationLinks.map((link, index) => (
                                            <div key={index} className="doc-link-item">
                                                <a href={link} target="_blank" rel="noopener noreferrer" className="doc-link">
                                                    <i className="fas fa-external-link-alt"></i> {link}
                                                </a>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveDocLink(index)}
                                                    className="remove-link-btn"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={handleCloseForm}>Hủy</button>
                                <button type="submit">{editingTask ? 'Cập nhật' : 'Tạo'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodoList;