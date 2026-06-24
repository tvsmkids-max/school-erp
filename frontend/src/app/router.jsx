import { Navigate, createBrowserRouter } from "react-router-dom";

import App from "../App.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

import LoginPage from "../features/auth/LoginPage.jsx";
import MySessionsPage from "../features/auth/MySessionsPage.jsx";
import ProtectedRoute from "../features/auth/ProtectedRoute.jsx";
import PermissionRoute from "../features/auth/PermissionRoute.jsx";

import DashboardPage from "../features/dashboard/DashboardPage.jsx";

import StudentsPage from "../features/students/StudentsPage.jsx";
import StudentFieldConfigPage from "../features/studentFieldConfig/StudentFieldConfigPage.jsx";

import AttendancePage from "../features/attendance/AttendancePage.jsx";
import AttendanceAnalyticsPage from "../features/attendance/AttendanceAnalyticsPage.jsx";
import AttendanceReportsPage from "../features/attendance/AttendanceReportsPage.jsx";

import UsersPage from "../features/users/UsersPage.jsx";
import RolesPage from "../features/roles/RolesPage.jsx";
import PermissionsPage from "../features/permissions/PermissionsPage.jsx";

import AcademicSessionsPage from "../features/settings/academicSessions/AcademicSessionsPage.jsx";
import ClassesPage from "../features/settings/classes/ClassesPage.jsx";
import SectionsPage from "../features/settings/sections/SectionsPage.jsx";
import AttendancePeriodReportsPage from "../features/attendance/AttendancePeriodReportsPage.jsx";

import BackupsPage from "../features/backups/BackupsPage.jsx";

function ComingSoonPage({ title }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-2xl font-black text-slate-950 dark:text-white">
        {title}
      </h1>

      <p className="mt-2 text-sm font-semibold text-slate-500">
        This screen will be built after current student import and attendance
        core is stable.
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },

          {
            path: "/my-sessions",
            element: <MySessionsPage />,
          },

          {
            path: "/backups",
            element: <BackupsPage />,
          },
          {
            element: <PermissionRoute permission="student.view" />,
            children: [
              {
                path: "/students",
                element: <StudentsPage />,
              },
            ],
          },

          {
            element: <PermissionRoute permission="student.promote" />,
            children: [
              {
                path: "/student-promotion",
                element: <ComingSoonPage title="Student Promotion" />,
              },
            ],
          },

          {
            element: <PermissionRoute permission="student_field_config.view" />,
            children: [
              {
                path: "/student-field-config",
                element: <StudentFieldConfigPage />,
              },
            ],
          },

          {
            element: <PermissionRoute permission="attendance.view" />,
            children: [
              {
                path: "/attendance/daily",
                element: <AttendancePage />,
              },
              {
                path: "/attendance/analytics",
                element: <AttendanceAnalyticsPage />,
              },
              {
                path: "/attendance/reports",
                element: <AttendanceReportsPage />,
              },
              {
                path: "/attendance/period-reports",
                element: <AttendancePeriodReportsPage />,
              },
            ],
          },

          {
            element: <PermissionRoute permission="user.view" />,
            children: [
              {
                path: "/users",
                element: <UsersPage />,
              },
            ],
          },

          {
            element: <PermissionRoute permission="role.view" />,
            children: [
              {
                path: "/roles",
                element: <RolesPage />,
              },
            ],
          },

          {
            element: <PermissionRoute permission="permission.view" />,
            children: [
              {
                path: "/permissions",
                element: <PermissionsPage />,
              },
            ],
          },

          {
            element: <PermissionRoute permission="academic_session.view" />,
            children: [
              {
                path: "/settings/academic-sessions",
                element: <AcademicSessionsPage />,
              },
            ],
          },

          {
            element: <PermissionRoute permission="class.view" />,
            children: [
              {
                path: "/settings/classes",
                element: <ClassesPage />,
              },
            ],
          },

          {
            element: <PermissionRoute permission="section.view" />,
            children: [
              {
                path: "/settings/sections",
                element: <SectionsPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
