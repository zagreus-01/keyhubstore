import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../../util/api";

const AuthContext = createContext(null);

const LOCAL_USER = "keyhub_user";
const LOCAL_TOKEN = "keyhub_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(LOCAL_USER);
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(LOCAL_TOKEN));

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

  const login = (data) => {
    setToken(data.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(LOCAL_TOKEN);
    localStorage.removeItem(LOCAL_USER);
    window.location.href = "/login";
  };

  const refreshProfile = async () => {
    const response = await api.get("/user/profile");
    setUser(response.data.data);
    return response.data.data;
  };

  const value = useMemo(
    () => ({ user, token, login, logout, refreshProfile, isAuthenticated: Boolean(user && token) }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
