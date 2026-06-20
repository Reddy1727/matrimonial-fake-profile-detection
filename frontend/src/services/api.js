import axios from 'axios';

// BASE_URL is the root of the backend server
export const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// API_BASE_URL is the path to the API endpoints
const API_BASE_URL = `${BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;