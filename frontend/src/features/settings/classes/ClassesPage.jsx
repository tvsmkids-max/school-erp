import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Power, Search, Trash2 } from "lucide-react";
import {
  createClassApi,
  deleteClassApi,
  disableClassApi,
  listClassesApi,
  updateClassApi,
} from "../../../api/classes.api.js";
import Badge from "../../../components/common/Badge.jsx";
import Button from "../../../components/common/Button.jsx";
import Input from "../../../components/common/Input.jsx";
import Modal from "../../../components/common/Modal.jsx";
import PageHeader from "../../../components/common/PageHeader.jsx";
import Select from "../../../components/common/Select.jsx";

const emptyForm = {
  name: "",
  displayName: "",
  code: "",
  sortOrder: 1,
  status: "active",
};

export default function ClassesPage() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    page: 1,
    limit: 50,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const classesQuery = useQuery({
    queryKey: ["classes", filters],
    queryFn: () => listClassesApi(filters),
  });

  const disableMutation = useMutation({
    mutationFn: disableClassApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClassApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });

  const classes = classesQuery.data?.data || [];
  const meta = classesQuery.data?.meta || { total: 0, totalPages: 1 };

  const setFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? value : 1,
    }));
  };

  const openCreate = () => {
    setEditingClass(null);
    setModalOpen(true);
  };

  const openEdit = (classRecord) => {
    setEditingClass(classRecord);
    setModalOpen(true);
  };

  const confirmDelete = (classRecord) => {
    if (window.confirm(`Delete class ${classRecord.displayName}?`)) {
      deleteMutation.mutate(classRecord._id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Manage Nursery to Class 12 and future configurable classes."
        actions={
          <Button onClick={openCreate}>
            <Plus size={18} className="mr-2" />
            Create Class
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            className="pl-10"
            placeholder="Search class..."
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
                <Th>Name</Th>
                <Th>Display Name</Th>
                <Th>Code</Th>
                <Th>Order</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {classes.map((classRecord) => (
                <tr key={classRecord._id} className="hover:bg-slate-50 dark:hover:bg-slate-950/60">
                  <Td><span className="font-black">{classRecord.name}</span></Td>
                  <Td>{classRecord.displayName}</Td>
                  <Td>{classRecord.code}</Td>
                  <Td>{classRecord.sortOrder}</Td>
                  <Td>
                    <Badge variant={classRecord.status === "active" ? "green" : "red"}>
                      {classRecord.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <IconButton title="Edit" onClick={() => openEdit(classRecord)}>
                        <Edit size={16} />
                      </IconButton>

                      <IconButton title="Disable" onClick={() => disableMutation.mutate(classRecord._id)}>
                        <Power size={16} />
                      </IconButton>

                      <IconButton title="Delete" danger onClick={() => confirmDelete(classRecord)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </Td>
                </tr>
              ))}

              {classes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center font-bold text-slate-500">
                    {classesQuery.isLoading ? "Loading classes..." : "No classes found"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <Pagination filters={filters} meta={meta} setFilter={setFilter} />
      </div>

      <ClassFormModal open={modalOpen} classRecord={editingClass} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function ClassFormModal({ open, classRecord, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(classRecord?._id);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;

    setForm(
      classRecord
        ? {
            name: classRecord.name || "",
            displayName: classRecord.displayName || "",
            code: classRecord.code || "",
            sortOrder: classRecord.sortOrder || 1,
            status: classRecord.status || "active",
          }
        : emptyForm
    );
  }, [open, classRecord]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? updateClassApi({ id: classRecord._id, payload })
        : createClassApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      onClose();
    },
  });

  const setValue = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    mutation.mutate({ ...form, sortOrder: Number(form.sortOrder) });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Class" : "Create Class"} maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setValue("name", e.target.value)} required />
          </Field>

          <Field label="Display Name">
            <Input value={form.displayName} onChange={(e) => setValue("displayName", e.target.value)} required />
          </Field>

          <Field label="Code">
            <Input value={form.code} onChange={(e) => setValue("code", e.target.value)} required />
          </Field>

          <Field label="Sort Order">
            <Input type="number" value={form.sortOrder} onChange={(e) => setValue("sortOrder", e.target.value)} required />
          </Field>

          <Field label="Status">
            <Select value={form.status} onChange={(e) => setValue("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </div>

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
