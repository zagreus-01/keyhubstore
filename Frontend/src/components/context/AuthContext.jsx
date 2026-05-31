import { useEffect } from "react";
import { setToken } from "../../store/authSlice";
import { useAppDispatch } from "../../store/hooks";

export function AuthProvider({ children }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handler = (event) => {
      if (event?.detail?.token) {
        dispatch(setToken(event.detail.token));
      }
    };

    window.addEventListener("keyhub_token_refreshed", handler);
    return () => window.removeEventListener("keyhub_token_refreshed", handler);
  }, [dispatch]);

  return children;
}
