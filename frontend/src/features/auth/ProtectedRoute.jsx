import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { authStore } from "./auth.store.js";

export default function ProtectedRoute() {
  const location = useLocation();
  const { token, isLoading, isError } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-700 shadow-soft dark:bg-slate-900 dark:text-slate-200">
          <Loader2 className="animate-spin text-blue-600" size={20} />
          Loading secure session...
        </div>
      </div>
    );
  }

  if (isError) {
    authStore.clearAuth();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
