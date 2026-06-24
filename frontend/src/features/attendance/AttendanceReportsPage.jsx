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

const today = new Date().toISOString().slice(0, 10);

const firstDayOfMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1,
)
  .toISOString()
  .slice(0, 10);

const reportColumns = [
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

export default function AttendanceReportsPage() {
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
    queryKey: ["academic-sessions", "attendance-reports"],
    queryFn: () => listAcademicSessionsApi({ limit: 100, status: "all" }),
  });

  const classesQuery = useQuery({
    queryKey: ["classes", "attendance-reports"],
    queryFn: () => listClassesApi({ limit: 100, status: "all" }),
  });

  const sectionsQuery = useQuery({
    queryKey: ["sections", "attendance-reports", filters.classId],
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

  const reportQuery = useQuery({
    queryKey: ["attendance", "reports", filters],
    queryFn: () => getAttendanceAnalyticsApi(filters),
    enabled: canLoad,
  });

  const report = reportQuery.data?.data || null;
  const summary = report?.summary || {};
  const studentSummaries = report?.studentSummaries || [];
  const lowAttendanceStudents = report?.lowAttendanceStudents || [];
  const consecutiveAbsentees = report?.consecutiveAbsentees || [];

  const setFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      sectionId: key === "classId" ? "" : current.sectionId,
    }));
  };

  const getSubtitle = () => {
    const className = report?.filters?.className || "Selected Class";
    const sectionName = report?.filters?.sectionName || "All Sections";
    const sessionName =
      report?.filters?.academicSessionName || "Selected Session";

    return `${filters.startDate} to ${filters.endDate} • ${sessionName} • ${className} • ${sectionName}`;
  };

  const getSummaryItems = () => [
    { label: "Students", value: summary.totalStudents || 0 },
    { label: "Marked", value: summary.totalMarked || 0 },
    { label: "Present", value: summary.present || 0 },
    { label: "Absent", value: summary.absent || 0 },
    { label: "Leave", value: summary.leave || 0 },
    { label: "Overall", value: `${summary.overallAttendancePercentage || 0}%` },
  ];

  const exportSummary = () => {
    exportCsv({
      fileName: `attendance-summary-${filters.startDate}-to-${filters.endDate}.csv`,
      columns: reportColumns,
      rows: studentSummaries,
    });
  };

  const exportLowAttendance = () => {
    exportCsv({
      fileName: `low-attendance-${filters.startDate}-to-${filters.endDate}.csv`,
      columns: reportColumns.filter(
        (column) => column.header !== "Max Consecutive Absents",
      ),
      rows: lowAttendanceStudents,
    });
  };

  const exportConsecutiveAbsentees = () => {
    exportCsv({
      fileName: `consecutive-absentees-${filters.startDate}-to-${filters.endDate}.csv`,
      columns: reportColumns,
      rows: consecutiveAbsentees,
    });
  };

  const printSummary = () => {
    printReport({
      title: "Attendance Summary Report",
      subtitle: getSubtitle(),
      summaryItems: getSummaryItems(),
      columns: reportColumns,
      rows: studentSummaries,
    });
  };

  const printLowAttendance = () => {
    printReport({
      title: "Low Attendance Report",
      subtitle: getSubtitle(),
      summaryItems: getSummaryItems(),
      columns: reportColumns.filter(
        (column) => column.header !== "Max Consecutive Absents",
      ),
      rows: lowAttendanceStudents,
    });
  };

  const printConsecutiveAbsentees = () => {
    printReport({
      title: "Consecutive Absentees Report",
      subtitle: getSubtitle(),
      summaryItems: getSummaryItems(),
      columns: reportColumns,
      rows: consecutiveAbsentees,
    });
  };

  return (
    <div>
      <PageHeader
        title="Attendance Reports"
        description="Print/PDF-ready attendance reports with advanced filters. Use browser print dialog to save as PDF."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-slate-700 hover:bg-slate-800"
              onClick={printSummary}
              disabled={!studentSummaries.length}
            >
              <Printer size={18} className="mr-2" /> Print / PDF
            </Button>

            <Button onClick={exportSummary} disabled={!studentSummaries.length}>
              <Download size={18} className="mr-2" /> Export CSV
            </Button>
          </div>
        }
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
          <option value="all">All Student Status</option>
          <option value="active">Active</option>
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
        <EmptyMessage text="Select date range, session and class to load reports." />
      ) : reportQuery.isLoading ? (
        <EmptyMessage text="Loading attendance reports..." />
      ) : (
        <>
          <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <Metric label="Students" value={summary.totalStudents || 0} />
            <Metric label="Marked" value={summary.totalMarked || 0} />
            <Metric label="Present" value={summary.present || 0} />
            <Metric label="Absent" value={summary.absent || 0} />
            <Metric label="Leave" value={summary.leave || 0} />
            <Metric
              label="Overall"
              value={`${summary.overallAttendancePercentage || 0}%`}
            />
          </section>

          <section className="mb-6 grid gap-6 xl:grid-cols-2">
            <ReportPanel
              title="Low Attendance Report"
              count={lowAttendanceStudents.length}
              onExport={exportLowAttendance}
              onPrint={printLowAttendance}
            >
              <ReportTable
                rows={lowAttendanceStudents}
                emptyText="No low attendance students"
                showStreak={false}
              />
            </ReportPanel>

            <ReportPanel
              title="Consecutive Absentees Report"
              count={consecutiveAbsentees.length}
              onExport={exportConsecutiveAbsentees}
              onPrint={printConsecutiveAbsentees}
            >
              <ReportTable
                rows={consecutiveAbsentees}
                emptyText="No consecutive absentees"
                showStreak
              />
            </ReportPanel>
          </section>

          <ReportPanel
            title="Class Attendance Summary"
            count={studentSummaries.length}
            onExport={exportSummary}
            onPrint={printSummary}
          >
            <ReportTable
              rows={studentSummaries}
              emptyText="No report data"
              showStreak
            />
          </ReportPanel>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <FileSpreadsheet size={20} />
        </div>
      </div>
    </div>
  );
}

function ReportPanel({ title, count, onExport, onPrint, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">
            {title}
          </h2>
          <p className="text-sm font-semibold text-slate-500">
            Records: {count}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-slate-700 hover:bg-slate-800"
            onClick={onPrint}
            disabled={!count}
          >
            <Printer size={16} className="mr-2" /> Print/PDF
          </Button>

          <Button
            className="bg-slate-700 hover:bg-slate-800"
            onClick={onExport}
            disabled={!count}
          >
            <Download size={16} className="mr-2" /> Export
          </Button>
        </div>
      </div>

      {children}
    </section>
  );
}

function ReportTable({ rows, emptyText, showStreak }) {
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
            {showStreak ? <Th>Absent Streak</Th> : null}
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
