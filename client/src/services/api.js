import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const TOKEN_KEY = 'compensation_jwt';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  }
);

export function getErrorMessage(err, fallback = 'Something went wrong') {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data.message === 'string') {
    const d = data.details;
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      if (d.pendingCount !== undefined) {
        return data.message;
      }
      if (d.totalBudget !== undefined && d.alreadyApproved !== undefined && d.thisProposalCost !== undefined) {
        const remaining = d.totalBudget - d.alreadyApproved;
        return `${data.message} Budget remaining: ${formatUsd(remaining)}; this change costs ${formatUsd(d.thisProposalCost)}.`;
      }
    }
    return data.message;
  }
  if (Array.isArray(data.details)) {
    const first = data.details[0];
    if (first?.msg) return first.msg;
  }
  return fallback;
}

function formatUsd(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}
