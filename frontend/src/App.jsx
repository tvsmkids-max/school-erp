import { Link } from "react-router-dom";
import { GraduationCap, Server, ShieldCheck } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
        <section className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
              <GraduationCap size={18} />
              MPBSE School ERP
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              THAKUR VIRENDRA SINGH MEMORIAL SCHOOL
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Enterprise-grade ERP foundation is ready. Authentication, RBAC,
              user management, academic sessions, classes and sections backend
              APIs are being connected step by step.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700"
              >
                Go to Login
              </Link>

              <a
                href="http://localhost:5000/api/v1/health"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Check Backend Health
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-4">
              <StatusCard
                icon={<Server />}
                title="Backend"
                text="Local JSON DB mode is active."
              />
              <StatusCard
                icon={<ShieldCheck />}
                title="Security"
                text="JWT + RBAC architecture is active."
              />
              <StatusCard
                icon={<GraduationCap />}
                title="Frontend"
                text="React + Vite + Tailwind foundation is ready."
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
        {icon}
      </div>
      <h2 className="font-bold text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{text}</p>
    </div>
  );
}
