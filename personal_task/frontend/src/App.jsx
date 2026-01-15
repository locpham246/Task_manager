import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SuperAdminPanel from './pages/SuperAdminPanel';
import { useAuth } from './hooks/useAuth';

const PrivateRoute = ({ children, roleRequired }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Đang tải...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roleRequired && user.role !== roleRequired) return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/super-admin" element={
          <PrivateRoute roleRequired="super_admin"><SuperAdminPanel /></PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}
export default App;