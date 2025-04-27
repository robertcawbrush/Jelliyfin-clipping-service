import axios from 'axios';
import { store } from '../store';
import { logoutUser } from '../store/slices/authSlice';
import { API_BASE_URL } from '../config';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth headers
axiosInstance.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const { accessToken, userId } = state.auth;
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (userId) {
      config.headers['X-User-Id'] = userId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 responses
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Unauthorized access detected, logging out user');
      // Dispatch logout action
      store.dispatch(logoutUser());
      // Redirect to login page
      window.location.href = '/login';
      // Return a resolved promise with null data to prevent error propagation
      return Promise.resolve({ data: null });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 