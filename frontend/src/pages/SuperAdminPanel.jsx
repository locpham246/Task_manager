import { useEffect, useState } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import UserActivityTable from '../components/UserActivityTable';
import AuditLogList from '../components/AuditLogList';
import WhitelistManagement from '../components/WhitelistManagement';
import UserMenu from '../components/UserMenu';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { getStatus } from '../utils/statusHelper';
import { formatLoginTime, formatLastActivity, maskIP } from '../utils/timeHelper';
import logo from '../assets/ductri-logo.png';
import '../styles/SuperAdminPanel.css';
import '../styles/Dashboard.css'; 

const SuperAdminPanel = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'users');
  const [editingUser, setEditingUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('member');
  const [expandedIPs, setExpandedIPs] = useState({});
  
  const toggleIP = (userId) => {
    setExpandedIPs(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['users', 'activities', 'audit', 'whitelist'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [activitiesRes, usersRes] = await Promise.all([
        api.get('/admin/activities'),
        api.get('/admin/users')
      ]);
      setActivities(activitiesRes.data);
      setUsers(usersRes.data.data || usersRes.data || []);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu:", err);
    }
  };

  const handleEditRole = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setShowRoleModal(true);
  };

  const handleDeleteUser = (userToDelete) => {
    if (window.confirm(`Bạn có chắc muốn xóa người dùng ${userToDelete.email}? Hành động này không thể hoàn tác.`)) {
      deleteUser(userToDelete.id);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchData();
      alert('Xóa người dùng thành công');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa người dùng');
    }
  };

  const handleUpdateRole = async () => {
    try {
      await api.put(`/admin/users/${editingUser.id}`, { role: selectedRole });
      setShowRoleModal(false);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật vai trò');
    }
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
          {user?.role !== 'member' && (
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
            <img src={logo} alt="Đức Trí Logo" className="header-logo" />
          </div>
          <div className="header-right">
            <UserMenu />
          </div>
        </header>

        <section className="dashboard-body">
          <div className="super-admin-panel">
            <div className="panel-header">
              <h2><i className="fas fa-shield-alt"></i> Bảng điều khiển Super Admin</h2>
              <div className="stats">
                <div className="stat-card">
                  <span className="stat-label">Người dùng online</span>
                  <span className="stat-value">{activities.filter(a => getStatus(a.last_active_at) === 'Online').length}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Tổng người dùng</span>
                  <span className="stat-value">{users.length}</span>
                </div>
              </div>
            </div>

            <div className="tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => {
            setActiveTab('users');
            setSearchParams({ tab: 'users' });
          }}
        >
          <i className="fas fa-users"></i> Quản lý người dùng
        </button>
        <button 
          className={activeTab === 'activities' ? 'active' : ''} 
          onClick={() => {
            setActiveTab('activities');
            setSearchParams({ tab: 'activities' });
          }}
        >
          <i className="fas fa-chart-line"></i> Hoạt động
        </button>
        {user?.role === 'super_admin' && (
          <button 
            className={activeTab === 'whitelist' ? 'active' : ''} 
            onClick={() => {
              setActiveTab('whitelist');
              setSearchParams({ tab: 'whitelist' });
            }}
          >
            <i className="fas fa-shield-check"></i> Email Whitelist
          </button>
        )}
        <button 
          className={activeTab === 'audit' ? 'active' : ''} 
          onClick={() => {
            setActiveTab('audit');
            setSearchParams({ tab: 'audit' });
          }}
        >
          <i className="fas fa-history"></i> Audit Logs
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'users' && (
          <div className="content-card">
            <div className="list-header">
              <h3><i className="fas fa-users-cog"></i> Danh sách người dùng</h3>
            </div>
            <div className="table-responsive">
              <table className="dt-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Tên</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Đăng nhập lúc</th>
                    <th>Hoạt động cuối</th>
                    <th>IP & Thiết bị</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-state-cell">
                        <div className="empty-state-message">
                          <i className="fas fa-users"></i>
                          <p>Không có người dùng nào</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map(userRow => {
                      const isIPExpanded = expandedIPs[userRow.id];
                      const displayIP = userRow.last_ip_address ? (isIPExpanded ? userRow.last_ip_address : maskIP(userRow.last_ip_address)) : '---';
                      
                      return (
                        <tr key={userRow.id}>
                          <td>{userRow.email}</td>
                          <td>{userRow.full_name}</td>
                          <td>
                            <span className={`role-badge ${userRow.role}`}>
                              {userRow.role === 'super_admin' ? 'Super Admin' : 
                               userRow.role === 'admin' ? 'Admin' : 'Member'}
                            </span>
                          </td>
                          <td>
                            <span className={getStatus(userRow.last_active_at) === 'Online' ? 'status-online' : 'status-offline'}>
                              {getStatus(userRow.last_active_at)}
                            </span>
                          </td>
                          <td>{userRow.session_start ? formatLoginTime(userRow.session_start) : '---'}</td>
                          <td>{userRow.last_active_at ? formatLastActivity(userRow.last_active_at) : '---'}</td>
                          <td>
                            {userRow.last_ip_address ? (
                              <div className="ip-device-cell">
                                <span 
                                  className="ip-display" 
                                  onClick={() => toggleIP(userRow.id)}
                                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                  title="Click để xem/hide IP đầy đủ"
                                >
                                  {displayIP}
                                </span>
                                {userRow.last_device_info && (
                                  <span className="device-info"> • {userRow.last_device_info}</span>
                                )}
                              </div>
                            ) : (
                              '---'
                            )}
                          </td>
                          <td>
                            {user?.role === 'super_admin' && (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button 
                                  className="action-btn-text edit"
                                  onClick={() => handleEditRole(userRow)}
                                  title="Thay đổi vai trò"
                                >
                                  Thay đổi vai trò
                                </button>
                                {userRow.id !== user?.id && (
                                  <button 
                                    className="action-btn-text delete"
                                    onClick={() => handleDeleteUser(userRow)}
                                    title="Xóa người dùng"
                                  >
                                    Xóa
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="content-card">
            <UserActivityTable users={activities} />
          </div>
        )}

        {activeTab === 'whitelist' && (
          <WhitelistManagement />
        )}

        {activeTab === 'audit' && (
          <AuditLogList />
        )}
            </div>

            {/* Role Change Modal */}
            {showRoleModal && editingUser && (
              <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Thay đổi vai trò</h3>
                    <button className="close-btn" onClick={() => setShowRoleModal(false)}>×</button>
                  </div>
                  <div className="form-group">
                    <label>Người dùng</label>
                    <input type="text" value={editingUser.email} disabled />
                  </div>
                  <div className="form-group">
                    <label>Vai trò mới</label>
                    <select 
                      value={selectedRole} 
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setShowRoleModal(false)}>Hủy</button>
                    <button onClick={handleUpdateRole}>Cập nhật</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SuperAdminPanel; 