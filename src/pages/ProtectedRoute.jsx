import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getRoleHomePath } from "../services/roleRoutes.js";

/**
 * Guards nested routes until auth is restored, then enforces optional role access.
 *
 * @param {{ allowedRoles?: string[] }} props Route guard props.
 * @returns {import("react").ReactElement | null} Redirect or nested route outlet.
 */
function ProtectedRoute({ allowedRoles }) {
  // Subscribe to restored auth state before deciding whether to render or redirect nested routes.
  const { isAuthenticated, user, loading } = useAuth();
  const role = user?.role;

  if (loading) {
    // Avoid redirecting while AuthProvider is still restoring a persisted session.
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Keep authenticated users out of the wrong role area without losing browser history hygiene.
    return <Navigate to={getRoleHomePath(role)} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
