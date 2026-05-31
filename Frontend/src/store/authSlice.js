import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../util/api";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const LOCAL_USER = "keyhub_user";
const LOCAL_TOKEN = "keyhub_token";
const LOCAL_REFRESH = "keyhub_refresh";

const readJson = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const persistAuth = ({ user, token, refreshToken }) => {
  if (user) {
    localStorage.setItem(LOCAL_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_USER);
  }

  if (token) {
    localStorage.setItem(LOCAL_TOKEN, token);
  } else {
    localStorage.removeItem(LOCAL_TOKEN);
  }

  if (refreshToken) {
    localStorage.setItem(LOCAL_REFRESH, refreshToken);
  } else {
    localStorage.removeItem(LOCAL_REFRESH);
  }
};

const initialState = {
  user: readJson(LOCAL_USER),
  token: localStorage.getItem(LOCAL_TOKEN),
  refreshToken: localStorage.getItem(LOCAL_REFRESH)
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload?.user || null;
      state.token = action.payload?.accessToken || action.payload?.token || null;
      state.refreshToken = action.payload?.refreshToken || null;
      persistAuth(state);
    },
    setToken(state, action) {
      state.token = action.payload || null;
      persistAuth(state);
    },
    setUser(state, action) {
      state.user = action.payload || null;
      persistAuth(state);
    },
    clearAuth(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      persistAuth(state);
    }
  }
});

export const { clearAuth, setCredentials, setToken, setUser } = authSlice.actions;

export const logoutUser = () => async (dispatch, getState) => {
  const refreshToken = getState().auth.refreshToken || localStorage.getItem(LOCAL_REFRESH);

  if (refreshToken) {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, { refreshToken });
    } catch {
      // Local logout still succeeds if the server-side refresh token is already invalid.
    }
  }

  dispatch(clearAuth());
};

export const refreshProfile = () => async (dispatch) => {
  const response = await api.get("/user/profile");
  const user = response.data.data;
  dispatch(setUser(user));
  return user;
};

export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => Boolean(state.auth.user && state.auth.token);

export default authSlice.reducer;
