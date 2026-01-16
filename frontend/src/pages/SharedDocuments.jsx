import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import UserMenu from '../components/UserMenu';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import logo from '../assets/ductri-logo.png';
import '../styles/Dashboard.css';
import '../styles/SharedDocuments.css';

const SharedDocuments = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        document_url: '',
        shared_with_user_ids: []
    });

    useEffect(() => {
        fetchDocuments();
        fetchUsers();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/documents');
            setDocuments(response.data.data || []);
        } catch (err) {
            console.error('Error fetching documents:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/activities');
            setUsers(response.data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/documents', formData);
            setShowForm(false);
            setFormData({
                title: '',
                description: '',
                document_url: '',
                shared_with_user_ids: []
            });
            fetchDocuments();
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể chia sẻ tài liệu');
        }
    };

    const handleDelete = async (id) => {
        const document = documents.find(d => d.id === id);
        const isOwner = document?.shared_by_id === user?.id;
        const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
        
        // Original files are protected from deletion by members
        if (!isOwner && !isAdmin) {
            alert('Bạn chỉ có thể xóa tài liệu do chính mình chia sẻ. Tài liệu gốc được bảo vệ khỏi việc xóa bởi thành viên khác.');
            return;
        }
        
        let confirmMessage = 'Bạn có chắc muốn xóa tài liệu này?';
        if (!isOwner && isAdmin) {
            confirmMessage = 'Bạn đang xóa tài liệu của người khác với quyền quản trị viên. Bạn có chắc chắn?';
        }
        
        if (!window.confirm(confirmMessage)) return;
        
        try {
            await api.delete(`/documents/${id}`);
            fetchDocuments();
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể xóa tài liệu');
        }
    };

    const handleShareToggle = (userId) => {
        setFormData(prev => {
            const current = prev.shared_with_user_ids || [];
            if (current.includes(userId)) {
                return { ...prev, shared_with_user_ids: current.filter(id => id !== userId) };
            } else {
                return { ...prev, shared_with_user_ids: [...current, userId] };
            }
        });
    };

    return (
        <div className="dashboard-layout">
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">
                    <i className="fas fa-school"></i> DUC TRI ADMIN
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" className={({isActive}) => isActive ? "active" : ""} end>
                        <i className="fas fa-home"></i> Tổng quan
                    </NavLink>
                    <NavLink to="/shared-documents" className={({isActive}) => isActive ? "active" : ""}>
                        <i className="fas fa-file-alt"></i> Tài liệu chia sẻ
                    </NavLink>
                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                        <NavLink to="/super-admin?tab=users" className={({isActive}) => isActive ? "active" : ""}>
                            <i className="fas fa-users-cog"></i> Quản lý người dùng
                        </NavLink>
                    )}
                    {user?.role === 'super_admin' && (
                        <>
                            <NavLink to="/super-admin?tab=whitelist" className={({isActive}) => isActive ? "active" : ""}>
                                <i className="fas fa-shield-check"></i> Email Whitelist
                            </NavLink>
                            <NavLink to="/super-admin?tab=audit" className={({isActive}) => isActive ? "active" : ""}>
                                <i className="fas fa-history"></i> Audit Logs
                            </NavLink>
                        </>
                    )}
                </nav>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-left">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input type="text" placeholder="Tìm kiếm nhanh..." />
                        </div>
                    </div>
                    <div className="header-center">
                        <img src={logo} alt="Duc Tri Logo" className="header-logo" />
                    </div>
                    <div className="header-right">
                        <UserMenu />
                    </div>
                </header>

                <section className="dashboard-body">
                    <div className="shared-documents-content">
                        <div className="documents-header">
                            <h2><i className="fas fa-file-alt"></i> Tài liệu chia sẻ</h2>
                            <button className="btn-primary" onClick={() => setShowForm(true)}>
                                <i className="fas fa-plus"></i> Chia sẻ tài liệu mới
                            </button>
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <i className="fas fa-spinner fa-spin"></i> Đang tải...
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-folder-open"></i>
                                <p>Chưa có tài liệu nào được chia sẻ</p>
                            </div>
                        ) : (
                            <div className="documents-grid">
                                {documents.map(doc => (
                                    <div key={doc.id} className="document-card">
                                        <div className="document-header">
                                            <h3>{doc.title}</h3>
                                            {/* Members can only delete their own documents, Admins/SuperAdmins can delete any */}
                                            {(doc.shared_by_id === user?.id || user?.role === 'admin' || user?.role === 'super_admin') && (
                                                <button 
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(doc.id)}
                                                    title={doc.shared_by_id === user?.id ? "Xóa tài liệu của bạn" : "Xóa tài liệu (Quản trị viên)"}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                        {doc.description && (
                                            <p className="document-description">{doc.description}</p>
                                        )}
                                        <div className="document-info">
                                            <div className="info-item">
                                                <i className="fas fa-user"></i>
                                                <span>Chia sẻ bởi: {doc.shared_by_name || doc.shared_by_email}</span>
                                            </div>
                                            <div className="info-item">
                                                <i className="fas fa-calendar"></i>
                                                <span>{new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        </div>
                                        <div className="document-shared-with">
                                            <strong>Chia sẻ với:</strong>
                                            {doc.shared_with && doc.shared_with.length > 0 ? (
                                                <div className="shared-users">
                                                    {doc.shared_with.map(sharedUser => (
                                                        <span key={sharedUser.id} className="user-badge">
                                                            {sharedUser.full_name || sharedUser.email}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="no-share">Chưa chia sẻ với ai</span>
                                            )}
                                        </div>
                                        <a 
                                            href={doc.document_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="document-link"
                                        >
                                            <i className="fas fa-external-link-alt"></i> Mở tài liệu
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Share Document Modal */}
                    {showForm && (
                        <div className="modal-overlay" onClick={() => setShowForm(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>Chia sẻ tài liệu mới</h3>
                                    <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label>Tiêu đề tài liệu *</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            required
                                            placeholder="Ví dụ: Hướng dẫn sử dụng hệ thống"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Mô tả</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder="Mô tả về tài liệu này..."
                                            rows="3"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Link tài liệu *</label>
                                        <input
                                            type="url"
                                            value={formData.document_url}
                                            onChange={(e) => setFormData({...formData, document_url: e.target.value})}
                                            required
                                            placeholder="https://docs.google.com/..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Chia sẻ với (có thể chọn nhiều người)</label>
                                        <div className="users-checkbox-list">
                                            {users
                                                .filter(u => u.id !== user?.id) // Don't show yourself
                                                .map(u => (
                                                    <label key={u.id} className="checkbox-item">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.shared_with_user_ids?.includes(u.id) || false}
                                                            onChange={() => handleShareToggle(u.id)}
                                                        />
                                                        <span>{u.email} ({u.role})</span>
                                                    </label>
                                                ))}
                                        </div>
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" onClick={() => setShowForm(false)}>Hủy</button>
                                        <button type="submit">Chia sẻ</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default SharedDocuments;
