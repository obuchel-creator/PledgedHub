import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('pledgehub_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = async (formData) => {
  const res = await API.post('/auth/register', formData);
  return res.data;
};

export const loginUser = async (credentials) => {
  const res = await API.post('/auth/login', credentials);
  return res.data;
};

export const getCampaigns = async () => {
  const res = await API.get('/campaigns');
  return res.data;
};

export const logoutUser = () => {
  localStorage.removeItem('pledgehub_token');
  localStorage.removeItem('user');
};

// Password management
export const changePassword = async (currentPassword, newPassword) => {
  const res = await API.post('/password/change', { currentPassword, newPassword });
  return res.data;
};

// Two-factor authentication
export const setup2FA = async () => {
  const res = await API.post('/2fa/setup');
  return res.data;
};

export const verify2FA = async (token) => {
  const res = await API.post('/2fa/verify', { token });
  return res.data;
};

export const disable2FA = async (password) => {
  const res = await API.post('/2fa/disable', { password });
  return res.data;
};

export const get2FAStatus = async () => {
  const res = await API.get('/2fa/status');
  return res.data;
};

// Export user data
export const exportUserData = async () => {
  const res = await API.get('/users/export');
  return res.data;
};
