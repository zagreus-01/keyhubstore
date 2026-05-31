import { useCallback, useMemo } from "react";
import { logoutUser, refreshProfile, selectAuth, selectIsAuthenticated, setCredentials } from "../../store/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

export default function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const login = useCallback((data) => {
    dispatch(setCredentials(data));
  }, [dispatch]);

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
    window.location.href = "/login";
  }, [dispatch]);

  const refreshCurrentProfile = useCallback(() => dispatch(refreshProfile()), [dispatch]);

  return useMemo(
    () => ({
      ...auth,
      isAuthenticated,
      login,
      logout,
      refreshProfile: refreshCurrentProfile
    }),
    [auth, isAuthenticated, login, logout, refreshCurrentProfile]
  );
}
