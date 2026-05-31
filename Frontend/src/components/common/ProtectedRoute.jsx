import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth";

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0) {
    const normalizedRole = String(user?.role || "").toLowerCase();
    const allowed = roles.map((role) => String(role || "").toLowerCase());
    if (!allowed.includes(normalizedRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
