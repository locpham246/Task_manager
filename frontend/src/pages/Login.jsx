import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GoogleLoginButton from '../components/GoogleLoginButton';
import '../styles/Login.css';
import logo from '../assets/ductri-logo.png';

const Login = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Đang kiểm tra phiên làm việc...</p>
    </div>
  );

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <img src={logo} alt="Đức Trí School Logo" className="logo" />
          <h1>Hệ thống Quản lý Công việc</h1>
          <p className="subtitle">Trường Đức Trí</p>
        </header>

        <section className="login-body">
          <p className="hint">
            <i className="fas fa-info-circle"></i>
            Vui lòng sử dụng email trường (@ductridn.edu.vn)
          </p>
          <GoogleLoginButton />
          <div className="security-badge">
            <i className="fas fa-shield-alt"></i>
            <span>Bảo mật bởi Google OAuth</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;