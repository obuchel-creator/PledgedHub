
import axios from "axios";
import { getViteEnv } from '../utils/getViteEnv';
const API_URL = getViteEnv().API_URL || "http://localhost:5000/api";
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
