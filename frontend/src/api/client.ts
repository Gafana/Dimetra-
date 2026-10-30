import axios from 'axios';

function resolveApiBaseUrl(): string {
  const primary = import.meta.env.VITE_API_URL;
  if (typeof primary === 'string' && primary.trim() !== '') {
    return primary.trim().replace(/\/$/, '');
  }

  const legacy = import.meta.env.VITE_API_BASE_URL;
  if (typeof legacy === 'string' && legacy.trim() !== '') {
    return legacy.trim().replace(/\/$/, '');
  }

  return import.meta.env.DEV ? 'http://localhost:3001' : '';
}

const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const initData = window.Telegram?.WebApp?.initData;
  if (initData) {
    config.headers.set('X-Telegram-Init-Data', initData);
  }
  return config;
});

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
