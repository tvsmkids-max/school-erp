import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { listAcademicSessionsApi } from "../../api/academicSessions.api.js";
import { getAttendanceAnalyticsApi } from "../../api/attendance.api.js";
import { listClassesApi } from "../../api/classes.api.js";
import { listSectionsApi } from "../../api/sections.api.js";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import Select from "../../components/common/Select.jsx";
import { exportCsv } from "../../utils/exportCsv.js";
import { printReport } from "../../utils/reportPrint.js";

const getToday = () => new Date().toISOString().slice(0, 10);

const getMonthRange = (yearMonth) => {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

const getYearRange = (year) => ({
  startDate: `${year}-01-01`,
  endDate: `${year}-12-31`,
});

const columns = [
  { header: "Scholar Number", accessor: "scholarNumber" },
  { header: "Student Name", accessor: "studentName" },
  { header: "Class", accessor: "className" },
  { header: "Section", accessor: "sectionName" },
  { header: "Marked Days", accessor: "totalMarkedDays" },
  { header: "Present", accessor: "present" },
  { header: "Absent", accessor: "absent" },
  { header: "Leave", accessor: "leave" },
  { header: "Attendance %", accessor: "attendancePercentage" },
  { header: "Max Consecutive Absents", accessor: "maxConsecutiveAbsents" },
];

export default function AttendancePeriodReportsPage() {
  const currentYearMonth = getToday().slice(0, 7);
  const currentYear = String(new Date().getFullYear());

  const [mode, setMode] = useState("monthly");
  const [month, setMonth] = useState(currentYearMonth);
  const [year, setYear] = useState(currentYear);

  const initialRange = getMonthRange(currentYearMonth);

  const [filters, setFilters] = useState({
    startDate: initialRange.startDate,
    endDate: initialRange.endDate,
    academicSessionId: "",
    classId: "",
    sectionId: "",
    gender: "all",
    category: "",
    studentStatus: "active",
    lowAttendanceThreshold: 75,
  });

  const sessionsQuery = useQuery({
    queryKey: ["academic-sessions", "attendance-period-reports"],
    queryFn: () => listAcademicSessionsApi({ limit: 100, status: "all" }),
  });

  const classesQuery = useQuery({
    queryKey: ["classes", "attendance-period-reports"],
    queryFn: () => listClassesApi({ limit: 100, status: "all" }),
  });

  const sectionsQuery = useQuery({
    queryKey: ["sections", "attendance-period-reports", filters.classId],
    queryFn: () =>
      listSectionsApi({
        limit: 100,
        status: "all",
        classId: filters.classId,
      }),
    enabled: Boolean(filters.classId),
  });

  const sessions = sessionsQuery.data?.data || [];
  const classes = classesQuery.data?.data || [];
  const sections = filters.classId ? sectionsQuery.data?.data || [] : [];

  const currentSession = useMemo(() => {
    return sessions.find((session) => session.isCurrent) || sessions[0] || null;
  }, [sessions]);

  useEffect(() => {
    if (!filters.academicSessionId && currentSession?._id) {
      setFilters((current) => ({
        ...current,
        academicSessionId: currentSession._id,
      }));
    }
  }, [currentSession?._id, filters.academicSessionId]);

  const updateMode = (nextMode) => {
    setMode(nextMode);

    const range =
      nextMode === "monthly" ? getMonthRange(month) : getYearRange(year);

    setFilters((current) => ({ ...current, ...range }));
  };

  const updateMonth = (nextMonth) => {
    setMonth(nextMonth);
    setFilters((current) => ({
      ...current,
      ...getMonthRange(nextMonth),
    }));
  };

  const updateYear = (nextYear) => {
    setYear(nextYear);
    setFilters((current) => ({
      ...current,
      ...getYearRange(nextYear),
    }));
  };

  const setFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      sectionId: key === "classId" ? "" : current.sectionId,
    }));
  };

  const canLoad = Boolean(
    filters.startDate &&
    filters.endDate &&
    filters.academicSessionId &&
    filters.classId,
  );

  const reportQuery = useQuery({
    queryKey: ["attendance", "period-reports", filters],
    queryFn: () => getAttendanceAnalyticsApi(filters),
    enabled: canLoad,
  });

  const report = reportQuery.data?.data || null;
  const summary = report?.summary || {};
  const rows = report?.studentSummaries || [];
  const lowAttendanceStudents = report?.lowAttendanceStudents || [];
  const consecutiveAbsentees = report?.consecutiveAbsentees || [];

  const reportTitle =
    mode === "monthly"
      ? "Monthly Attendance Report"
      : "Yearly Attendance Report";

  const subtitle = `${filters.startDate} to ${filters.endDate} • ${
    report?.filters?.academicSessionName || "Session"
  } • ${report?.filters?.className || "Class"} • ${
    report?.filters?.sectionName || "All Sections"
  }`;

  const summaryItems = [
    { label: "Students", value: summary.totalStudents || 0 },
    { label: "Marked", value: summary.totalMarked || 0 },
    { label: "Present", value: summary.present || 0 },
    { label: "Absent", value: summary.absent || 0 },
    { label: "Leave", value: summary.leave || 0 },
    { label: "Overall", value: `${summary.overallAttendancePercentage || 0}%` },
  ];

  const exportReport = () => {
    exportCsv({
      fileName: `${mode}-attendance-report-${filters.startDate}-to-${filters.endDate}.csv`,
      columns,
      rows,
    });
  };

  const printFullReport = () => {
    printReport({
      title: reportTitle,
      subtitle,
      summaryItems,
      columns,
      rows,
    });
  };

  return (
    <div>
      <PageHeader
        title="Monthly / Yearly Attendance Reports"
        description="Generate month-wise or year-wise attendance report with export and print/PDF support."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-slate-700 hover:bg-slate-800"
              onClick={printFullReport}
              disabled={!rows.length}
            >
              <Printer size={18} className="mr-2" /> Print/PDF
            </Button>

            <Button onClick={exportReport} disabled={!rows.length}>
              <Download size={18} className="mr-2" /> Export CSV
            </Button>
          </div>
        }
      />

      <section className="mb-4 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900 xl:grid-cols-[150px_170px_170px_180px_180px_180px_140px_160px]">
        <Select
          value={mode}
          onChange={(event) => updateMode(event.target.value)}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </Select>

        {mode === "monthly" ? (
          <Input
            type="month"
            value={month}
            onChange={(event) => updateMonth(event.target.value)}
          />
        ) : (
          <Input
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(event) => updateYear(event.target.value)}
          />
        )}

        <Select
          value={filters.academicSessionId}
          onChange={(event) =>
            setFilter("academicSessionId", event.target.value)
          }
        >
          <option value="">Select Session</option>
          {sessions.map((session) => (
            <option key={session._id} value={session._id}>
              {session.name}
              {session.isCurrent ? " (Current)" : ""}
            </option>
          ))}
        </Select>

        <Select
          value={filters.classId}
          onChange={(event) => setFilter("classId", event.target.value)}
        >
          <option value="">Select Class</option>
          {classes.map((classRecord) => (
            <option key={classRecord._id} value={classRecord._id}>
              {classRecord.displayName}
            </option>
          ))}
        </Select>

        <Select
          value={filters.sectionId}
          onChange={(event) => setFilter("sectionId", event.target.value)}
          disabled={!filters.classId}
        >
          <option value="">All Sections</option>
          {sections.map((section) => (
            <option key={section._id} value={section._id}>
              {section.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.gender}
          onChange={(event) => setFilter("gender", event.target.value)}
        >
          <option value="all">All Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>

        <Input
          placeholder="Category"
          value={filters.category}
          onChange={(event) => setFilter("category", event.target.value)}
        />

        <Select
          value={filters.studentStatus}
          onChange={(event) => setFilter("studentStatus", event.target.value)}
        >
          <option value="active">Active</option>
          <option value="all">All Status</option>
          <option value="inactive">Inactive</option>
          <option value="tc_issued">TC Issued</option>
          <option value="dropout">Dropout</option>
          <option value="passed_out">Passed Out</option>
        </Select>
      </section>

      {!canLoad ? (
        <EmptyMessage text="Select report period, session and class to load report." />
      ) : reportQuery.isLoading ? (
        <EmptyMessage text="Loading report..." />
      ) : (
        <>
          <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {summaryItems.map((item) => (
              <Metric key={item.label} label={item.label} value={item.value} />
            ))}
          </section>

          <section className="mb-4 grid gap-3 sm:grid-cols-2">
            <InfoBox
              title="Low Attendance"
              value={lowAttendanceStudents.length}
            />
            <InfoBox
              title="Consecutive Absentees"
              value={consecutiveAbsentees.length}
            />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                {reportTitle}
              </h2>
              <p className="text-sm font-semibold text-slate-500">{subtitle}</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <Th>Scholar</Th>
                    <Th>Student</Th>
                    <Th>Class</Th>
                    <Th>Marked</Th>
                    <Th>Present</Th>
                    <Th>Absent</Th>
                    <Th>Leave</Th>
                    <Th>%</Th>
                    <Th>Absent Streak</Th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rows.map((row) => (
                    <tr key={row.studentId}>
                      <Td>{row.scholarNumber}</Td>
                      <Td>{row.studentName}</Td>
                      <Td>
                        {row.className} {row.sectionName || ""}
                      </Td>
                      <Td>{row.totalMarkedDays}</Td>
                      <Td>{row.present}</Td>
                      <Td>{row.absent}</Td>
                      <Td>{row.leave}</Td>
                      <Td>
                        <Badge variant={row.isLowAttendance ? "red" : "green"}>
                          {row.attendancePercentage}%
                        </Badge>
                      </Td>
                      <Td>{row.maxConsecutiveAbsents}</Td>
                    </tr>
                  ))}

                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-4 py-10 text-center font-bold text-slate-500"
                      >
                        No report data found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function InfoBox({ title, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <FileSpreadsheet size={20} />
        </div>

        <div>
          <p className="text-sm font-black text-slate-500">{title}</p>
          <p className="text-2xl font-black text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyMessage({ text }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center font-bold text-slate-500 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      {text}
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
      {children}
    </td>
  );
}
