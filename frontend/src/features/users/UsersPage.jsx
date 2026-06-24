import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, KeyRound, LogOut, Plus, Power, Search, Trash2 } from "lucide-react";
import { deleteUserApi, disableUserApi, enableUserApi, listUsersApi } from "../../api/users.api.js";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import Select from "../../components/common/Select.jsx";
import ResetPasswordModal from "./ResetPasswordModal.jsx";
import UserFormModal from "./UserFormModal.jsx";
import UserSessionsModal from "./UserSessionsModal.jsx";

const statusVariant = {
  active: "green",
  disabled: "red",
  locked: "yellow",
};

export default function UsersPage() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    roleKey: "all",
    page: 1,
    limit: 10,
  });

  const [formUser, setFormUser] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [sessionsUser, setSessionsUser] = useState(null);

  const queryParams = useMemo(() => filters, [filters]);

  const usersQuery = useQuery({
    queryKey: ["users", queryParams],
    queryFn: () => listUsersApi(queryParams),
  });

  const disableMutation = useMutation({
    mutationFn: disableUserApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const enableMutation = useMutation({
    mutationFn: enableUserApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUserApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const users = usersQuery.data?.data || [];
  const meta = usersQuery.data?.meta || { page: 1, totalPages: 1, total: 0 };

  const setFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? value : 1,
    }));
  };

  const openCreate = () => {
    setFormUser(null);
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setFormUser(user);
    setFormOpen(true);
  };

  const confirmDelete = (user) => {
    if (window.confirm(`Delete user ${user.username}? This is soft delete.`)) {
      deleteMutation.mutate(user._id);
    }
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Create users, assign roles, permission overrides and manage sessions."
        actions={
          <Button onClick={openCreate}>
            <Plus size={18} className="mr-2" />
            Create User
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

          <Input
            className="pl-10"
            placeholder="Search name, username, email, mobile..."
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
          />
        </div>

        <Select value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="locked">Locked</option>
        </Select>

        <Select value={filters.roleKey} onChange={(e) => setFilter("roleKey", e.target.value)}>
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="principal">Principal</option>
          <option value="administrator">Administrator</option>
          <option value="accountant">Accountant</option>
          <option value="teacher">Teacher</option>
        </Select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <Th>Name</Th>
                <Th>Username</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Last Login</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-950/60">
                  <Td>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white">
                        {user.fullName}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {user.email || user.mobile || "-"}
                      </p>
                    </div>
                  </Td>

                  <Td>{user.username}</Td>
                  <Td>{user.roleName || user.roleKey}</Td>

                  <Td>
                    <Badge variant={statusVariant[user.status] || "slate"}>
                      {user.status}
                    </Badge>
                  </Td>

                  <Td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</Td>

                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <IconButton title="Edit" onClick={() => openEdit(user)}>
                        <Edit size={16} />
                      </IconButton>

                      <IconButton title="Reset Password" onClick={() => setResetUser(user)}>
                        <KeyRound size={16} />
                      </IconButton>

                      <IconButton title="Sessions" onClick={() => setSessionsUser(user)}>
                        <LogOut size={16} />
                      </IconButton>

                      {user.status === "active" ? (
                        <IconButton title="Disable" onClick={() => disableMutation.mutate(user._id)}>
                          <Power size={16} />
                        </IconButton>
                      ) : (
                        <IconButton title="Enable" onClick={() => enableMutation.mutate(user._id)}>
                          <Power size={16} />
                        </IconButton>
                      )}

                      <IconButton title="Delete" danger onClick={() => confirmDelete(user)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </Td>
                </tr>
              ))}

              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center font-bold text-slate-500">
                    {usersQuery.isLoading ? "Loading users..." : "No users found"}
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

      <UserFormModal open={formOpen} user={formUser} onClose={() => setFormOpen(false)} />
      <ResetPasswordModal open={Boolean(resetUser)} user={resetUser} onClose={() => setResetUser(null)} />
      <UserSessionsModal open={Boolean(sessionsUser)} user={sessionsUser} onClose={() => setSessionsUser(null)} />
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
