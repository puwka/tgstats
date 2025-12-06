import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  // Attach initData to every request
  if (window.Telegram?.WebApp?.initData) {
    config.headers.Authorization = window.Telegram.WebApp.initData;
  }
  return config;
});

