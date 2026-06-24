import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, ShieldCheck } from "lucide-react";
import { listGroupedPermissionsApi } from "../../api/permissions.api.js";
import { listRolesApi, updateRolePermissionsApi } from "../../api/roles.api.js";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: listRolesApi });

  const permissionsQuery = useQuery({
    queryKey: ["permissions", "grouped"],
    queryFn: listGroupedPermissionsApi,
  });

  const roles = rolesQuery.data?.data || [];
  const permissionGroups = permissionsQuery.data?.data || [];

  const selectedRole = useMemo(() => {
    return roles.find((role) => role._id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0]._id);
    }
  }, [roles, selectedRoleId]);

  useEffect(() => {
    if (selectedRole) {
      setSelectedPermissions(selectedRole.permissions || []);
    }
  }, [selectedRole]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateRolePermissionsApi({
        id: selectedRole._id,
        permissions: selectedPermissions,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  const isSuperAdmin = selectedRole?.key === "super_admin";

  const togglePermission = (permissionKey) => {
    if (isSuperAdmin) return;

    setSelectedPermissions((current) => {
      if (current.includes(permissionKey)) {
        return current.filter((item) => item !== permissionKey);
      }

      return [...current, permissionKey].sort();
    });
  };

  const selectModulePermissions = (permissions) => {
    if (isSuperAdmin) return;

    const permissionKeys = permissions.map((permission) => permission.permissionKey);

    setSelectedPermissions((current) => {
      const currentSet = new Set(current);
      const allSelected = permissionKeys.every((key) => currentSet.has(key));

      if (allSelected) {
        for (const key of permissionKeys) {
          currentSet.delete(key);
        }
      } else {
        for (const key of permissionKeys) {
          currentSet.add(key);
        }
      }

      return [...currentSet].sort();
    });
  };

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Manage default permissions for Principal, Administrator, Accountant and Teacher roles."
        actions={
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={!selectedRole || isSuperAdmin || updateMutation.isPending}
          >
            <Save size={18} className="mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Permissions"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">
            System Roles
          </h2>

          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role._id}
                onClick={() => setSelectedRoleId(role._id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedRoleId === role._id
                    ? "border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950 dark:text-white">
                      {role.name}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {role.key}
                    </p>
                  </div>

                  {role.key === "super_admin" ? (
                    <Badge variant="blue">Protected</Badge>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          {selectedRole ? (
            <>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    {selectedRole.name}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Selected permissions: {selectedPermissions.length}
                  </p>
                </div>

                {isSuperAdmin ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                    <ShieldCheck size={18} />
                    Super Admin always has all permissions
                  </div>
                ) : null}
              </div>

              {updateMutation.isSuccess ? (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
                  Role permissions saved successfully.
                </div>
              ) : null}

              {updateMutation.isError ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                  {updateMutation.error.message}
                </div>
              ) : null}

              <div className="space-y-5">
                {permissionGroups.map((group) => {
                  const groupKeys = group.permissions.map(
                    (permission) => permission.permissionKey
                  );

                  const allSelected = groupKeys.every((key) =>
                    selectedPermissions.includes(key)
                  );

                  return (
                    <div
                      key={group.moduleKey}
                      className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-black text-slate-950 dark:text-white">
                            {group.module}
                          </h3>
                          <p className="text-xs font-semibold text-slate-500">
                            {group.moduleKey}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={isSuperAdmin}
                          onClick={() => selectModulePermissions(group.permissions)}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950"
                        >
                          {allSelected ? "Unselect Module" : "Select Module"}
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {group.permissions.map((permission) => (
                          <label
                            key={permission.permissionKey}
                            className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950"
                          >
                            <input
                              type="checkbox"
                              disabled={isSuperAdmin}
                              checked={selectedPermissions.includes(permission.permissionKey)}
                              onChange={() => togglePermission(permission.permissionKey)}
                              className="mt-1"
                            />

                            <span>
                              <span className="block text-sm font-black text-slate-800 dark:text-slate-100">
                                {permission.permissionKey}
                              </span>

                              <span className="mt-1 block text-xs font-semibold text-slate-500">
                                {permission.description}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-sm font-bold text-slate-500">
              Select a role to manage permissions.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
