import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
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

export const uploadDocument = (formData: FormData) =>
  API.post('/docs/upload', formData);

export const getDocuments = () =>
  API.get('/docs');

export const getDocument = (id: number) =>
  API.get(`/docs/${id}`);