// src/api/axios.config.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response, // keep AxiosResponse
  (error) => {
    const { response } = error || {};
    const structuredError = {
      status: response?.status,
      message:
        response?.data?.message ||
        response?.data?.error ||
        'Something went wrong',
      errors: response?.data?.errors ?? null,
    };
    // Override Axios default text
    error.message = structuredError.message;
    return Promise.reject(structuredError); // or Promise.reject(error);
  }
);

export default api;
