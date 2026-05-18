import axios from "axios";
import { notification } from "antd";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("keyhub_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem("keyhub_token");
      localStorage.removeItem("keyhub_user");
      window.location.href = "/login";
    }

    if (status === 403) {
      notification.error({
        title: "Access denied",
        description: error?.response?.data?.message || "You are not allowed to perform this action."
      });
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong."
  );
}

export function getBackendUrl(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith("http")) return filePath;
  return `${import.meta.env.VITE_BACKEND_URL || "http://localhost:8080"}/${filePath}`;
}

export default api;
