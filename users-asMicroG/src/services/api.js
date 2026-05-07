import axios from "axios";
import { cacheGet, cacheSet } from "./apiCache";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Endpoints where client-side caching is safe (public read-only data)
const CACHEABLE_PREFIXES = ["/products", "/banners"];

const isCacheable = (url) => CACHEABLE_PREFIXES.some((p) => url.startsWith(p));

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach JWT access token
api.interceptors.request.use((config) => {
  const tokens = JSON.parse(localStorage.getItem("tokens") || "null");
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

// Wrap api.get to serve cached responses for public endpoints
const _get = api.get.bind(api);
api.get = async (url, config = {}) => {
  if (isCacheable(url)) {
    const qs = config.params ? "?" + new URLSearchParams(config.params).toString() : "";
    const key = url + qs;
    const cached = cacheGet(key);
    if (cached) return { data: cached };
    const res = await _get(url, config);
    cacheSet(key, res.data);
    return res;
  }
  return _get(url, config);
};

// Auto-refresh token on 401
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeRefresh = (cb) => refreshSubscribers.push(cb);
const onRefreshed = (token) => { refreshSubscribers.forEach((cb) => cb(token)); refreshSubscribers = []; };

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      const tokens = JSON.parse(localStorage.getItem("tokens") || "null");
      if (!tokens?.refresh) {
        isRefreshing = false;
        localStorage.removeItem("tokens");
        const url = originalRequest.url || "";
        const isPublic = url.includes("/cart") || url.includes("/products") || url.includes("/banners");
        if (!isPublic) window.location.href = "/auth";
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: tokens.refresh,
        });
        const newTokens = { ...tokens, access: data.access };
        localStorage.setItem("tokens", JSON.stringify(newTokens));
        onRefreshed(data.access);
        isRefreshing = false;
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch {
        isRefreshing = false;
        localStorage.removeItem("tokens");
        window.location.href = "/auth";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
