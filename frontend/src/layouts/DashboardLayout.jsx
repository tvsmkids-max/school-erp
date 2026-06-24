import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelTop,
  School,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  UserRound,
  Users,
  X,
  DatabaseBackup,
} from "lucide-react";

import { logoutApi } from "../api/auth.api.js";
import { myMenuApi } from "../api/menus.api.js";
import { authStore } from "../features/auth/auth.store.js";
import { useAuth } from "../hooks/useAuth.js";

const iconMap = {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  PanelTop,
  School,
  SlidersHorizontal,
  Users,
  UserRound,
  ShieldCheck,
  Settings,
  DatabaseBackup,
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark"),
  );

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const menuQuery = useQuery({
    queryKey: ["menus", "me"],
    queryFn: myMenuApi,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      authStore.clearAuth();
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const menus = menuQuery.data?.data || [];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <GraduationCap size={22} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black">School ERP</p>
              <p className="truncate text-xs font-semibold text-slate-500">
                MPBSE Board
              </p>
            </div>
          </div>

          <button
            type="button"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-4">
          {menuQuery.isLoading ? (
            <p className="px-3 py-2 text-sm font-semibold text-slate-500">
              Loading menu...
            </p>
          ) : null}

          {menus.map((group) => (
            <div key={group.key} className="mb-4">
              {group.path ? (
                <SidebarLink
                  item={group}
                  onClick={() => setSidebarOpen(false)}
                />
              ) : (
                <p className="px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
              )}

              <div className="space-y-1">
                {(group.children || []).map((child) => (
                  <SidebarLink
                    key={child.key}
                    item={child}
                    onClick={() => setSidebarOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}

          {!menuQuery.isLoading && menus.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500 dark:bg-slate-950">
              No menu permissions found.
            </div>
          ) : null}
        </nav>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-200 p-2 dark:border-slate-800 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-black sm:text-base">
                THAKUR VIREND SINGH MEMORIAL SCHOOL
              </h1>
              <p className="truncate text-xs font-semibold text-slate-500">
                ERP Console
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-slate-200 p-2 dark:border-slate-800"
              title="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="hidden text-right sm:block">
              <p className="max-w-36 truncate text-sm font-bold">
                {user?.fullName || "User"}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {user?.roleName || user?.roleKey}
              </p>
            </div>

            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              className="rounded-xl bg-red-600 p-2 text-white transition hover:bg-red-700"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ item, onClick }) {
  const Icon = iconMap[item.icon] || LayoutDashboard;

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`
      }
    >
      <Icon size={18} />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}
