import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Simple in-memory cache for admin GET requests (2 min TTL)
const _cache = new Map();
const CACHE_TTL = 2 * 60 * 1000;
const CACHEABLE = ["/products/admin/categories", "/products/admin/products"];

const getCached = (key) => {
  const e = _cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return e.data;
};
const setCached = (key, data) => _cache.set(key, { data, ts: Date.now() });
export const invalidateCache = (prefix) => {
  _cache.forEach((_, k) => { if (k.startsWith(prefix)) _cache.delete(k); });
};

const api = axios.create({ baseURL: BASE_URL, headers: { "Content-Type": "application/json" } });

api.interceptors.request.use((config) => {
  const tokens = JSON.parse(localStorage.getItem("admin_tokens") || "null");
  if (tokens?.access) config.headers.Authorization = `Bearer ${tokens.access}`;
  return config;
});

// Wrap GET for caching
const _get = api.get.bind(api);
api.get = async (url, config = {}) => {
  if (CACHEABLE.some((p) => url.startsWith(p))) {
    const qs = config.params ? "?" + new URLSearchParams(config.params).toString() : "";
    const key = url + qs;
    const cached = getCached(key);
    if (cached) return { data: cached };
    const res = await _get(url, config);
    setCached(key, res.data);
    return res;
  }
  return _get(url, config);
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_tokens");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
