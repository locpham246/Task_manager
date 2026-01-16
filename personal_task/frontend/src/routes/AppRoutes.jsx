import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import AdminPanel from '../pages/AdminPanel';
import SuperAdminPanel from '../pages/SuperAdminPanel';
import Login from '../pages/Login';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute allowedRoles={['member', 'admin', 'super_admin']} />}>
        <Route path="/" element={<Dashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
        <Route path="/admin" element={<AdminPanel />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route path="/super-admin" element={<SuperAdminPanel />} />
      </Route>
    </Routes>
  );
};