// src/context/AuthContext.js
import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Token is automatically added by axios interceptor in api.js
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (e) {
          console.error('Token validation failed:', e.message);
          localStorage.removeItem('token');
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {!loading ? children : <div className="loading-screen">Đang tải hệ thống...</div>}
    </AuthContext.Provider>
  );
};