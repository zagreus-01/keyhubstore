 import axios from "axios";
import { notification } from "./feedback";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    "Content-Type": "application/json"
  }
});

let refreshPromise = null;

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
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;
    const requestUrl = originalRequest?.url || "";
    const shouldSkipRefresh = originalRequest?._skipAuthRefresh || requestUrl.includes("/auth/refresh-token");

    // Attempt token refresh when receiving 401 and a refresh token exists
    if (status === 401 && originalRequest && !originalRequest._retry && !shouldSkipRefresh) {
      const refreshToken = localStorage.getItem("keyhub_refresh");
      if (refreshToken) {
        try {
          originalRequest._retry = true;
          if (!refreshPromise) {
            refreshPromise = axios
              .post(`${BACKEND_URL}/api/auth/refresh-token`, { refreshToken }, { _skipAuthRefresh: true })
              .finally(() => {
                refreshPromise = null;
              });
          }

          const resp = await refreshPromise;
          const newAccessToken = resp.data.data.accessToken;
          if (newAccessToken) {
            localStorage.setItem("keyhub_token", newAccessToken);
            // notify other parts of the app that token was refreshed
            try {
              window.dispatchEvent(new CustomEvent("keyhub_token_refreshed", { detail: { token: newAccessToken } }));
            } catch {
              // ignore in non-browser environments
            }
            // update Authorization header and retry original request
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          }
        } catch {
          // fall through to logout
        }
      }

      // no valid refresh -> force logout
      localStorage.removeItem("keyhub_token");
      localStorage.removeItem("keyhub_user");
      localStorage.removeItem("keyhub_refresh");
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

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
  const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${backendUrl}${normalizedPath}`;
}

export default api;
