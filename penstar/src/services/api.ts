import axios from "axios";
import { message } from "antd";
export const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
instance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("penstar_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
    }
    return config;
  },
  (error) => Promise.reject(error)
);
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem("penstar_token");
      } catch {
      }
      message.error("Unauthorized — vui lòng đăng nhập lại");
      if (!window.location.pathname.includes("/bookings/success")) {
        window.location.href = "/signin";
      }
    }
    return Promise.reject(err);
  }
);
export default instance;
