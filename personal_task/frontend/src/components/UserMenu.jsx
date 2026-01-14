import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import '../styles/UserMenu.css';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="user-menu-container">
      <div className="user-profile" onClick={() => setIsOpen(!isOpen)}>
        <div className="user-info-text">
          <span className="user-name">{user.full_name || user.name}</span>
          <span className="user-role">{user.role.toUpperCase()}</span>
        </div>
        <img 
          src={user.avatar || user.picture || 'https://via.placeholder.com/40'} 
          alt="avatar" 
          className="user-avatar" 
        />
      </div>

      {isOpen && (
        <div className="user-dropdown">
          <div className="dropdown-header">
            <p className="email">{user.email}</p>
          </div>
          <hr />
          <button className="logout-btn" onClick={logout}>
            <i className="fas fa-sign-out-alt"></i> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;