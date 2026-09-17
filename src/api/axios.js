// src/api/axios.js
import axios from "axios";

// Define API base — reads from .env, falls back to localhost
const API_BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/v1";

// ============================================
// Authenticated API instance (dashboard usage)
// ============================================
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ============================================
// Public API instance (no auth redirect)
// Used for public admission portal, school directory, etc.
// ============================================
const publicApi = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor to ensure public requests NEVER force a login redirect on 401
publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Silently reject error without clearing token or redirecting to /login
    return Promise.reject(error);
  }
);

export { publicApi };
export default api;