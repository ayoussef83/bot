import axios from 'axios';

// In production we serve frontend + backend behind the same origin (ALB/Global Accelerator),
// so prefer same-origin API to avoid cross-origin/CORS issues.
// In development, keep using NEXT_PUBLIC_API_URL (or localhost backend) for local workflows.
const isProd = process.env.NODE_ENV === 'production';
const API_URL =
  typeof window !== 'undefined' && isProd
    ? '/api'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
