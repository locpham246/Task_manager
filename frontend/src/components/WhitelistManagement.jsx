import { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/WhitelistManagement.css';

const WhitelistManagement = () => {
  const [whitelist, setWhitelist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({ email: '', notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchWhitelist();
  }, []);

  const fetchWhitelist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/whitelist');
      setWhitelist(response.data.data || []);
    } catch (err) {
      console.error('Error fetching whitelist:', err);
      setError('Không thể tải danh sách whitelist');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email.trim()) {
      setError('Email không được để trống');
      return;
    }

    try {
      await api.post('/admin/whitelist', {
        email: formData.email.trim(),
        notes: formData.notes.trim() || null
      });
      setSuccess('Đã thêm email vào whitelist thành công');
      setFormData({ email: '', notes: '' });
      setShowAddModal(false);
      fetchWhitelist();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể thêm email vào whitelist');
    }
  };

  const handleRemoveEmail = async (email) => {
    if (!window.confirm(`Bạn có chắc muốn xóa email "${email}" khỏi whitelist?`)) {
      return;
    }

    try {
      await api.delete(`/admin/whitelist/${encodeURIComponent(email)}`);
      setSuccess('Đã xóa email khỏi whitelist thành công');
      fetchWhitelist();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa email khỏi whitelist');
    }
  };

  const handleToggleActive = async (email, currentStatus) => {
    try {
      await api.put(`/admin/whitelist/${encodeURIComponent(email)}`, {
        is_active: !currentStatus
      });
      setSuccess(`Đã ${!currentStatus ? 'kích hoạt' : 'vô hiệu hóa'} email thành công`);
      fetchWhitelist();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({ email: entry.email, notes: entry.notes || '' });
    setShowAddModal(true);
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.put(`/admin/whitelist/${encodeURIComponent(editingEntry.email)}`, {
        notes: formData.notes.trim() || null
      });
      setSuccess('Đã cập nhật whitelist thành công');
      setFormData({ email: '', notes: '' });
      setEditingEntry(null);
      setShowAddModal(false);
      fetchWhitelist();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật whitelist');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="content-card">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải danh sách whitelist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-card">
      <div className="list-header">
        <h3><i className="fas fa-shield-check"></i> Quản lý Email Whitelist</h3>
        <button 
          className="add-whitelist-btn"
          onClick={() => {
            setEditingEntry(null);
            setFormData({ email: '', notes: '' });
            setShowAddModal(true);
          }}
        >
          <i className="fas fa-plus"></i> Thêm Email
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> {success}
        </div>
      )}

      <div className="whitelist-info">
        <p>
          <i className="fas fa-info-circle"></i>
          Chỉ các email trong danh sách này mới có thể đăng nhập vào hệ thống. 
          Ngay cả người dùng có cùng domain (@ductridn.edu.vn) cũng sẽ bị chặn nếu không có trong whitelist.
        </p>
      </div>

      <div className="table-responsive">
        <table className="dt-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Ghi chú</th>
              <th>Thêm bởi</th>
              <th>Ngày thêm</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {whitelist.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state-cell">
                  <div className="empty-state-message">
                    <i className="fas fa-inbox"></i>
                    <p>Chưa có email nào trong whitelist</p>
                  </div>
                </td>
              </tr>
            ) : (
              whitelist.map((entry) => (
                <tr key={entry.id}>
                  <td><strong>{entry.email}</strong></td>
                  <td>{entry.notes || <span className="text-muted">---</span>}</td>
                  <td>
                    {entry.added_by_email ? (
                      <span>{entry.added_by_name || entry.added_by_email}</span>
                    ) : (
                      <span className="text-muted">Hệ thống</span>
                    )}
                  </td>
                  <td>{formatDate(entry.added_at)}</td>
                  <td>
                    <span className={`status-badge ${entry.is_active ? 'active' : 'inactive'}`}>
                      {entry.is_active ? (
                        <>
                          <i className="fas fa-check-circle"></i> Hoạt động
                        </>
                      ) : (
                        <>
                          <i className="fas fa-times-circle"></i> Vô hiệu hóa
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn-text edit"
                        onClick={() => handleEdit(entry)}
                        title="Chỉnh sửa"
                      >
                        <i className="fas fa-edit"></i> Chỉnh sửa
                      </button>
                      <button
                        className={`action-btn-text ${entry.is_active ? 'deactivate' : 'activate'}`}
                        onClick={() => handleToggleActive(entry.email, entry.is_active)}
                        title={entry.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                        <i className={`fas fa-${entry.is_active ? 'ban' : 'check'}`}></i>
                        {entry.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      </button>
                      <button
                        className="action-btn-text delete"
                        onClick={() => handleRemoveEmail(entry.email)}
                        title="Xóa"
                      >
                        <i className="fas fa-trash-alt"></i> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setEditingEntry(null);
          setFormData({ email: '', notes: '' });
          setError('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEntry ? 'Chỉnh sửa Whitelist' : 'Thêm Email vào Whitelist'}</h3>
              <button className="close-btn" onClick={() => {
                setShowAddModal(false);
                setEditingEntry(null);
                setFormData({ email: '', notes: '' });
                setError('');
              }}>×</button>
            </div>
            <form onSubmit={editingEntry ? handleUpdateEmail : handleAddEmail}>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@ductridn.edu.vn"
                  required
                  disabled={!!editingEntry}
                />
                {editingEntry && (
                  <p className="form-hint">Email không thể thay đổi sau khi đã thêm</p>
                )}
              </div>
              <div className="form-group">
                <label>Ghi chú (tùy chọn)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú về người dùng này..."
                  rows="3"
                />
              </div>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '15px' }}>
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" onClick={() => {
                  setShowAddModal(false);
                  setEditingEntry(null);
                  setFormData({ email: '', notes: '' });
                  setError('');
                }}>
                  Hủy
                </button>
                <button type="submit">
                  {editingEntry ? 'Cập nhật' : 'Thêm Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhitelistManagement;
