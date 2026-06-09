import axios from 'axios';

const API_URL = import.meta.env.MODE === 'production'
  ? 'https://your-backend.onrender.com'
  : 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export { API_URL };
export default api;
