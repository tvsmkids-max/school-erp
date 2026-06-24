import { Link } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  GraduationCap,
  Printer,
  Users,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader.jsx";

const reportGroups = [
  {
    title: "Student Reports",
    description: "Student records, filters, exports and data-quality reports.",
    icon: GraduationCap,
    cards: [
      {
        title: "Student Master Report",
        description:
          "Class-wise, section-wise, gender, category and status filtered student list.",
        path: "/students",
        icon: Users,
        badge: "CSV Export",
      },
      {
        title: "Student Field Configuration",
        description:
          "Visible, mandatory and read-only student fields configuration.",
        path: "/student-field-config",
        icon: FileSpreadsheet,
        badge: "Configuration",
      },
    ],
  },
  {
    title: "Attendance Reports",
    description: "Daily, monthly, yearly and analytical attendance reports.",
    icon: CalendarDays,
    cards: [
      {
        title: "Daily Attendance",
        description: "Mark and review daily student attendance.",
        path: "/attendance/daily",
        icon: CalendarDays,
        badge: "Daily",
      },
      {
        title: "Attendance Analytics",
        description:
          "Low attendance, consecutive absentees and attendance charts.",
        path: "/attendance/analytics",
        icon: BarChart3,
        badge: "Analytics",
      },
      {
        title: "Attendance Reports",
        description:
          "Date-range attendance reports with CSV export and print/PDF.",
        path: "/attendance/reports",
        icon: Printer,
        badge: "Print/PDF",
      },
      {
        title: "Monthly / Yearly Reports",
        description: "Month-wise and year-wise attendance reports.",
        path: "/attendance/period-reports",
        icon: FileSpreadsheet,
        badge: "Period Reports",
      },
    ],
  },
];

export default function ReportsCenterPage() {
  return (
    <div>
      <PageHeader
        title="Reports Center"
        description="Central place for student and attendance reports. Fee and examination reports are reserved for future upgrades."
      />

      <div className="space-y-6">
        {reportGroups.map((group) => {
          const GroupIcon = group.icon;

          return (
            <section
              key={group.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <GroupIcon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    {group.title}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {group.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {group.cards.map((card) => {
                  const CardIcon = card.icon;

                  return (
                    <Link
                      key={card.path}
                      to={card.path}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-soft dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-900 dark:hover:bg-blue-950"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                          <CardIcon size={21} />
                        </div>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                          {card.badge}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-950 dark:text-white">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        {card.description}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
