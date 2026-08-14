import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  role,
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-sm font-semibold text-[var(--muted)]">
          Loading SkillArena...
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role protection
  if (role && user.role !== role) {
    // Admin trying to access a student-only route
    if (user.role === "ADMIN") {
      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );
    }

    // Student trying to access an admin route
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}