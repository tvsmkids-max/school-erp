import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { listGroupedPermissionsApi } from "../../api/permissions.api.js";
import Badge from "../../components/common/Badge.jsx";
import Input from "../../components/common/Input.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";

export default function PermissionsPage() {
  const [search, setSearch] = useState("");

  const permissionsQuery = useQuery({
    queryKey: ["permissions", "grouped"],
    queryFn: listGroupedPermissionsApi,
  });

  const groups = permissionsQuery.data?.data || [];

  const filteredGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return groups;
    }

    return groups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((permission) => {
          const combined = `${permission.module} ${permission.permissionKey} ${permission.description} ${permission.action}`.toLowerCase();

          return combined.includes(normalizedSearch);
        }),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [groups, search]);

  return (
    <div>
      <PageHeader
        title="Permission Catalog"
        description="Read-only catalog of all available ERP permissions."
      />

      <div className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

          <Input
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search permissions..."
          />
        </div>
      </div>

      <div className="space-y-5">
        {filteredGroups.map((group) => (
          <section
            key={group.moduleKey}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  {group.module}
                </h2>

                <p className="text-xs font-semibold text-slate-500">
                  {group.moduleKey}
                </p>
              </div>

              <Badge variant="blue">{group.permissions.length} permissions</Badge>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">
                      Permission Key
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">
                      Menu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">
                      Description
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {group.permissions.map((permission) => (
                    <tr key={permission.permissionKey} className="hover:bg-slate-50 dark:hover:bg-slate-950/60">
                      <td className="px-4 py-3 font-black text-slate-800 dark:text-slate-100">
                        {permission.permissionKey}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                        {permission.action}
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant={permission.isMenuPermission ? "green" : "slate"}>
                          {permission.isMenuPermission ? "Menu" : "Action"}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                        {permission.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {filteredGroups.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center font-bold text-slate-500 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            {permissionsQuery.isLoading ? "Loading permissions..." : "No permissions found"}
          </div>
        ) : null}
      </div>
    </div>
  );
}
