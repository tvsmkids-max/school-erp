import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DatabaseBackup, Download, Plus, RotateCcw } from "lucide-react";
import {
  createManualBackupApi,
  downloadBackupApi,
  downloadBlob,
  downloadCurrentLocalDbApi,
  listBackupHistoryApi,
  restoreBackupApi,
} from "../../api/backups.api.js";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";

export default function BackupsPage() {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["backups"],
    queryFn: listBackupHistoryApi,
  });

  const createBackupMutation = useMutation({
    mutationFn: createManualBackupApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
  });

  const downloadCurrentMutation = useMutation({
    mutationFn: downloadCurrentLocalDbApi,
    onSuccess: (blob) => {
      downloadBlob({
        blob,
        fileName: "local-db-current.json",
      });
    },
  });

  const downloadBackupMutation = useMutation({
    mutationFn: downloadBackupApi,
    onSuccess: (blob, fileName) => {
      downloadBlob({
        blob,
        fileName,
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreBackupApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
  });

  const backups = historyQuery.data?.data || [];

  const restoreBackup = (backup) => {
    const confirmed = window.confirm(
      `Restore backup ${backup.fileName}?\n\nA safety backup will be created before restore. Current local DB will be replaced.`,
    );

    if (confirmed) {
      restoreMutation.mutate(backup.fileName);
    }
  };

  return (
    <div>
      <PageHeader
        title="Backups"
        description="Manual local JSON database backup, download and restore. Super Admin only."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-slate-700 hover:bg-slate-800"
              onClick={() => downloadCurrentMutation.mutate()}
              disabled={downloadCurrentMutation.isPending}
            >
              <Download size={18} className="mr-2" />
              Download Current DB
            </Button>

            <Button
              onClick={() => createBackupMutation.mutate()}
              disabled={createBackupMutation.isPending}
            >
              <Plus size={18} className="mr-2" />
              {createBackupMutation.isPending ? "Creating..." : "Create Backup"}
            </Button>
          </div>
        }
      />

      <div className="mb-4 rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800 shadow-soft dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
        <div className="flex gap-3">
          <DatabaseBackup className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-black">Local Development Backup</p>
            <p className="mt-1">
              Restore replaces the current local JSON database. A safety backup
              is automatically created before restore.
            </p>
          </div>
        </div>
      </div>

      {createBackupMutation.isSuccess ? (
        <SuccessBox message="Backup created successfully." />
      ) : null}

      {restoreMutation.isSuccess ? (
        <SuccessBox message="Backup restored successfully. Please refresh and login again if needed." />
      ) : null}

      {createBackupMutation.isError ? (
        <ErrorBox message={createBackupMutation.error.message} />
      ) : null}

      {restoreMutation.isError ? (
        <ErrorBox message={restoreMutation.error.message} />
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <Th>File Name</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>Restored From</Th>
                <Th>Safety Backup</Th>
                <Th>Created At</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {backups.map((backup) => (
                <tr key={backup._id}>
                  <Td>{backup.fileName}</Td>
                  <Td>{backup.type}</Td>
                  <Td>
                    <Badge
                      variant={
                        backup.status === "completed" ? "green" : "yellow"
                      }
                    >
                      {backup.status}
                    </Badge>
                  </Td>
                  <Td>{backup.restoredFrom || "-"}</Td>
                  <Td>{backup.safetyBackupFileName || "-"}</Td>
                  <Td>
                    {backup.createdAt
                      ? new Date(backup.createdAt).toLocaleString()
                      : "-"}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="bg-slate-700 hover:bg-slate-800"
                        onClick={() =>
                          downloadBackupMutation.mutate(backup.fileName)
                        }
                        disabled={downloadBackupMutation.isPending}
                      >
                        <Download size={16} className="mr-2" />
                        Download
                      </Button>

                      {backup.type !== "restore" ? (
                        <Button
                          className="bg-yellow-600 hover:bg-yellow-700"
                          onClick={() => restoreBackup(backup)}
                          disabled={restoreMutation.isPending}
                        >
                          <RotateCcw size={16} className="mr-2" />
                          Restore
                        </Button>
                      ) : null}
                    </div>
                  </Td>
                </tr>
              ))}

              {backups.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-10 text-center font-bold text-slate-500"
                  >
                    {historyQuery.isLoading
                      ? "Loading backups..."
                      : "No backups found"}
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

function SuccessBox({ message }) {
  return (
    <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
      {message}
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      {message}
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
