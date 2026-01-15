import { useNavigate } from 'react-router-dom';
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; 
import { loginWithGoogle } from '../services/authService';
import { GoogleLogin } from '@react-oauth/google'; 

const GoogleLoginButton = () => {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); 

  const handleSuccess = async (response) => {
    setLoading(true);
    try {
      const data = await loginWithGoogle(response.credential);
      localStorage.setItem('token', data.token); 
      setUser(data.user); 
      navigate('/dashboard'); 
    } catch (error) {
      console.error("Login Error:", error);
      alert(error.response?.data?.message || "Đăng nhập thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.6 : 1 }}>
      <GoogleLogin 
        onSuccess={handleSuccess} 
        onError={() => alert('Kết nối Google thất bại')} 
        useOneTap={false}
        ux_mode="popup"
        theme="outline"
        size="large"
        text="signin_with"
      />
      {loading && <p>Đang xác thực, vui lòng chờ...</p>}
    </div>
  );
};

export default GoogleLoginButton;