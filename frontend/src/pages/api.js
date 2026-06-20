import axios from 'axios';

export const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API_BASE_URL = `${BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;