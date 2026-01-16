import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import SuperAdminPanel from '../pages/SuperAdminPanel';
import SharedDocuments from '../pages/SharedDocuments';
import Login from '../pages/Login';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute allowedRoles={['member', 'admin', 'super_admin']} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/shared-documents" element={<SharedDocuments />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
        <Route path="/admin" element={<Navigate to="/super-admin" replace />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
        <Route path="/super-admin" element={<SuperAdminPanel />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;