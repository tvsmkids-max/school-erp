import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listClassesApi } from "../../api/classes.api.js";
import { listGroupedPermissionsApi } from "../../api/permissions.api.js";
import { listRolesApi } from "../../api/roles.api.js";
import { listSectionsApi } from "../../api/sections.api.js";
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
  assignedClasses: [],
  assignedSections: [],
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

  const classesQuery = useQuery({
    queryKey: ["classes", "user-form"],
    queryFn: () => listClassesApi({ limit: 100, status: "active" }),
    enabled: open,
  });

  const sectionsQuery = useQuery({
    queryKey: ["sections", "user-form"],
    queryFn: () => listSectionsApi({ limit: 500, status: "active" }),
    enabled: open,
  });

  const roles = rolesQuery.data?.data || [];
  const permissionGroups = permissionsQuery.data?.data || [];
  const classes = classesQuery.data?.data || [];
  const sections = sectionsQuery.data?.data || [];

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
        assignedClasses: user.assignedClasses || [],
        assignedSections: user.assignedSections || [],
        allowedPermissions: user.allowedPermissions || [],
        deniedPermissions: user.deniedPermissions || [],
      });
    } else {
      setForm({
        ...emptyForm,
        roleId: roles[0]?._id || "",
      });
    }
  }, [open, user, roles.length]);

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (isEdit) {
        const { username, password, ...updatePayload } = payload;

        return updateUserApi({
          id: user._id,
          payload: updatePayload,
        });
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
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleArrayValue = (key, value) => {
    setForm((current) => {
      const existing = new Set(current[key] || []);

      if (existing.has(value)) {
        existing.delete(value);
      } else {
        existing.add(value);
      }

      return {
        ...current,
        [key]: [...existing],
      };
    });
  };

  const selectAllClasses = () => {
    setForm((current) => ({
      ...current,
      assignedClasses: classes.map((item) => item._id),
    }));
  };

  const clearClasses = () => {
    setForm((current) => ({
      ...current,
      assignedClasses: [],
      assignedSections: [],
    }));
  };

  const selectAllSectionsForAssignedClasses = () => {
    const selectedClassSet = new Set(form.assignedClasses);

    const allowedSections = sections
      .filter((section) => selectedClassSet.has(section.classId))
      .map((section) => section._id);

    setForm((current) => ({
      ...current,
      assignedSections: allowedSections,
    }));
  };

  const togglePermission = (type, permissionKey) => {
    const oppositeType =
      type === "allowedPermissions"
        ? "deniedPermissions"
        : "allowedPermissions";

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
      assignedClasses: form.assignedClasses || [],
      assignedSections: form.assignedSections || [],
    });
  };

  const assignedClassSet = new Set(form.assignedClasses);

  const availableSections = sections.filter((section) =>
    assignedClassSet.has(section.classId),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit User" : "Create User"}
      maxWidth="max-w-6xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="mb-4 text-base font-black text-slate-950 dark:text-white">
            Login Details
          </h3>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Full Name">
              <Input
                value={form.fullName}
                onChange={(event) => setValue("fullName", event.target.value)}
                required
              />
            </Field>

            <Field label="Username">
              <Input
                value={form.username}
                onChange={(event) => setValue("username", event.target.value)}
                required
                disabled={isEdit}
              />
            </Field>

            <Field label="Email">
              <Input
                value={form.email}
                onChange={(event) => setValue("email", event.target.value)}
              />
            </Field>

            <Field label="Mobile">
              <Input
                value={form.mobile}
                onChange={(event) => setValue("mobile", event.target.value)}
                placeholder="9876543210"
              />
            </Field>

            {!isEdit ? (
              <Field label="Password">
                <Input
                  value={form.password}
                  onChange={(event) => setValue("password", event.target.value)}
                  required
                />
              </Field>
            ) : null}

            <Field label="Role">
              <Select
                value={form.roleId}
                onChange={(event) => setValue("roleId", event.target.value)}
                required
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Status">
              <Select
                value={form.status}
                onChange={(event) => setValue("status", event.target.value)}
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="locked">Locked</option>
              </Select>
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                Class / Section Access
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Use this to create class-based teacher/admin logins.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-slate-600 hover:bg-slate-700"
                onClick={selectAllClasses}
              >
                Select All Classes
              </Button>

              <Button
                type="button"
                className="bg-slate-600 hover:bg-slate-700"
                onClick={clearClasses}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <h4 className="mb-3 text-sm font-black text-slate-800 dark:text-slate-100">
                Assigned Classes
              </h4>

              <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
                {classes.map((classRecord) => (
                  <label
                    key={classRecord._id}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold dark:border-slate-800 dark:bg-slate-900"
                  >
                    <input
                      type="checkbox"
                      checked={form.assignedClasses.includes(classRecord._id)}
                      onChange={() =>
                        toggleArrayValue("assignedClasses", classRecord._id)
                      }
                    />
                    {classRecord.displayName}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  Assigned Sections
                </h4>

                <button
                  type="button"
                  className="text-xs font-black text-blue-600"
                  onClick={selectAllSectionsForAssignedClasses}
                >
                  Select Sections
                </button>
              </div>

              <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
                {availableSections.map((section) => (
                  <label
                    key={section._id}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold dark:border-slate-800 dark:bg-slate-900"
                  >
                    <input
                      type="checkbox"
                      checked={form.assignedSections.includes(section._id)}
                      onChange={() =>
                        toggleArrayValue("assignedSections", section._id)
                      }
                    />
                    {section.className || "Class"} - {section.name}
                  </label>
                ))}

                {availableSections.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                    Select classes first. Sections are optional.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="text-base font-black text-slate-950 dark:text-white">
            Permission Overrides
          </h3>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Role selected: {selectedRole?.name || "None"}. Allow/Deny overrides
            are optional.
          </p>

          <div className="mt-4 space-y-4">
            {permissionGroups.map((group) => (
              <div
                key={group.moduleKey}
                className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950"
              >
                <h4 className="mb-3 text-sm font-black text-slate-800 dark:text-slate-100">
                  {group.module}
                </h4>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {group.permissions.map((permission) => (
                    <div
                      key={permission.permissionKey}
                      className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900"
                    >
                      <p className="mb-2 font-black text-slate-700 dark:text-slate-200">
                        {permission.permissionKey}
                      </p>

                      <div className="flex gap-3">
                        <label className="flex items-center gap-1 font-bold text-green-700">
                          <input
                            type="checkbox"
                            checked={form.allowedPermissions.includes(
                              permission.permissionKey,
                            )}
                            onChange={() =>
                              togglePermission(
                                "allowedPermissions",
                                permission.permissionKey,
                              )
                            }
                          />
                          Allow
                        </label>

                        <label className="flex items-center gap-1 font-bold text-red-700">
                          <input
                            type="checkbox"
                            checked={form.deniedPermissions.includes(
                              permission.permissionKey,
                            )}
                            onChange={() =>
                              togglePermission(
                                "deniedPermissions",
                                permission.permissionKey,
                              )
                            }
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
        </section>

        {saveMutation.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {saveMutation.error.message}
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            className="bg-slate-600 hover:bg-slate-700"
            onClick={onClose}
          >
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
