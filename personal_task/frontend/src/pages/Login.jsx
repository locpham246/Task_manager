import GoogleLoginButton from '../components/GoogleLoginButton';

const Login = () => {
  return (
    <div className="login-container">
      <h1>Hệ thống Nội bộ</h1>
      <p>Vui lòng đăng nhập bằng tài khoản Google công ty</p>
      <GoogleLoginButton />
    </div>
  );
};