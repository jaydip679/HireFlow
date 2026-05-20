import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

// Fallback to localhost if not specified in environment
const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: `${VITE_API_URL}/api`,
  withCredentials: true, // Send httpOnly cookies automatically
});

// Request Interceptor: Inject JWT from Zustand store in-memory state
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Elegant 401 Silent Token Rotation Queuing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops or redundant calls on auth endpoints themselves
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url.includes('/auth/refresh') ||
      originalRequest.url.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    const errorCode = error.response.data?.code;

    // Intercept and rotate only if access token expired
    if (errorCode === 'TOKEN_EXPIRED') {
      if (isRefreshing) {
        // Enqueue parallel requests to resolve once refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Trigger silent token refresh to backend (httpOnly cookie sent automatically)
        const res = await axiosInstance.post('/auth/refresh');
        const { accessToken, user } = res.data.data;

        // Save new credentials in Zustand
        useAuthStore.getState().login(user, accessToken);

        // Resume all suspended queue calls
        processQueue(null, accessToken);

        // Re-fire original request with updated token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        // Invalidation indicates security breaches or session expirations
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
