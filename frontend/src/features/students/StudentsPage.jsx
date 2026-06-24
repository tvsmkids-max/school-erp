import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, Filter, Plus, Search, Trash2 } from "lucide-react";
import { listAcademicSessionsApi } from "../../api/academicSessions.api.js";
import { listClassesApi } from "../../api/classes.api.js";
import { listSectionsApi } from "../../api/sections.api.js";
import {
  bulkDeleteStudentsApi,
  bulkUpdateStudentStatusApi,
  deleteStudentApi,
  listStudentsApi,
  updateStudentStatusApi,
} from "../../api/students.api.js";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import ColumnVisibilityMenu from "../../components/common/ColumnVisibilityMenu.jsx";
import Input from "../../components/common/Input.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import Select from "../../components/common/Select.jsx";
import {
  loadColumnPreferences,
  saveColumnPreferences,
} from "../../utils/columnPreferences.js";
import { exportCsv } from "../../utils/exportCsv.js";
import StudentDetailsModal from "./StudentDetailsModal.jsx";
import StudentFormModal from "./StudentFormModal.jsx";
import StudentImportModal from "./StudentImportModal.jsx";

const STORAGE_KEY = "student_table_visible_columns";

const columns = [
  { key: "select", label: "Select", alwaysVisible: true },
  { key: "scholarNumber", label: "Scholar No." },
  { key: "student", label: "Student" },
  { key: "gender", label: "Gender" },
  { key: "class", label: "Class" },
  { key: "section", label: "Section" },
  { key: "rollNumber", label: "Roll No." },
  { key: "fatherName", label: "Father" },
  { key: "motherName", label: "Mother" },
  { key: "parentMobile", label: "Parent Mobile" },
  { key: "category", label: "Category" },
  { key: "religion", label: "Religion" },
  { key: "bloodGroup", label: "Blood Group" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", alwaysVisible: true },
];

const defaultVisibleColumns = [
  "scholarNumber",
  "student",
  "class",
  "section",
  "rollNumber",
  "fatherName",
  "parentMobile",
  "status",
];

const statusVariant = {
  active: "green",
  inactive: "red",
  tc_issued: "yellow",
  dropout: "red",
  passed_out: "blue",
};

const statusLabel = {
  active: "Active",
  inactive: "Inactive",
  tc_issued: "TC Issued",
  dropout: "Dropout",
  passed_out: "Passed Out",
};

const emptyAdvancedFilters = {
  category: "",
  religion: "",
  admissionFrom: "",
  admissionTo: "",
  aadhaarStatus: "all",
  samagraStatus: "all",
  penStatus: "all",
};

export default function StudentsPage() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    academicSessionId: "",
    classId: "",
    sectionId: "",
    gender: "all",
    page: 1,
    limit: 20,
    ...emptyAdvancedFilters,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [detailsStudent, setDetailsStudent] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("active");

  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() =>
    loadColumnPreferences(STORAGE_KEY, defaultVisibleColumns),
  );

  const queryParams = useMemo(() => filters, [filters]);

  const studentsQuery = useQuery({
    queryKey: ["students", queryParams],
    queryFn: () => listStudentsApi(queryParams),
  });

  const sessionsQuery = useQuery({
    queryKey: ["academic-sessions", "student-filter"],
    queryFn: () => listAcademicSessionsApi({ limit: 100, status: "all" }),
  });

  const classesQuery = useQuery({
    queryKey: ["classes", "student-filter"],
    queryFn: () => listClassesApi({ limit: 100, status: "all" }),
  });

  const sectionsQuery = useQuery({
    queryKey: ["sections", "student-filter", filters.classId],
    queryFn: () =>
      listSectionsApi({
        limit: 100,
        status: "all",
        classId: filters.classId,
      }),
    enabled: Boolean(filters.classId),
  });

  const invalidateStudents = () => {
    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ["students"] });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteStudentApi,
    onSuccess: invalidateStudents,
  });

  const statusMutation = useMutation({
    mutationFn: updateStudentStatusApi,
    onSuccess: invalidateStudents,
  });

  const bulkStatusMutation = useMutation({
    mutationFn: bulkUpdateStudentStatusApi,
    onSuccess: invalidateStudents,
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteStudentsApi,
    onSuccess: invalidateStudents,
  });

  const students = studentsQuery.data?.data || [];

  const meta = studentsQuery.data?.meta || {
    page: 1,
    totalPages: 1,
    total: 0,
  };

  const sessions = sessionsQuery.data?.data || [];
  const classes = classesQuery.data?.data || [];
  const sections = filters.classId ? sectionsQuery.data?.data || [] : [];

  const visibleIds = students.map((student) => student._id);

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const isColumnVisible = (key) => {
    const column = columns.find((item) => item.key === key);
    return column?.alwaysVisible || visibleColumnKeys.includes(key);
  };

  const visibleColumnCount = columns.filter((column) =>
    isColumnVisible(column.key),
  ).length;

  const updateVisibleColumns = (nextColumns) => {
    setVisibleColumnKeys(nextColumns);
    saveColumnPreferences(STORAGE_KEY, nextColumns);
  };

  const setFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      sectionId: key === "classId" ? "" : current.sectionId,
      page: key === "page" ? value : 1,
    }));

    setSelectedIds([]);
  };

  const resetAdvancedFilters = () => {
    setFilters((current) => ({
      ...current,
      ...emptyAdvancedFilters,
      page: 1,
    }));
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !visibleIds.includes(id)),
      );
    } else {
      setSelectedIds((current) => [...new Set([...current, ...visibleIds])]);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const confirmDelete = (student) => {
    if (
      window.confirm(
        `Delete student ${student.studentName} (${student.scholarNumber})?`,
      )
    ) {
      deleteMutation.mutate(student._id);
    }
  };

  const changeStatus = (student, status) => {
    statusMutation.mutate({
      id: student._id,
      status,
    });
  };

  const bulkUpdateStatus = () => {
    if (selectedIds.length === 0) return;

    bulkStatusMutation.mutate({
      studentIds: selectedIds,
      status: bulkStatus,
    });
  };

  const bulkDelete = () => {
    if (selectedIds.length === 0) return;

    if (window.confirm(`Delete ${selectedIds.length} selected students?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const openCreate = () => {
    setEditingStudent(null);
    setFormOpen(true);
  };

  const openEdit = (student) => {
    setEditingStudent(student);
    setFormOpen(true);
  };

  const exportStudents = () => {
    exportCsv({
      fileName: "students-export.csv",
      columns: [
        { header: "Scholar Number", accessor: "scholarNumber" },
        { header: "Student Name", accessor: "studentName" },
        { header: "Gender", accessor: "gender" },
        { header: "DOB", accessor: "dob" },
        { header: "Mobile", accessor: "mobileNumber" },
        { header: "Session", accessor: "academicSessionName" },
        { header: "Class", accessor: "className" },
        { header: "Section", accessor: "sectionName" },
        { header: "Roll Number", accessor: "rollNumber" },
        { header: "Admission Date", accessor: "admissionDate" },
        { header: "Father Name", accessor: "fatherName" },
        { header: "Mother Name", accessor: "motherName" },
        { header: "Parent Mobile", accessor: "parentMobile" },
        { header: "Aadhaar", accessor: "aadhaarNumber" },
        { header: "Samagra", accessor: "samagraId" },
        { header: "PEN", accessor: "penNumber" },
        { header: "Category", accessor: "category" },
        { header: "Religion", accessor: "religion" },
        { header: "Blood Group", accessor: "bloodGroup" },
        { header: "Status", accessor: "status" },
      ],
      rows: students,
    });
  };

  return (
    <div className="min-w-0">
      <PageHeader
        title="Student Management"
        description="Student list with session, class, section, status and search filters."
        actions={
          <div className="flex flex-wrap gap-2">
            <ColumnVisibilityMenu
              columns={columns}
              visibleColumnKeys={visibleColumnKeys}
              onChange={updateVisibleColumns}
            />

            <Button
              type="button"
              className="bg-slate-700 hover:bg-slate-800"
              onClick={exportStudents}
              disabled={students.length === 0}
            >
              Export CSV
            </Button>

            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setImportOpen(true)}
            >
              Import Excel
            </Button>

            <Button onClick={openCreate}>
              <Plus size={18} className="mr-2" />
              Add Student
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900 xl:grid-cols-[1.5fr_180px_180px_180px_180px_140px]">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <Input
            className="pl-10"
            placeholder="Search scholar no, student name, parent mobile..."
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
          />
        </div>

        <Select
          value={filters.academicSessionId}
          onChange={(event) =>
            setFilter("academicSessionId", event.target.value)
          }
        >
          <option value="">All Sessions</option>
          {sessions.map((session) => (
            <option key={session._id} value={session._id}>
              {session.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.classId}
          onChange={(event) => setFilter("classId", event.target.value)}
        >
          <option value="">All Classes</option>
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="tc_issued">TC Issued</option>
          <option value="dropout">Dropout</option>
          <option value="passed_out">Passed Out</option>
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
      </div>

      <div className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setShowAdvanced((value) => !value)}
          className="flex items-center gap-2 text-sm font-black text-blue-700 dark:text-blue-300"
        >
          <Filter size={18} />
          {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters"}
        </button>

        {showAdvanced ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              placeholder="Category"
              value={filters.category}
              onChange={(event) => setFilter("category", event.target.value)}
            />

            <Input
              placeholder="Religion"
              value={filters.religion}
              onChange={(event) => setFilter("religion", event.target.value)}
            />

            <Input
              type="date"
              value={filters.admissionFrom}
              onChange={(event) =>
                setFilter("admissionFrom", event.target.value)
              }
            />

            <Input
              type="date"
              value={filters.admissionTo}
              onChange={(event) => setFilter("admissionTo", event.target.value)}
            />

            <Select
              value={filters.aadhaarStatus}
              onChange={(event) =>
                setFilter("aadhaarStatus", event.target.value)
              }
            >
              <option value="all">Aadhaar: All</option>
              <option value="available">Aadhaar Available</option>
              <option value="missing">Aadhaar Missing</option>
            </Select>

            <Select
              value={filters.samagraStatus}
              onChange={(event) =>
                setFilter("samagraStatus", event.target.value)
              }
            >
              <option value="all">Samagra: All</option>
              <option value="available">Samagra Available</option>
              <option value="missing">Samagra Missing</option>
            </Select>

            <Select
              value={filters.penStatus}
              onChange={(event) => setFilter("penStatus", event.target.value)}
            >
              <option value="all">PEN: All</option>
              <option value="available">PEN Available</option>
              <option value="missing">PEN Missing</option>
            </Select>

            <Button
              type="button"
              className="bg-slate-600 hover:bg-slate-700"
              onClick={resetAdvancedFilters}
            >
              Reset Advanced Filters
            </Button>
          </div>
        ) : null}
      </div>

      {selectedIds.length > 0 ? (
        <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-blue-200 bg-blue-50 p-4 shadow-soft dark:border-blue-900 dark:bg-blue-950 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-black text-blue-700 dark:text-blue-200">
            {selectedIds.length} student(s) selected
          </p>

          <div className="flex flex-wrap gap-2">
            <Select
              className="w-44"
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="tc_issued">TC Issued</option>
              <option value="dropout">Dropout</option>
              <option value="passed_out">Passed Out</option>
            </Select>

            <Button
              onClick={bulkUpdateStatus}
              disabled={bulkStatusMutation.isPending}
            >
              Update Status
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={bulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              Bulk Delete
            </Button>

            <Button
              className="bg-slate-600 hover:bg-slate-700"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                {isColumnVisible("select") ? (
                  <Th>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                    />
                  </Th>
                ) : null}
                {isColumnVisible("scholarNumber") ? <Th>Scholar No.</Th> : null}
                {isColumnVisible("student") ? <Th>Student</Th> : null}
                {isColumnVisible("gender") ? <Th>Gender</Th> : null}
                {isColumnVisible("class") ? <Th>Class</Th> : null}
                {isColumnVisible("section") ? <Th>Section</Th> : null}
                {isColumnVisible("rollNumber") ? <Th>Roll No.</Th> : null}
                {isColumnVisible("fatherName") ? <Th>Father</Th> : null}
                {isColumnVisible("motherName") ? <Th>Mother</Th> : null}
                {isColumnVisible("parentMobile") ? (
                  <Th>Parent Mobile</Th>
                ) : null}
                {isColumnVisible("category") ? <Th>Category</Th> : null}
                {isColumnVisible("religion") ? <Th>Religion</Th> : null}
                {isColumnVisible("bloodGroup") ? <Th>Blood Group</Th> : null}
                {isColumnVisible("status") ? <Th>Status</Th> : null}
                {isColumnVisible("actions") ? <Th>Actions</Th> : null}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {students.map((student) => (
                <tr
                  key={student._id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-950/60"
                >
                  {isColumnVisible("select") ? (
                    <Td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student._id)}
                        onChange={() => toggleSelectOne(student._id)}
                      />
                    </Td>
                  ) : null}

                  {isColumnVisible("scholarNumber") ? (
                    <Td>
                      <span className="font-black">
                        {student.scholarNumber}
                      </span>
                    </Td>
                  ) : null}

                  {isColumnVisible("student") ? (
                    <Td>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">
                          {student.studentName}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {student.gender}
                        </p>
                      </div>
                    </Td>
                  ) : null}

                  {isColumnVisible("gender") ? (
                    <Td>{student.gender || "-"}</Td>
                  ) : null}
                  {isColumnVisible("class") ? (
                    <Td>{student.className || "-"}</Td>
                  ) : null}
                  {isColumnVisible("section") ? (
                    <Td>{student.sectionName || "-"}</Td>
                  ) : null}
                  {isColumnVisible("rollNumber") ? (
                    <Td>{student.rollNumber || "-"}</Td>
                  ) : null}
                  {isColumnVisible("fatherName") ? (
                    <Td>{student.fatherName || "-"}</Td>
                  ) : null}
                  {isColumnVisible("motherName") ? (
                    <Td>{student.motherName || "-"}</Td>
                  ) : null}
                  {isColumnVisible("parentMobile") ? (
                    <Td>{student.parentMobile || "-"}</Td>
                  ) : null}
                  {isColumnVisible("category") ? (
                    <Td>{student.category || "-"}</Td>
                  ) : null}
                  {isColumnVisible("religion") ? (
                    <Td>{student.religion || "-"}</Td>
                  ) : null}
                  {isColumnVisible("bloodGroup") ? (
                    <Td>{student.bloodGroup || "-"}</Td>
                  ) : null}

                  {isColumnVisible("status") ? (
                    <Td>
                      <Badge variant={statusVariant[student.status] || "slate"}>
                        {statusLabel[student.status] || student.status}
                      </Badge>
                    </Td>
                  ) : null}

                  {isColumnVisible("actions") ? (
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <IconButton
                          title="View"
                          onClick={() => setDetailsStudent(student)}
                        >
                          <Eye size={16} />
                        </IconButton>

                        <IconButton
                          title="Edit"
                          onClick={() => openEdit(student)}
                        >
                          <Edit size={16} />
                        </IconButton>

                        <select
                          value={student.status}
                          onChange={(event) =>
                            changeStatus(student, event.target.value)
                          }
                          className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold dark:border-slate-800 dark:bg-slate-950"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="tc_issued">TC Issued</option>
                          <option value="dropout">Dropout</option>
                          <option value="passed_out">Passed Out</option>
                        </select>

                        <IconButton
                          danger
                          title="Delete"
                          onClick={() => confirmDelete(student)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    </Td>
                  ) : null}
                </tr>
              ))}

              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumnCount}
                    className="px-4 py-10 text-center font-bold text-slate-500"
                  >
                    {studentsQuery.isLoading
                      ? "Loading students..."
                      : "No students found"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-slate-500">
            Total: {meta.total}
          </p>

          <div className="flex items-center gap-2">
            <Button
              className="bg-slate-600 hover:bg-slate-700"
              disabled={filters.page <= 1}
              onClick={() => setFilter("page", filters.page - 1)}
            >
              Previous
            </Button>

            <span className="text-sm font-black">
              Page {filters.page} / {meta.totalPages || 1}
            </span>

            <Button
              className="bg-slate-600 hover:bg-slate-700"
              disabled={filters.page >= (meta.totalPages || 1)}
              onClick={() => setFilter("page", filters.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <StudentFormModal
        open={formOpen}
        student={editingStudent}
        onClose={() => setFormOpen(false)}
      />

      <StudentImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <StudentDetailsModal
        open={Boolean(detailsStudent)}
        student={detailsStudent}
        onClose={() => setDetailsStudent(null)}
      />
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

function IconButton({ children, danger = false, ...props }) {
  return (
    <button
      className={`rounded-xl border p-2 transition ${
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}
