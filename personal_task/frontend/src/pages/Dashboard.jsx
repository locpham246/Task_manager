import React from 'react';
import { NavLink } from 'react-router-dom';
import UserMenu from '../components/UserMenu';
import TodoList from '../components/TodoList';
import { useAuth } from '../hooks/useAuth';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="dashboard-layout">
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">
                    <i className="fas fa-school"></i> DUC TRI ADMIN
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" className={({isActive}) => isActive ? "active" : ""}>
                        <i className="fas fa-home"></i> Tổng quan
                    </NavLink>
                    <NavLink to="/tasks" className={({isActive}) => isActive ? "active" : ""}>
                        <i className="fas fa-tasks"></i> Quản lý Task
                    </NavLink>
                    {user?.role !== 'member' && (
                        <>
                            <NavLink to="/admin" className={({isActive}) => isActive ? "active" : ""}>
                                <i className="fas fa-users-cog"></i> Quản lý nhân sự
                            </NavLink>
                        </>
                    )}
                    
                    {user?.role === 'super_admin' && (
                        <NavLink to="/super-admin" className={({isActive}) => isActive ? "active" : ""}>
                            <i className="fas fa-history"></i> Audit Logs
                        </NavLink>
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
                    <div className="header-right">
                        <UserMenu />
                    </div>
                </header>

                <section className="dashboard-body">
                    <div className="welcome-section">
                        <div className="welcome-text">
                            <h2>Chào mừng, {user?.full_name}! 👋</h2>
                            <p>Hệ thống quản lý công việc trường Đức Trí ({user?.role?.toUpperCase()})</p>
                        </div>
                    </div>
                    
                    <div className="content-card">
                        <TodoList />
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;