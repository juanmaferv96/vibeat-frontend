import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // ✅ usa proxy de Vite
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;

