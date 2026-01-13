import { GoogleLogin } from '@react-oauth/google';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { loginWithGoogle } from '../services/authService';

const GoogleLoginButton = () => {
  const { setUser } = useContext(AuthContext);

  const handleSuccess = async (response) => {
    try {
      const data = await loginWithGoogle(response.credential);
      setUser(data.user); 
    } catch (error) {
      alert("Chỉ email nội bộ mới có quyền truy cập!");
    }
  };

  return (
    <GoogleLogin 
      onSuccess={handleSuccess} 
      onError={() => console.log('Login Failed')} 
      useOneTap 
    />
  );
};

export default GoogleLoginButton;