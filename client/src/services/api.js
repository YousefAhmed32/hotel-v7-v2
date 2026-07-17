import axios from 'axios';
import toast from 'react-hot-toast';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const api = axios.create({ baseURL: BASE_URL, withCredentials: true, headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
api.interceptors.request.use((config) => { const token = localStorage.getItem('accessToken'); if (token) config.headers.Authorization = 'Bearer ' + token; return config; }, (error) => Promise.reject(error));
let isRefreshing = false; let failedQueue = [];
const processQueue = (error, token = null) => { failedQueue.forEach((prom) => { if (error) prom.reject(error); else prom.resolve(token); }); failedQueue = []; };
api.interceptors.response.use((response) => response, async (error) => {
  const originalRequest = error.config;
  if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
    if (isRefreshing) return new Promise((resolve, reject) => { failedQueue.push({ resolve, reject }); }).then((token) => { originalRequest.headers.Authorization = 'Bearer ' + token; return api(originalRequest); }).catch((err) => Promise.reject(err));
    originalRequest._retry = true; isRefreshing = true;
    try {
      const { data } = await api.post('/auth/refresh');
      const newToken = data.data.accessToken;
      localStorage.setItem('accessToken', newToken);
      api.defaults.headers.common.Authorization = 'Bearer ' + newToken;
      processQueue(null, newToken);
      originalRequest.headers.Authorization = 'Bearer ' + newToken;
      return api(originalRequest);
    } catch (refreshError) { processQueue(refreshError, null); localStorage.removeItem('accessToken'); window.location.href = '/auth/login'; return Promise.reject(refreshError); }
    finally { isRefreshing = false; }
  }
  const message = error.response?.data?.message || error.message || 'Something went wrong';
  if (error.response?.status !== 401) toast.error(message, { id: 'api-error' });
  return Promise.reject(error);
});
export default api;
