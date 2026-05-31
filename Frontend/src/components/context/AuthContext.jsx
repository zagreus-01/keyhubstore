import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "../../util/api";
import AuthContext from "./authContextValue";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const LOCAL_USER = "keyhub_user";
const LOCAL_TOKEN = "keyhub_token";
const LOCAL_REFRESH = "keyhub_refresh";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(LOCAL_USER);
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(LOCAL_TOKEN));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(LOCAL_REFRESH));

  useEffect(() => {
    if (user) {
      localStorage.setItem(LOCAL_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_USER);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(LOCAL_TOKEN, token);
    } else {
      localStorage.removeItem(LOCAL_TOKEN);
    }
  }, [token]);

  // listen for token refresh events (dispatched from api.js)
  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.token) {
        setToken(e.detail.token);
      }
    };
    window.addEventListener("keyhub_token_refreshed", handler);
    return () => window.removeEventListener("keyhub_token_refreshed", handler);
  }, []);

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem(LOCAL_REFRESH, refreshToken);
    } else {
      localStorage.removeItem(LOCAL_REFRESH);
    }
  }, [refreshToken]);

  const login = useCallback((data) => {
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken || null);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    const storedRefreshToken = refreshToken || localStorage.getItem(LOCAL_REFRESH);

    if (storedRefreshToken) {
      try {
        await axios.post(`${BACKEND_URL}/api/auth/logout`, {
          refreshToken: storedRefreshToken
        });
      } catch {
        // Still clear local session even if the server token is already gone.
      }
    }

    setToken(null);
    setUser(null);
    setRefreshToken(null);
    localStorage.removeItem(LOCAL_TOKEN);
    localStorage.removeItem(LOCAL_USER);
    localStorage.removeItem(LOCAL_REFRESH);
    window.location.href = "/login";
  }, [refreshToken]);

  const refreshProfile = useCallback(async () => {
    const response = await api.get("/user/profile");
    setUser(response.data.data);
    return response.data.data;
  }, []);

  const value = useMemo(
    () => ({ user, token, refreshToken, login, logout, refreshProfile, isAuthenticated: Boolean(user && token) }),
    [user, token, refreshToken, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
