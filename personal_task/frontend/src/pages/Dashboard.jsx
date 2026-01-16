import React from 'react';
import UserMenu from '../components/UserMenu';
import TodoList from '../components/TodoList';
import '../styles/Dashboard.css';

const Dashboard = () => {
    return (
        <div className="dashboard-layout">
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">DUC TRI ADMIN</div>
                <nav className="sidebar-nav">
                    <a href="/" className="active"><i className="fas fa-home"></i> Tổng quan</a>
                    <a href="/tasks"><i className="fas fa-tasks"></i> Công việc</a>
                </nav>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-search">
                        <input type="text" placeholder="Tìm kiếm công việc..." />
                    </div>
                    <UserMenu />
                </header>

                <section className="dashboard-body">
                    <div className="welcome-banner">
                        <h2>Chào mừng trở lại!</h2>
                        <p>Hệ thống quản lý nội bộ trường Đức Trí</p>
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