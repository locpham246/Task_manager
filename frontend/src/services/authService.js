import api from './api';

export const loginWithGoogle = async (googleToken) => {
  const response = await api.post('/auth/google', { token: googleToken });
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('token');
  }
};