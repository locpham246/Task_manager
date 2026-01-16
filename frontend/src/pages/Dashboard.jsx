import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import UserMenu from '../components/UserMenu';
import TodoList from '../components/TodoList';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import logo from '../assets/ductri-logo.png';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalTasks: 0,
        myTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        doneTasks: 0,
        overdueTasks: 0,
        upcomingDeadlines: 0
    });
    const [loading, setLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [settingsData, setSettingsData] = useState(null);

    // Debug: Log state changes
    useEffect(() => {
        console.log('📊 Dashboard state:', { showProfile, showSettings, profileData, settingsData });
    }, [showProfile, showSettings, profileData, settingsData]);

    useEffect(() => {
        if (user) {
            fetchStats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleShowProfile = async () => {
        console.log('🔍 handleShowProfile called');
        setShowProfile(true);
        setShowSettings(false);
        setProfileData(null); // Reset first
        try {
            const response = await api.get('/auth/me');
            console.log('✅ Profile data fetched:', response.data);
            setProfileData(response.data.user || user);
        } catch (err) {
            console.error('Error fetching profile:', err);
            // Show profile with current user data if API fails
            setProfileData(user);
        }
    };

    const handleShowSettings = async () => {
        console.log('🔍 handleShowSettings called');
        setShowSettings(true);
        setShowProfile(false);
        setSettingsData(null); // Reset first
        try {
            // Fetch system settings data
            const [usersRes, whitelistRes] = await Promise.all([
                api.get('/admin/users').catch(() => ({ data: { data: [] } })),
                api.get('/admin/whitelist').catch(() => ({ data: { data: [] } }))
            ]);
            console.log('✅ Settings data fetched:', { usersRes, whitelistRes });
            setSettingsData({
                totalUsers: usersRes.data.data?.length || usersRes.data.length || 0,
                whitelistCount: whitelistRes.data.data?.length || 0
            });
        } catch (err) {
            console.error('Error fetching settings:', err);
            // Show default values if API fails
            setSettingsData({
                totalUsers: 0,
                whitelistCount: 0
            });
        }
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/todos?limit=1000'); // Get all tasks for stats
            const tasks = response.data.data || [];
            
            const now = new Date();
            const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            const myTasks = tasks.filter(t => t.user_id === user.id);
            const pending = tasks.filter(t => t.status === 'pending');
            const inProgress = tasks.filter(t => t.status === 'in_progress');
            const done = tasks.filter(t => t.status === 'done');
            
            // Overdue tasks (due date passed and not done)
            const overdue = tasks.filter(t => {
                if (!t.due_date || t.status === 'done') return false;
                return new Date(t.due_date) < now;
            });
            
            // Upcoming deadlines (within 7 days)
            const upcoming = tasks.filter(t => {
                if (!t.due_date || t.status === 'done') return false;
                const dueDate = new Date(t.due_date);
                return dueDate >= now && dueDate <= sevenDaysFromNow;
            });

            setStats({
                totalTasks: user.role === 'member' ? myTasks.length : tasks.length,
                myTasks: myTasks.length,
                pendingTasks: user.role === 'member' 
                    ? myTasks.filter(t => t.status === 'pending').length 
                    : pending.length,
                inProgressTasks: user.role === 'member'
                    ? myTasks.filter(t => t.status === 'in_progress').length
                    : inProgress.length,
                doneTasks: user.role === 'member'
                    ? myTasks.filter(t => t.status === 'done').length
                    : done.length,
                overdueTasks: user.role === 'member'
                    ? myTasks.filter(t => {
                        if (!t.due_date || t.status === 'done') return false;
                        return new Date(t.due_date) < now;
                    }).length
                    : overdue.length,
                upcomingDeadlines: user.role === 'member'
                    ? myTasks.filter(t => {
                        if (!t.due_date || t.status === 'done') return false;
                        const dueDate = new Date(t.due_date);
                        return dueDate >= now && dueDate <= sevenDaysFromNow;
                    }).length
                    : upcoming.length
            });
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRoleDisplayName = (role) => {
        const roleMap = {
            'super_admin': 'Super Admin',
            'admin': 'Admin',
            'member': 'Member'
        };
        return roleMap[role] || role;
    };

    const getRoleColor = (role) => {
        const colorMap = {
            'super_admin': '#dc3545',
            'admin': '#007bff',
            'member': '#28a745'
        };
        return colorMap[role] || '#6c757d';
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
                    </div>
                    <div className="header-center">
                        <img src={logo} alt="Đức Trí Logo" className="header-logo" />
                    </div>
                    <div className="header-right">
                        <UserMenu onShowProfile={handleShowProfile} onShowSettings={handleShowSettings} />
                    </div>
                </header>

                <section className="dashboard-body">
                    {/* Welcome Section with Role Badge */}
                    <div className="welcome-section">
                        <div className="welcome-text">
                            <h2>Chào mừng, {user?.full_name || user?.name}!</h2>
                            <p>Hệ thống quản lý công việc trường Đức Trí</p>
                        </div>
                        <div className="role-badge-large" style={{ backgroundColor: getRoleColor(user?.role) }}>
                            <i className={`fas ${user?.role === 'super_admin' ? 'fa-shield-alt' : user?.role === 'admin' ? 'fa-user-cog' : 'fa-user'}`}></i>
                            <span>{getRoleDisplayName(user?.role)}</span>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    {!loading && (
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ backgroundColor: '#007bff20', color: '#007bff' }}>
                                    <i className="fas fa-tasks"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>{stats.totalTasks}</h3>
                                    <p>{user?.role === 'member' ? 'Công việc của tôi' : 'Tổng công việc'}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon" style={{ backgroundColor: '#ffc10720', color: '#ffc107' }}>
                                    <i className="fas fa-clock"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>{stats.pendingTasks}</h3>
                                    <p>Chờ xử lý</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon" style={{ backgroundColor: '#17a2b820', color: '#17a2b8' }}>
                                    <i className="fas fa-spinner"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>{stats.inProgressTasks}</h3>
                                    <p>Đang làm</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon" style={{ backgroundColor: '#28a74520', color: '#28a745' }}>
                                    <i className="fas fa-check-circle"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>{stats.doneTasks}</h3>
                                    <p>Hoàn thành</p>
                                </div>
                            </div>

                            {stats.overdueTasks > 0 && (
                                <div className="stat-card stat-card-warning">
                                    <div className="stat-icon" style={{ backgroundColor: '#dc354520', color: '#dc3545' }}>
                                        <i className="fas fa-exclamation-triangle"></i>
                                    </div>
                                    <div className="stat-content">
                                        <h3>{stats.overdueTasks}</h3>
                                        <p>Quá hạn</p>
                                    </div>
                                </div>
                            )}

                            {stats.upcomingDeadlines > 0 && (
                                <div className="stat-card stat-card-info">
                                    <div className="stat-icon" style={{ backgroundColor: '#6f42c120', color: '#6f42c1' }}>
                                        <i className="fas fa-calendar-alt"></i>
                                    </div>
                                    <div className="stat-content">
                                        <h3>{stats.upcomingDeadlines}</h3>
                                        <p>Hạn chót sắp tới</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Role-specific Quick Actions */}
                    {user?.role !== 'member' && (
                        <div className="quick-actions">
                            <h3><i className="fas fa-bolt"></i> Thao tác nhanh</h3>
                            <div className="action-buttons">
                                <button className="action-btn-primary" onClick={() => document.querySelector('.add-task-btn')?.click()}>
                                    <i className="fas fa-plus"></i> Tạo task mới
                                </button>
                                {user?.role === 'super_admin' && (
                                    <NavLink to="/super-admin?tab=users" className="action-btn-secondary">
                                        <i className="fas fa-users"></i> Quản lý người dùng
                                    </NavLink>
                                )}
                                {user?.role === 'super_admin' && (
                                    <NavLink to="/super-admin?tab=audit" className="action-btn-secondary">
                                        <i className="fas fa-history"></i> Xem Audit Logs
                                    </NavLink>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Deadlines for Members */}
                    {user?.role === 'member' && stats.upcomingDeadlines > 0 && (
                        <div className="upcoming-deadlines">
                            <h3><i className="fas fa-calendar-check"></i> Hạn chót sắp tới</h3>
                            <p>Bạn có {stats.upcomingDeadlines} công việc sắp đến hạn trong 7 ngày tới</p>
                        </div>
                    )}

                    {/* Profile Table */}
                    {showProfile && (
                        <div className="content-card" style={{ marginBottom: '20px' }}>
                            <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3><i className="fas fa-user-circle"></i> Hồ sơ của tôi</h3>
                                <button 
                                    className="close-view-btn"
                                    onClick={() => {
                                        setShowProfile(false);
                                        setProfileData(null);
                                    }}
                                >
                                    <i className="fas fa-times"></i> Đóng
                                </button>
                            </div>
                            <div className="table-responsive">
                                <table className="dt-table">
                                    <tbody>
                                        <tr>
                                            <td style={{ fontWeight: '600', width: '200px' }}>ID</td>
                                            <td>{profileData?.id || user?.id || '---'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: '600' }}>Email</td>
                                            <td>{profileData?.email || user?.email || '---'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: '600' }}>Họ và tên</td>
                                            <td>{profileData?.name || profileData?.full_name || user?.full_name || user?.name || '---'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: '600' }}>Vai trò</td>
                                            <td>
                                                <span className={`role-badge ${profileData?.role || user?.role || 'member'}`}>
                                                    {(profileData?.role || user?.role) === 'super_admin' ? 'Super Admin' : 
                                                     (profileData?.role || user?.role) === 'admin' ? 'Admin' : 'Member'}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: '600' }}>Ảnh đại diện</td>
                                            <td>
                                                {profileData?.picture || profileData?.avatar || user?.avatar || user?.picture ? (
                                                    <img 
                                                        src={profileData?.picture || profileData?.avatar || user?.avatar || user?.picture} 
                                                        alt="Avatar" 
                                                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <span className="text-muted">Chưa có ảnh đại diện</span>
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Settings Table */}
                    {showSettings && user?.role === 'super_admin' && (
                        <div className="content-card" style={{ marginBottom: '20px' }}>
                            <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3><i className="fas fa-cog"></i> Cài đặt hệ thống</h3>
                                <button 
                                    className="close-view-btn"
                                    onClick={() => {
                                        setShowSettings(false);
                                        setSettingsData(null);
                                    }}
                                >
                                    <i className="fas fa-times"></i> Đóng
                                </button>
                            </div>
                            <div className="table-responsive">
                                <table className="dt-table">
                                    <tbody>
                                        <tr>
                                            <td style={{ fontWeight: '600', width: '200px' }}>Tổng số người dùng</td>
                                            <td>{settingsData?.totalUsers || 0}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: '600' }}>Số email trong whitelist</td>
                                            <td>{settingsData?.whitelistCount || 0}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: '600' }}>Trạng thái hệ thống</td>
                                            <td>
                                                <span style={{ color: '#28a745', fontWeight: '600' }}>
                                                    <i className="fas fa-check-circle"></i> Hoạt động bình thường
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: '600' }}>Xác thực</td>
                                            <td>Google OAuth 2.0</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: '600' }}>Kiểm soát truy cập</td>
                                            <td>Email Whitelist</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Main Task List */}
                    <div className="content-card">
                        <TodoList onTaskUpdate={fetchStats} />
                    </div>
                </section>
            </main>
        </div>
    );
};

export { Dashboard as default };
