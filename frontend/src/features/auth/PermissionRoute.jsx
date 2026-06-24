import { Navigate, Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";

export default function PermissionRoute({ permission }) {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(permission)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <ShieldAlert className="mx-auto mb-4" size={42} />
          <h1 className="text-xl font-black">Access Denied</h1>
          <p className="mt-2 text-sm font-semibold">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
