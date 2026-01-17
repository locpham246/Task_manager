import axios from 'axios';

// Use environment variable or fallback to production API
const API_URL = import.meta.env.VITE_API_URL || 'http://it.ductridn.com:5000/api';

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