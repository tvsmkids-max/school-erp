import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Save, Search } from "lucide-react";
import {
  getDailyAttendanceApi,
  markAttendanceApi,
} from "../../api/attendance.api.js";
import { listAcademicSessionsApi } from "../../api/academicSessions.api.js";
import { listClassesApi } from "../../api/classes.api.js";
import { listSectionsApi } from "../../api/sections.api.js";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import Select from "../../components/common/Select.jsx";

const today = new Date().toISOString().slice(0, 10);

const statusVariant = {
  present: "green",
  absent: "red",
  leave: "yellow",
  unmarked: "slate",
};

const statusLabel = {
  present: "Present",
  absent: "Absent",
  leave: "Leave",
  unmarked: "Unmarked",
};

export default function AttendancePage() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    date: today,
    academicSessionId: "",
    classId: "",
    sectionId: "",
    status: "all",
    search: "",
  });

  const [attendanceMap, setAttendanceMap] = useState({});

  const sessionsQuery = useQuery({
    queryKey: ["academic-sessions", "attendance"],
    queryFn: () => listAcademicSessionsApi({ limit: 100, status: "all" }),
  });

  const classesQuery = useQuery({
    queryKey: ["classes", "attendance"],
    queryFn: () => listClassesApi({ limit: 100, status: "all" }),
  });

  const sectionsQuery = useQuery({
    queryKey: ["sections", "attendance", filters.classId],
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

  const canLoadAttendance = Boolean(
    filters.date && filters.academicSessionId && filters.classId,
  );

  const attendanceQuery = useQuery({
    queryKey: ["attendance", "daily", filters],
    queryFn: () => getDailyAttendanceApi(filters),
    enabled: canLoadAttendance,
  });

  const rows = attendanceQuery.data?.data || [];

  const summary = attendanceQuery.data?.meta || {
    totalStudents: 0,
    present: 0,
    absent: 0,
    leave: 0,
    unmarked: 0,
  };

  useEffect(() => {
    const nextMap = {};

    for (const row of rows) {
      nextMap[row.studentId] = {
        studentId: row.studentId,
        status:
          row.attendanceStatus === "unmarked"
            ? "present"
            : row.attendanceStatus,
        remarks: row.remarks || "",
      };
    }

    setAttendanceMap(nextMap);
  }, [attendanceQuery.dataUpdatedAt]);

  const markMutation = useMutation({
    mutationFn: markAttendanceApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "daily"] });
    },
  });

  const setFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      sectionId: key === "classId" ? "" : current.sectionId,
    }));
  };

  const setStudentStatus = (studentId, status) => {
    setAttendanceMap((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] || { studentId, remarks: "" }),
        status,
      },
    }));
  };

  const setStudentRemarks = (studentId, remarks) => {
    setAttendanceMap((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] || { studentId, status: "present" }),
        remarks,
      },
    }));
  };

  const markAll = (status) => {
    const nextMap = {};

    for (const row of rows) {
      nextMap[row.studentId] = {
        studentId: row.studentId,
        status,
        remarks: attendanceMap[row.studentId]?.remarks || "",
      };
    }

    setAttendanceMap(nextMap);
  };

  const saveAttendance = () => {
    const records = rows.map((row) => ({
      studentId: row.studentId,
      status: attendanceMap[row.studentId]?.status || "present",
      remarks: attendanceMap[row.studentId]?.remarks || "",
    }));

    if (records.length === 0) {
      alert("No students found to mark attendance.");
      return;
    }

    markMutation.mutate({
      date: filters.date,
      academicSessionId: filters.academicSessionId,
      classId: filters.classId,
      sectionId: filters.sectionId || "",
      records,
    });
  };

  return (
    <div>
      <PageHeader
        title="Daily Attendance"
        description="Mark student attendance as Present, Absent or Leave. Section is optional."
        actions={
          <Button
            onClick={saveAttendance}
            disabled={
              !canLoadAttendance || rows.length === 0 || markMutation.isPending
            }
          >
            <Save size={18} className="mr-2" />
            {markMutation.isPending ? "Saving..." : "Save Attendance"}
          </Button>
        }
      />

      <section className="mb-4 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900 xl:grid-cols-[160px_180px_180px_180px_160px_1fr]">
        <Input
          type="date"
          value={filters.date}
          onChange={(event) => setFilter("date", event.target.value)}
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
          value={filters.status}
          onChange={(event) => setFilter("status", event.target.value)}
        >
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="leave">Leave</option>
        </Select>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <Input
            className="pl-10"
            placeholder="Search student..."
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
          />
        </div>
      </section>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Total"
          value={summary.totalStudents}
          color="bg-slate-700"
        />
        <SummaryCard
          label="Present"
          value={summary.present}
          color="bg-green-600"
        />
        <SummaryCard label="Absent" value={summary.absent} color="bg-red-600" />
        <SummaryCard
          label="Leave"
          value={summary.leave}
          color="bg-yellow-600"
        />
        <SummaryCard
          label="Unmarked"
          value={summary.unmarked}
          color="bg-blue-600"
        />
      </section>

      <section className="mb-4 flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <Button
          type="button"
          className="bg-green-600 hover:bg-green-700"
          onClick={() => markAll("present")}
          disabled={rows.length === 0}
        >
          Mark All Present
        </Button>

        <Button
          type="button"
          className="bg-red-600 hover:bg-red-700"
          onClick={() => markAll("absent")}
          disabled={rows.length === 0}
        >
          Mark All Absent
        </Button>

        <Button
          type="button"
          className="bg-yellow-600 hover:bg-yellow-700"
          onClick={() => markAll("leave")}
          disabled={rows.length === 0}
        >
          Mark All Leave
        </Button>
      </section>

      {!canLoadAttendance ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center font-bold text-slate-500 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          Select date, session and class to load attendance.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <Th>Scholar No.</Th>
                  <Th>Student</Th>
                  <Th>Class</Th>
                  <Th>Section</Th>
                  <Th>Roll</Th>
                  <Th>Status</Th>
                  <Th>Remarks</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.map((row) => {
                  const currentStatus =
                    attendanceMap[row.studentId]?.status || "present";

                  return (
                    <tr
                      key={row.studentId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-950/60"
                    >
                      <Td>
                        <span className="font-black">{row.scholarNumber}</span>
                      </Td>

                      <Td>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">
                            {row.studentName}
                          </p>
                          <p className="text-xs font-semibold text-slate-500">
                            {row.fatherName || "-"}
                          </p>
                        </div>
                      </Td>

                      <Td>{row.className || "-"}</Td>
                      <Td>{row.sectionName || "-"}</Td>
                      <Td>{row.rollNumber || "-"}</Td>

                      <Td>
                        <div className="flex flex-wrap gap-2">
                          <StatusButton
                            active={currentStatus === "present"}
                            color="green"
                            onClick={() =>
                              setStudentStatus(row.studentId, "present")
                            }
                          >
                            P
                          </StatusButton>

                          <StatusButton
                            active={currentStatus === "absent"}
                            color="red"
                            onClick={() =>
                              setStudentStatus(row.studentId, "absent")
                            }
                          >
                            A
                          </StatusButton>

                          <StatusButton
                            active={currentStatus === "leave"}
                            color="yellow"
                            onClick={() =>
                              setStudentStatus(row.studentId, "leave")
                            }
                          >
                            L
                          </StatusButton>

                          <Badge variant={statusVariant[currentStatus]}>
                            {statusLabel[currentStatus]}
                          </Badge>
                        </div>
                      </Td>

                      <Td>
                        <Input
                          value={attendanceMap[row.studentId]?.remarks || ""}
                          onChange={(event) =>
                            setStudentRemarks(row.studentId, event.target.value)
                          }
                          placeholder="Optional"
                        />
                      </Td>
                    </tr>
                  );
                })}

                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-10 text-center font-bold text-slate-500"
                    >
                      {attendanceQuery.isLoading
                        ? "Loading students..."
                        : "No students found for selected filters"}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {markMutation.isSuccess ? (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          Attendance saved. Created: {markMutation.data.data.createdCount},
          Updated: {markMutation.data.data.updatedCount}
        </div>
      ) : null}

      {markMutation.isError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {markMutation.error.message}
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
            {value || 0}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white ${color}`}
        >
          <CalendarDays size={22} />
        </div>
      </div>
    </div>
  );
}

function StatusButton({ active, color, children, onClick }) {
  const colorClass = {
    green: active
      ? "bg-green-600 text-white"
      : "border-green-200 text-green-700 hover:bg-green-50",
    red: active
      ? "bg-red-600 text-white"
      : "border-red-200 text-red-700 hover:bg-red-50",
    yellow: active
      ? "bg-yellow-600 text-white"
      : "border-yellow-200 text-yellow-700 hover:bg-yellow-50",
  }[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 w-9 rounded-xl border text-sm font-black transition ${colorClass}`}
    >
      {children}
    </button>
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
