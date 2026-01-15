import api from './api';

export const loginWithGoogle = async (googleToken) => {
  const response = await api.post('/auth/google', { token: googleToken });
  return response.data;
};