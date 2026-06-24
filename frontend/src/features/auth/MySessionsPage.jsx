import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Monitor, ShieldCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logoutAllApi, mySessionsApi } from "../../api/auth.api.js";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import { authStore } from "./auth.store.js";

export default function MySessionsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const sessionsQuery = useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: mySessionsApi,
  });

  const logoutAllMutation = useMutation({
    mutationFn: logoutAllApi,
    onSuccess: () => {
      authStore.clearAuth();
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });

  const sessions = sessionsQuery.data?.data || [];

  return (
    <div>
      <PageHeader
        title="My Active Sessions"
        description="View active login sessions and logout from all devices if needed."
        actions={
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={() => logoutAllMutation.mutate()}
            disabled={logoutAllMutation.isPending || sessions.length === 0}
          >
            <Trash2 size={18} className="mr-2" />
            {logoutAllMutation.isPending
              ? "Logging out..."
              : "Logout All Sessions"}
          </Button>
        }
      />

      <div className="rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <Th>Status</Th>
                <Th>IP Address</Th>
                <Th>User Agent</Th>
                <Th>Created</Th>
                <Th>Expires</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {sessions.map((session) => (
                <tr key={session._id}>
                  <Td>
                    <Badge variant="green">
                      <ShieldCheck size={14} className="mr-1" /> Active
                    </Badge>
                  </Td>

                  <Td>{session.ipAddress || "-"}</Td>

                  <Td>
                    <div className="flex max-w-xl items-center gap-2 truncate">
                      <Monitor size={16} className="shrink-0 text-slate-400" />
                      <span className="truncate">
                        {session.userAgent || "-"}
                      </span>
                    </div>
                  </Td>

                  <Td>
                    {session.createdAt
                      ? new Date(session.createdAt).toLocaleString()
                      : "-"}
                  </Td>

                  <Td>
                    {session.expiresAt
                      ? new Date(session.expiresAt).toLocaleString()
                      : "-"}
                  </Td>
                </tr>
              ))}

              {sessions.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-10 text-center font-bold text-slate-500"
                  >
                    {sessionsQuery.isLoading
                      ? "Loading sessions..."
                      : "No active sessions found"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
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
