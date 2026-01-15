import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/TodoList.css';

const TodoList = () => {
    const { user } = useAuth(); 
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchTodos();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchTodos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/todos');
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
    const handleStatusChange = async (id, newStatus) => {
    try {
        await api.patch(`/todos/${id}/status`, { status: newStatus });
        setTodos(todos.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err) {
        alert("Không thể cập nhật trạng thái");
    }
};
    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa task này?')) {
            try {
                await api.delete(`/todos/${id}`);
                setTodos(todos.filter(t => t.id !== id));
            } catch (err) {
                alert(err.response?.data?.message || 'Không thể xóa');
            }
        }
    };

    if (loading) return <div className="list-skeleton">...Loading</div>;

    return (
        <div className="todo-list-wrapper">
            <div className="list-header">
                <h3><i className="fas fa-tasks"></i> QUẢN LÝ CÔNG VIỆC</h3>
                {user.role !== 'member' && (
                    <button className="add-task-btn">
                        <i className="fas fa-plus"></i> Giao việc mới
                    </button>
                )}
            </div>

            <div className="table-responsive">
                <table className="dt-table">
                    <thead>
                        <tr>
                            <th>Nội dung công việc</th>
                            <th>Mức độ</th>
                            <th>Trạng thái</th>
                            {user.role !== 'member' && <th>Nhân sự</th>}
                            <th>Hạn chót</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {todos.map(todo => (
                            <tr key={todo.id}>
                                <td className="td-title">
                                    <strong>{todo.title}</strong>
                                    <span className="td-desc">{todo.description}</span>
                                </td>
                                <td>
                                    <span className={`priority-tag ${todo.priority}`}>
                                        {todo.priority === 'high' ? '🔥 Cao' : 'Bình thường'}
                                    </span>
                                </td>
                                <td><select 
    className={`status-select ${todo.status}`}
    value={todo.status}
    // 1. Thêm sự kiện onChange ở đây
    onChange={(e) => handleStatusChange(todo.id, e.target.value)}
    // 2. Member chỉ được sửa task của chính mình, Admin/SuperAdmin sửa được tất cả
    disabled={user.role === 'member' && user.id !== todo.user_id}
>
    <option value="pending">Chờ xử lý</option>
    <option value="doing">Đang làm</option>
    <option value="done">Hoàn thành</option>
</select>
                                </td>
                                {user.role !== 'member' && (
                                    <td>
                                        <div className="owner-box">
                                            <img src={todo.owner_avatar || '/default-avt.png'} alt="avt" />
                                            <span>{todo.owner_name}</span>
                                        </div>
                                    </td>
                                )}
                                <td className={todo.due_date && new Date(todo.due_date) < new Date() && todo.status !== 'done' ? 'overdue' : ''}>
    {todo.due_date ? new Date(todo.due_date).toLocaleDateString('vi-VN') : '---'}
</td>
                                <td className="td-actions">
                                    <button className="action-btn edit"><i className="fas fa-eye"></i></button>
                                    
                                    {user.role !== 'member' && (
                                        <button 
                                            className="action-btn delete" 
                                            onClick={() => handleDelete(todo.id)}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TodoList;