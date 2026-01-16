import { useAuth } from '../hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import '../styles/UserMenu.css';

const UserMenu = ({ onShowProfile, onShowSettings }) => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <div className="user-menu-container" ref={dropdownRef}>
            <div className="user-profile-trigger" onClick={() => setIsOpen(!isOpen)}>
                <img src={user.avatar || user.picture} alt="avatar" className="avatar-img" />
                <div className="user-brief">
                    <span className="user-name">{user.full_name || user.name}</span>
                    <span className={`role-badge ${user.role}`}>{user.role.toUpperCase()}</span>
                </div>
                <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
            </div>

            {isOpen && (
                <div className="user-dropdown-menu">
                    <div className="dropdown-info">
                        <strong>{user.full_name}</strong>
                        <span>{user.email}</span>
                    </div>
                    <hr />
                    <button 
                        className="dropdown-item"
                        onClick={() => {
                            if (onShowProfile) onShowProfile();
                            setIsOpen(false);
                        }}
                    >
                        <i className="fas fa-user-circle"></i> Hồ sơ của tôi
                    </button>
                    {user.role === 'super_admin' && (
                        <button 
                            className="dropdown-item"
                            onClick={() => {
                                if (onShowSettings) onShowSettings();
                                setIsOpen(false);
                            }}
                        >
                            <i className="fas fa-cog"></i> Cài đặt hệ thống
                        </button>
                    )}
                    <hr />
                    <button className="dropdown-item logout-item" onClick={logout}>
                        <i className="fas fa-sign-out-alt"></i> Đăng xuất
                    </button>
                </div>
            )}
        </div>
    );
};
export default UserMenu;