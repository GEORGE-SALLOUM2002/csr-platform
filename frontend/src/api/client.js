/**
 * عميل axios موحّد للاتصال بالـ API.
 * - يضيف توكن الدخول (Bearer) تلقائياً لكل طلب.
 * - يجدّد التوكن تلقائياً عند انتهائه (401) باستخدام refresh token.
 * عنوان الـ API يُقرأ من متغير البيئة VITE_API_URL (راجع .env).
 */
import axios from "axios";

// عنوان الـ API: يُقرأ من VITE_API_URL وقت البناء.
// الافتراضي "/api" (نفس النطاق عبر Nginx في الإنتاج). للتطوير المحلّي اضبط
// VITE_API_URL في frontend/.env على عنوان خادم Django (مثل http://localhost:8000/api).
export const API_BASE = import.meta.env.VITE_API_URL || "/api";

const client = axios.create({ baseURL: API_BASE });

// إضافة التوكن لكل طلب
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("csr-access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// تجديد التوكن عند انتهائه
let refreshing = null;
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (response && response.status === 401 && config && !config._retry) {
      const refresh = localStorage.getItem("csr-refresh");
      if (refresh) {
        config._retry = true;
        try {
          if (!refreshing) {
            refreshing = axios.post(`${API_BASE}/auth/refresh/`, { refresh });
          }
          const res = await refreshing;
          refreshing = null;
          localStorage.setItem("csr-access", res.data.access);
          config.headers.Authorization = `Bearer ${res.data.access}`;
          return client(config);
        } catch (e) {
          refreshing = null;
          localStorage.removeItem("csr-access");
          localStorage.removeItem("csr-refresh");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
