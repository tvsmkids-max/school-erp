import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listGroupedPermissionsApi } from "../../api/permissions.api.js";
import { listRolesApi } from "../../api/roles.api.js";
import { createUserApi, updateUserApi } from "../../api/users.api.js";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Modal from "../../components/common/Modal.jsx";
import Select from "../../components/common/Select.jsx";

const emptyForm = {
  fullName: "",
  username: "",
  email: "",
  mobile: "",
  password: "User@123",
  roleId: "",
  status: "active",
  allowedPermissions: [],
  deniedPermissions: [],
};

export default function UserFormModal({ open, onClose, user = null }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(user?._id);
  const [form, setForm] = useState(emptyForm);

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: listRolesApi,
    enabled: open,
  });

  const permissionsQuery = useQuery({
    queryKey: ["permissions", "grouped"],
    queryFn: listGroupedPermissionsApi,
    enabled: open,
  });

  const roles = rolesQuery.data?.data || [];
  const permissionGroups = permissionsQuery.data?.data || [];

  useEffect(() => {
    if (!open) return;

    if (user) {
      setForm({
        fullName: user.fullName || "",
        username: user.username || "",
        email: user.email || "",
        mobile: user.mobile || "",
        password: "User@123",
        roleId: user.roleId || "",
        status: user.status || "active",
        allowedPermissions: user.allowedPermissions || [],
        deniedPermissions: user.deniedPermissions || [],
      });
    } else {
      setForm({ ...emptyForm, roleId: roles[0]?._id || "" });
    }
  }, [open, user, roles.length]);

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (isEdit) {
        const { username, password, ...updatePayload } = payload;
        return updateUserApi({ id: user._id, payload: updatePayload });
      }

      return createUserApi(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
  });

  const selectedRole = useMemo(() => {
    return roles.find((role) => role._id === form.roleId);
  }, [roles, form.roleId]);

  const setValue = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const togglePermission = (type, permissionKey) => {
    const oppositeType = type === "allowedPermissions" ? "deniedPermissions" : "allowedPermissions";

    setForm((current) => {
      const currentSet = new Set(current[type]);
      const oppositeSet = new Set(current[oppositeType]);

      if (currentSet.has(permissionKey)) {
        currentSet.delete(permissionKey);
      } else {
        currentSet.add(permissionKey);
        oppositeSet.delete(permissionKey);
      }

      return {
        ...current,
        [type]: [...currentSet],
        [oppositeType]: [...oppositeSet],
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    saveMutation.mutate({
      ...form,
      email: form.email || "",
      mobile: form.mobile || "",
      assignedClasses: [],
      assignedSections: [],
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit User" : "Create User"} maxWidth="max-w-5xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full Name">
            <Input value={form.fullName} onChange={(e) => setValue("fullName", e.target.value)} required />
          </Field>

          <Field label="Username">
            <Input value={form.username} onChange={(e) => setValue("username", e.target.value)} required disabled={isEdit} />
          </Field>

          <Field label="Email">
            <Input value={form.email} onChange={(e) => setValue("email", e.target.value)} />
          </Field>

          <Field label="Mobile">
            <Input value={form.mobile} onChange={(e) => setValue("mobile", e.target.value)} placeholder="9876543210" />
          </Field>

          {!isEdit ? (
            <Field label="Password">
              <Input value={form.password} onChange={(e) => setValue("password", e.target.value)} required />
            </Field>
          ) : null}

          <Field label="Role">
            <Select value={form.roleId} onChange={(e) => setValue("roleId", e.target.value)} required>
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Status">
            <Select value={form.status} onChange={(e) => setValue("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="locked">Locked</option>
            </Select>
          </Field>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-950 dark:text-white">
            Permission Overrides
          </h3>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Role selected: {selectedRole?.name || "None"}. Allow/Deny overrides are optional.
          </p>

          <div className="mt-4 space-y-4">
            {permissionGroups.map((group) => (
              <div key={group.moduleKey} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <h4 className="mb-3 text-sm font-black text-slate-800 dark:text-slate-100">
                  {group.module}
                </h4>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {group.permissions.map((permission) => (
                    <div key={permission.permissionKey} className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                      <p className="mb-2 font-black text-slate-700 dark:text-slate-200">
                        {permission.permissionKey}
                      </p>

                      <div className="flex gap-3">
                        <label className="flex items-center gap-1 font-bold text-green-700">
                          <input
                            type="checkbox"
                            checked={form.allowedPermissions.includes(permission.permissionKey)}
                            onChange={() => togglePermission("allowedPermissions", permission.permissionKey)}
                          />
                          Allow
                        </label>

                        <label className="flex items-center gap-1 font-bold text-red-700">
                          <input
                            type="checkbox"
                            checked={form.deniedPermissions.includes(permission.permissionKey)}
                            onChange={() => togglePermission("deniedPermissions", permission.permissionKey)}
                          />
                          Deny
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {saveMutation.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {saveMutation.error.message}
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button type="button" className="bg-slate-600 hover:bg-slate-700" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">
        {label}
      </span>
      {children}
    </label>
  );
}
