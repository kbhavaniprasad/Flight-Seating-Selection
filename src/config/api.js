const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultApiBase = import.meta.env.DEV
  ? ''
  : 'https://flight-seating-selection.onrender.com';

export const API_BASE_URL = (configuredApiBase || defaultApiBase).replace(/\/$/, '');

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
