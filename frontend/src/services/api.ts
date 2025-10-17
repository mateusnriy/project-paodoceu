import axios from 'axios';

const baseURL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3333/api';

export const api = axios.create({
  baseURL: baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
