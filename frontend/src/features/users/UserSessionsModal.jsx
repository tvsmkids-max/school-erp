import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { forceLogoutUserApi, listUserSessionsApi } from "../../api/users.api.js";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import Modal from "../../components/common/Modal.jsx";

export default function UserSessionsModal({ open, onClose, user }) {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ["users", user?._id, "sessions"],
    queryFn: () => listUserSessionsApi(user._id),
    enabled: open && Boolean(user?._id),
  });

  const forceLogoutMutation = useMutation({
    mutationFn: () => forceLogoutUserApi(user._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", user?._id, "sessions"] });
    },
  });

  const sessions = sessionsQuery.data?.data || [];

  return (
    <Modal open={open} onClose={onClose} title={`Sessions - ${user?.fullName || "User"}`} maxWidth="max-w-4xl">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => forceLogoutMutation.mutate()} disabled={forceLogoutMutation.isPending} className="bg-red-600 hover:bg-red-700">
            {forceLogoutMutation.isPending ? "Logging out..." : "Force Logout User"}
          </Button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left font-black">Status</th>
                <th className="px-4 py-3 text-left font-black">IP</th>
                <th className="px-4 py-3 text-left font-black">User Agent</th>
                <th className="px-4 py-3 text-left font-black">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {sessions.map((session) => (
                <tr key={session._id}>
                  <td className="px-4 py-3">
                    <Badge variant={session.isActive ? "green" : "red"}>
                      {session.isActive ? "Active" : "Revoked"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold">{session.ipAddress}</td>
                  <td className="max-w-md truncate px-4 py-3 font-semibold">{session.userAgent}</td>
                  <td className="px-4 py-3 font-semibold">
                    {session.createdAt ? new Date(session.createdAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}

              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center font-bold text-slate-500">
                    No sessions found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
