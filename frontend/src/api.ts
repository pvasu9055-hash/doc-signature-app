import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = (data: { name: string; email: string; password: string }) =>
  API.post('/auth/register', data);

export const login = (data: { email: string; password: string }) =>
  API.post('/auth/login', data);

export const forgotPassword = (data: { email: string }) =>
  API.post('/auth/forgot-password', data);

export const resetPassword = (data: { token: string; newPassword: string }) =>
  API.post('/auth/reset-password', data);

export const updateProfile = (data: { name: string; email: string }) =>
  API.put('/auth/profile', data);

export const uploadDocument = (formData: FormData) =>
  API.post('/docs/upload', formData);

export const getDocuments = () =>
  API.get('/docs');

export const getDocument = (id: number) =>
  API.get(`/docs/${id}`);

export const BACKEND_URL = BASE_URL;