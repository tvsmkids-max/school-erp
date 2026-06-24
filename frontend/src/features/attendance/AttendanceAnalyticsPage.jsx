import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { listAcademicSessionsApi } from "../../api/academicSessions.api.js";
import { getAttendanceAnalyticsApi } from "../../api/attendance.api.js";
import { listClassesApi } from "../../api/classes.api.js";
import { listSectionsApi } from "../../api/sections.api.js";
import Badge from "../../components/common/Badge.jsx";
import Input from "../../components/common/Input.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import Select from "../../components/common/Select.jsx";
import SimpleBarChart from "../../components/charts/SimpleBarChart.jsx";

const today = new Date().toISOString().slice(0, 10);

const firstDayOfMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1,
)
  .toISOString()
  .slice(0, 10);

export default function AttendanceAnalyticsPage() {
  const [filters, setFilters] = useState({
    startDate: firstDayOfMonth,
    endDate: today,
    academicSessionId: "",
    classId: "",
    sectionId: "",
    gender: "all",
    category: "",
    studentStatus: "active",
    lowAttendanceThreshold: 75,
  });

  const sessionsQuery = useQuery({
    queryKey: ["academic-sessions", "attendance-analytics"],
    queryFn: () => listAcademicSessionsApi({ limit: 100, status: "all" }),
  });

  const classesQuery = useQuery({
    queryKey: ["classes", "attendance-analytics"],
    queryFn: () => listClassesApi({ limit: 100, status: "all" }),
  });

  const sectionsQuery = useQuery({
    queryKey: ["sections", "attendance-analytics", filters.classId],
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

  const canLoad = Boolean(
    filters.startDate &&
    filters.endDate &&
    filters.academicSessionId &&
    filters.classId,
  );

  const analyticsQuery = useQuery({
    queryKey: ["attendance", "analytics", filters],
    queryFn: () => getAttendanceAnalyticsApi(filters),
    enabled: canLoad,
  });

  const analytics = analyticsQuery.data?.data || null;

  const summary = analytics?.summary || {
    totalStudents: 0,
    totalMarked: 0,
    present: 0,
    absent: 0,
    leave: 0,
    overallAttendancePercentage: 0,
    lowAttendanceCount: 0,
    consecutiveAbsenteeCount: 0,
  };

  const studentSummaries = analytics?.studentSummaries || [];

  const topAttendanceStudents = [...studentSummaries]
    .filter((student) => student.totalMarkedDays > 0)
    .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
    .slice(0, 8);

  const lowAttendanceChartRows = [...(analytics?.lowAttendanceStudents || [])]
    .slice(0, 8)
    .map((student) => ({
      label: `${student.studentName} (${student.scholarNumber})`,
      value: student.attendancePercentage,
      color: "bg-red-600",
    }));

  const topAttendanceChartRows = topAttendanceStudents.map((student) => ({
    label: `${student.studentName} (${student.scholarNumber})`,
    value: student.attendancePercentage,
    color: "bg-green-600",
  }));

  const statusChartRows = [
    { label: "Present", value: summary.present || 0, color: "bg-green-600" },
    { label: "Absent", value: summary.absent || 0, color: "bg-red-600" },
    { label: "Leave", value: summary.leave || 0, color: "bg-yellow-600" },
  ];

  const setFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      sectionId: key === "classId" ? "" : current.sectionId,
    }));
  };

  return (
    <div>
      <PageHeader
        title="Attendance Analytics"
        description="Analyze class attendance, low attendance, top attendance and consecutive absentees."
      />

      <section className="mb-4 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900 xl:grid-cols-[160px_160px_180px_180px_180px_140px_160px_160px]">
        <Input
          type="date"
          value={filters.startDate}
          onChange={(event) => setFilter("startDate", event.target.value)}
        />

        <Input
          type="date"
          value={filters.endDate}
          onChange={(event) => setFilter("endDate", event.target.value)}
        />

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

        <Input
          type="number"
          min="1"
          max="100"
          value={filters.lowAttendanceThreshold}
          onChange={(event) =>
            setFilter("lowAttendanceThreshold", event.target.value)
          }
          placeholder="Low %"
        />
      </section>

      {!canLoad ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center font-bold text-slate-500 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          Select date range, session and class to load analytics.
        </div>
      ) : analyticsQuery.isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center font-bold text-slate-500 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          Loading analytics...
        </div>
      ) : (
        <>
          <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Students"
              value={summary.totalStudents}
              color="bg-blue-600"
            />
            <Metric
              label="Overall %"
              value={`${summary.overallAttendancePercentage}%`}
              color="bg-green-600"
            />
            <Metric
              label="Low Attendance"
              value={summary.lowAttendanceCount}
              color="bg-red-600"
            />
            <Metric
              label="Consecutive Absentees"
              value={summary.consecutiveAbsenteeCount}
              color="bg-yellow-600"
            />
          </section>

          <section className="mb-6 grid gap-6 xl:grid-cols-3">
            <SimpleBarChart
              title="Present / Absent / Leave"
              data={statusChartRows}
            />

            <SimpleBarChart
              title="Top Attendance %"
              data={topAttendanceChartRows}
              valueSuffix="%"
            />

            <SimpleBarChart
              title="Low Attendance %"
              data={lowAttendanceChartRows}
              valueSuffix="%"
            />
          </section>

          <section className="mb-6 grid gap-6 xl:grid-cols-2">
            <Panel title="Low Attendance Students">
              <StudentSummaryTable
                rows={analytics?.lowAttendanceStudents || []}
                emptyText="No low attendance students"
                showStreak={false}
              />
            </Panel>

            <Panel title="Consecutive Absentees (3+)">
              <StudentSummaryTable
                rows={analytics?.consecutiveAbsentees || []}
                emptyText="No consecutive absentees"
                showStreak
              />
            </Panel>
          </section>

          <Panel title="All Student Attendance Summary">
            <StudentSummaryTable
              rows={studentSummaries}
              emptyText="No attendance data"
              showStreak
            />
          </Panel>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${color}`}
        >
          <BarChart3 size={24} />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-lg font-black text-slate-950 dark:text-white">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StudentSummaryTable({ rows, emptyText, showStreak }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-950">
          <tr>
            <Th>Scholar</Th>
            <Th>Student</Th>
            <Th>Class</Th>
            <Th>Present</Th>
            <Th>Absent</Th>
            <Th>Leave</Th>
            <Th>%</Th>
            {showStreak ? <Th>Max Absent Streak</Th> : null}
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
              <Td>{row.present}</Td>
              <Td>{row.absent}</Td>
              <Td>{row.leave}</Td>
              <Td>
                <Badge variant={row.isLowAttendance ? "red" : "green"}>
                  {row.attendancePercentage}%
                </Badge>
              </Td>
              {showStreak ? <Td>{row.maxConsecutiveAbsents}</Td> : null}
            </tr>
          ))}

          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={showStreak ? 8 : 7}
                className="px-4 py-8 text-center font-bold text-slate-500"
              >
                {emptyText}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
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
