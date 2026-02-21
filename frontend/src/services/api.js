/**
 * API service layer – centralized axios instance with JWT interceptor.
 */
import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getKPIs: (params) => api.get('/dashboard/kpis', { params }),
};

// ── Vehicles ─────────────────────────────────────────────────────────────────
export const vehiclesAPI = {
  list: (params) => api.get('/vehicles/', { params }),
  get: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles/', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  retire: (id) => api.post(`/vehicles/${id}/retire`),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

// ── Trips ────────────────────────────────────────────────────────────────────
export const tripsAPI = {
  list: (params) => api.get('/trips/', { params }),
  get: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips/', data),
  dispatch: (id) => api.post(`/trips/${id}/dispatch`),
  complete: (id, data) => api.post(`/trips/${id}/complete`, data),
  cancel: (id) => api.post(`/trips/${id}/cancel`),
};

// ── Drivers ──────────────────────────────────────────────────────────────────
export const driversAPI = {
  list: (params) => api.get('/drivers/', { params }),
  get: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers/', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
};

// ── Maintenance ──────────────────────────────────────────────────────────────
export const maintenanceAPI = {
  list: (params) => api.get('/maintenance/', { params }),
  get: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance/', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
};

// ── Finance ──────────────────────────────────────────────────────────────────
export const financeAPI = {
  fuelLogs: (params) => api.get('/finance/fuel-logs', { params }),
  createFuelLog: (data) => api.post('/finance/fuel-logs', data),
  deleteFuelLog: (id) => api.delete(`/finance/fuel-logs/${id}`),
  expenses: (params) => api.get('/finance/expenses', { params }),
  createExpense: (data) => api.post('/finance/expenses', data),
  deleteExpense: (id) => api.delete(`/finance/expenses/${id}`),
  summary: () => api.get('/finance/summary'),
  monthly: () => api.get('/finance/monthly'),
  topExpensive: (limit = 5) => api.get('/finance/top-expensive', { params: { limit } }),
  idleVehicles: () => api.get('/finance/idle-vehicles'),
};

export default api;
