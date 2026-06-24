import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginApi } from "../../api/auth.api.js";
import { authStore } from "./auth.store.js";

export default function LoginPage() {
  const [username, setUsername] = useState("superadmin");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (response) => {
      authStore.setAccessToken(response.data.accessToken);
      authStore.setUser(response.data.user);

      queryClient.invalidateQueries({ queryKey: ["auth"] });

      const redirectTo = location.state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <LogIn size={26} />
          </div>

          <h1 className="text-2xl font-black text-slate-950 dark:text-white">
            School ERP Login
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            THAKUR VIRENDRA SINGH MEMORIAL SCHOOL
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              Username
            </label>

            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                placeholder="Enter password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {loginMutation.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              {loginMutation.error.message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
