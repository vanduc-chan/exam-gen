import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
    return Promise.reject(new Error(message));
  }
);

export default api;
