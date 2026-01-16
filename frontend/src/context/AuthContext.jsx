// src/context/AuthContext.js
import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { logout as logoutService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await logoutService();
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
          
          // Track user activity on login
          try {
            await api.post('/auth/track-activity');
          } catch (e) {
            // Silently fail - activity tracking is not critical
          }
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

  // Track user activity periodically while logged in
  useEffect(() => {
    if (!user) return;
    
    // Track activity immediately
    const trackActivity = async () => {
      try {
        await api.post('/auth/track-activity');
      } catch (e) {
        // Silently fail
      }
    };
    
    trackActivity();
    
    // Track activity every 2 minutes
    const interval = setInterval(trackActivity, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {!loading ? children : <div className="loading-screen">Đang tải hệ thống...</div>}
    </AuthContext.Provider>
  );
};