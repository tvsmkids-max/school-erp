import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Power, Search, Star, Trash2 } from "lucide-react";
import {
  createAcademicSessionApi,
  deleteAcademicSessionApi,
  disableAcademicSessionApi,
  listAcademicSessionsApi,
  setCurrentAcademicSessionApi,
  updateAcademicSessionApi,
} from "../../../api/academicSessions.api.js";
import Badge from "../../../components/common/Badge.jsx";
import Button from "../../../components/common/Button.jsx";
import Input from "../../../components/common/Input.jsx";
import Modal from "../../../components/common/Modal.jsx";
import PageHeader from "../../../components/common/PageHeader.jsx";
import Select from "../../../components/common/Select.jsx";

const emptyForm = {
  name: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  status: "active",
};

export default function AcademicSessionsPage() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    page: 1,
    limit: 20,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const sessionsQuery = useQuery({
    queryKey: ["academic-sessions", filters],
    queryFn: () => listAcademicSessionsApi(filters),
  });

  const setCurrentMutation = useMutation({
    mutationFn: setCurrentAcademicSessionApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academic-sessions"] }),
  });

  const disableMutation = useMutation({
    mutationFn: disableAcademicSessionApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academic-sessions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAcademicSessionApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academic-sessions"] }),
  });

  const sessions = sessionsQuery.data?.data || [];
  const meta = sessionsQuery.data?.meta || { total: 0, totalPages: 1 };

  const setFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? value : 1,
    }));
  };

  const openCreate = () => {
    setEditingSession(null);
    setModalOpen(true);
  };

  const openEdit = (session) => {
    setEditingSession(session);
    setModalOpen(true);
  };

  const confirmDelete = (session) => {
    if (window.confirm(`Delete academic session ${session.name}?`)) {
      deleteMutation.mutate(session._id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Academic Sessions"
        description="Manage June to March academic sessions and current session."
        actions={
          <Button onClick={openCreate}>
            <Plus size={18} className="mr-2" />
            Create Session
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            className="pl-10"
            placeholder="Search session..."
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
          />
        </div>

        <Select value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <Th>Session</Th>
                <Th>Start Date</Th>
                <Th>End Date</Th>
                <Th>Current</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {sessions.map((session) => (
                <tr key={session._id} className="hover:bg-slate-50 dark:hover:bg-slate-950/60">
                  <Td><span className="font-black">{session.name}</span></Td>
                  <Td>{session.startDate}</Td>
                  <Td>{session.endDate}</Td>
                  <Td>
                    {session.isCurrent ? (
                      <Badge variant="blue">Current</Badge>
                    ) : (
                      <Badge>Not Current</Badge>
                    )}
                  </Td>
                  <Td>
                    <Badge variant={session.status === "active" ? "green" : "red"}>
                      {session.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <IconButton title="Edit" onClick={() => openEdit(session)}>
                        <Edit size={16} />
                      </IconButton>

                      {!session.isCurrent ? (
                        <IconButton title="Set Current" onClick={() => setCurrentMutation.mutate(session._id)}>
                          <Star size={16} />
                        </IconButton>
                      ) : null}

                      {!session.isCurrent ? (
                        <IconButton title="Disable" onClick={() => disableMutation.mutate(session._id)}>
                          <Power size={16} />
                        </IconButton>
                      ) : null}

                      {!session.isCurrent ? (
                        <IconButton title="Delete" danger onClick={() => confirmDelete(session)}>
                          <Trash2 size={16} />
                        </IconButton>
                      ) : null}
                    </div>
                  </Td>
                </tr>
              ))}

              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center font-bold text-slate-500">
                    {sessionsQuery.isLoading ? "Loading sessions..." : "No sessions found"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <Pagination filters={filters} meta={meta} setFilter={setFilter} />
      </div>

      <AcademicSessionFormModal
        open={modalOpen}
        session={editingSession}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

function AcademicSessionFormModal({ open, session, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(session?._id);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;

    setForm(
      session
        ? {
            name: session.name || "",
            startDate: session.startDate || "",
            endDate: session.endDate || "",
            isCurrent: false,
            status: session.status || "active",
          }
        : emptyForm
    );
  }, [open, session]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? updateAcademicSessionApi({ id: session._id, payload })
        : createAcademicSessionApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-sessions"] });
      onClose();
    },
  });

  const setValue = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event) => {
    event.preventDefault();

    const payload = isEdit
      ? {
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
        }
      : form;

    mutation.mutate(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Academic Session" : "Create Academic Session"} maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Session Name">
          <Input value={form.name} onChange={(e) => setValue("name", e.target.value)} placeholder="2028-29" required />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Start Date">
            <Input type="date" value={form.startDate} onChange={(e) => setValue("startDate", e.target.value)} required />
          </Field>

          <Field label="End Date">
            <Input type="date" value={form.endDate} onChange={(e) => setValue("endDate", e.target.value)} required />
          </Field>
        </div>

        <Field label="Status">
          <Select value={form.status} onChange={(e) => setValue("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </Field>

        {!isEdit ? (
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(e) => setValue("isCurrent", e.target.checked)}
            />
            Set as current session
          </label>
        ) : null}

        {mutation.isError ? <ErrorBox message={mutation.error.message} /> : null}

        <div className="flex justify-end gap-3">
          <Button type="button" className="bg-slate-600 hover:bg-slate-700" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      {message}
    </div>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">{children}</th>;
}

function Td({ children }) {
  return <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{children}</td>;
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

function Pagination({ filters, meta, setFilter }) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-slate-500">Total: {meta.total}</p>

      <div className="flex items-center gap-2">
        <Button className="bg-slate-600 hover:bg-slate-700" disabled={filters.page <= 1} onClick={() => setFilter("page", filters.page - 1)}>
          Previous
        </Button>

        <span className="text-sm font-black">Page {filters.page} / {meta.totalPages || 1}</span>

        <Button className="bg-slate-600 hover:bg-slate-700" disabled={filters.page >= (meta.totalPages || 1)} onClick={() => setFilter("page", filters.page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
