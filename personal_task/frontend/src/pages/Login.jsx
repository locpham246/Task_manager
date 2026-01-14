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
          <img src={logo} alt="Logo" className="logo" />
          <h1>Hệ thống Nội bộ</h1>
        </header>

        <section className="login-body">
          <p className="hint">Vui lòng dùng email trường </p>
          <GoogleLoginButton />
        </section>
      </div>
    </div>
  );
};

export default Login;