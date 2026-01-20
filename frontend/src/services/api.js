import axios from 'axios';

// Determine API URL based on environment
// In production (via NPM): use relative path /api (no port, same origin)
// In local dev: use http://localhost:5000/api
// If VITE_API_URL is set, use it (for Docker builds)
const getApiUrl = () => {
  // If VITE_API_URL is explicitly set (from Docker env), use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Check if we're on localhost (local development)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Production: use relative path (NPM will proxy /api to backend)
  // This works because NPM forwards /api/* to backend service
  return '/api';
};

const API_URL = getApiUrl();

const api = axios.create({
    baseURL: API_URL,
    withCredentials: false // Explicitly set to false for JWT auth
});

// Request interceptor: Always get the latest token from localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor: Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, remove it
            localStorage.removeItem('token');
            // Redirect to login if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;