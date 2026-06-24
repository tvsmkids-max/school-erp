import { useQuery } from "@tanstack/react-query";
import { CalendarDays, GraduationCap, Layers, ShieldCheck, Users } from "lucide-react";
import { axiosClient } from "../../api/axiosClient.js";
import { useAuth } from "../../hooks/useAuth.js";

const getClasses = () => axiosClient.get("/classes?limit=100");
const getSessions = () => axiosClient.get("/academic-sessions?limit=100");
const getUsers = () => axiosClient.get("/users?limit=10");
const getSections = () => axiosClient.get("/sections?limit=100");

export default function DashboardPage() {
  const { user } = useAuth();

  const classesQuery = useQuery({ queryKey: ["dashboard", "classes"], queryFn: getClasses });
  const sessionsQuery = useQuery({ queryKey: ["dashboard", "sessions"], queryFn: getSessions });
  const usersQuery = useQuery({ queryKey: ["dashboard", "users"], queryFn: getUsers });
  const sectionsQuery = useQuery({ queryKey: ["dashboard", "sections"], queryFn: getSections });

  const cards = [
    {
      title: "Classes",
      value: classesQuery.data?.meta?.total ?? "-",
      icon: GraduationCap,
      color: "bg-blue-600",
    },
    {
      title: "Sections",
      value: sectionsQuery.data?.meta?.total ?? "-",
      icon: Layers,
      color: "bg-violet-600",
    },
    {
      title: "Academic Sessions",
      value: sessionsQuery.data?.meta?.total ?? "-",
      icon: CalendarDays,
      color: "bg-emerald-600",
    },
    {
      title: "Users",
      value: usersQuery.data?.meta?.total ?? "-",
      icon: Users,
      color: "bg-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
              Welcome back
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
              {user?.fullName || "ERP User"}
            </h1>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Role: {user?.roleName || user?.roleKey} · Foundation module dashboard
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-black text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
            <ShieldCheck size={20} />
            Secure Session Active
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">
            Current Focus
          </h2>

          <ul className="mt-4 space-y-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <li>? Authentication APIs connected</li>
            <li>? RBAC permission-based menus connected</li>
            <li>? Foundation settings backend ready</li>
            <li>?? Next: User Management frontend screens</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">
            Login Permissions
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {(user?.permissions || []).slice(0, 12).map((permission) => (
              <span
                key={permission}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {permission}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {value}
          </p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
