// ==========================================
// Apple Worm Adventure - Frontend API Configuration
// ==========================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GAME_NAME = import.meta.env.VITE_GAME_NAME || 'Apple Worm Adventure';

/**
 * Standardized fetch helper that automatically adds JWT Authorization header
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('awa_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export { API_BASE_URL, GAME_NAME };


