import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, RotateCcw, Upload } from "lucide-react";
import {
  commitStudentImportApi,
  downloadStudentImportTemplateApi,
  listStudentImportHistoryApi,
  previewStudentImportApi,
  rollbackStudentImportApi,
} from "../../api/students.api.js";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";

export default function StudentImportModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [previewBatch, setPreviewBatch] = useState(null);

  const historyQuery = useQuery({
    queryKey: ["student-import-history"],
    queryFn: () => listStudentImportHistoryApi({ limit: 10 }),
    enabled: open,
  });

  const downloadMutation = useMutation({
    mutationFn: downloadStudentImportTemplateApi,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "student-import-template.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    },
  });

  const previewMutation = useMutation({
    mutationFn: previewStudentImportApi,
    onSuccess: (response) => {
      setPreviewBatch(response.data);
      queryClient.invalidateQueries({ queryKey: ["student-import-history"] });
    },
  });

  const commitMutation = useMutation({
    mutationFn: commitStudentImportApi,
    onSuccess: (response) => {
      setPreviewBatch(response.data);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-import-history"] });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: rollbackStudentImportApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-import-history"] });
    },
  });

  const handlePreview = () => {
    if (!file) {
      alert("Please select an Excel file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    previewMutation.mutate(formData);
  };

  const rollbackBatch = (batch) => {
    const confirmed = window.confirm(
      `Rollback import batch?\n\nFile: ${batch.fileName}\nImported Students: ${batch.importedCount}\n\nThis will soft-delete imported students from this batch.`,
    );

    if (confirmed) {
      rollbackMutation.mutate(batch._id);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewBatch(null);
    onClose();
  };

  const rows = previewBatch?.rows || [];
  const history = historyQuery.data?.data || [];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import Students from Excel"
      maxWidth="max-w-6xl"
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                Step 1: Download Template
              </h3>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Fill student data in the Excel format. Section is optional.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => downloadMutation.mutate()}
              disabled={downloadMutation.isPending}
            >
              <Download size={18} className="mr-2" />
              {downloadMutation.isPending
                ? "Downloading..."
                : "Download Template"}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="text-base font-black text-slate-950 dark:text-white">
            Step 2: Upload Excel and Preview
          </h3>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-950 dark:text-white md:max-w-md"
            />

            <Button
              type="button"
              onClick={handlePreview}
              disabled={previewMutation.isPending}
            >
              <Upload size={18} className="mr-2" />
              {previewMutation.isPending ? "Checking..." : "Preview Import"}
            </Button>
          </div>

          {previewMutation.isError ? (
            <ErrorBox message={previewMutation.error.message} />
          ) : null}
        </section>

        {previewBatch ? (
          <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">
                  Preview Result
                </h3>

                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="blue">Total {previewBatch.totalRows}</Badge>
                  <Badge variant="green">Valid {previewBatch.validCount}</Badge>

                  <Badge
                    variant={previewBatch.invalidCount > 0 ? "red" : "green"}
                  >
                    Invalid {previewBatch.invalidCount}
                  </Badge>

                  <Badge
                    variant={
                      previewBatch.duplicateCount > 0 ? "yellow" : "slate"
                    }
                  >
                    Duplicates {previewBatch.duplicateCount}
                  </Badge>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => commitMutation.mutate(previewBatch._id)}
                disabled={
                  commitMutation.isPending ||
                  previewBatch.validCount === 0 ||
                  previewBatch.status === "imported" ||
                  previewBatch.status === "rolled_back"
                }
              >
                {commitMutation.isPending
                  ? "Importing..."
                  : previewBatch.status === "imported"
                    ? "Imported"
                    : previewBatch.status === "rolled_back"
                      ? "Rolled Back"
                      : "Import Valid Rows"}
              </Button>
            </div>

            {commitMutation.isError ? (
              <ErrorBox message={commitMutation.error.message} />
            ) : null}

            {commitMutation.isSuccess ? (
              <SuccessBox
                message={`Imported ${commitMutation.data.data.importedCount} students successfully.`}
              />
            ) : null}

            <div className="max-h-96 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <Th>Row</Th>
                    <Th>Status</Th>
                    <Th>Scholar No.</Th>
                    <Th>Name</Th>
                    <Th>Class</Th>
                    <Th>Section</Th>
                    <Th>Errors</Th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rows.map((row) => (
                    <tr key={row.rowNumber}>
                      <Td>{row.rowNumber}</Td>

                      <Td>
                        <Badge variant={row.isValid ? "green" : "red"}>
                          {row.isValid ? "Valid" : "Invalid"}
                        </Badge>
                      </Td>

                      <Td>
                        {row.normalized?.scholarNumber ||
                          row.raw?.scholarNumber ||
                          "-"}
                      </Td>

                      <Td>
                        {row.normalized?.studentName ||
                          row.raw?.studentName ||
                          "-"}
                      </Td>

                      <Td>
                        {row.normalized?.className || row.raw?.classCode || "-"}
                      </Td>

                      <Td>
                        {row.normalized?.sectionName ||
                          row.raw?.sectionCode ||
                          "Optional"}
                      </Td>

                      <Td>
                        {row.errors?.length ? (
                          <ul className="list-inside list-disc text-xs font-bold text-red-600">
                            {row.errors.map((error) => (
                              <li key={error}>{error}</li>
                            ))}
                          </ul>
                        ) : (
                          "-"
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {rollbackMutation.isSuccess ? (
          <SuccessBox message="Import rollback completed successfully." />
        ) : null}

        {rollbackMutation.isError ? (
          <ErrorBox message={rollbackMutation.error.message} />
        ) : null}

        <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="mb-4 text-base font-black text-slate-950 dark:text-white">
            Recent Import History
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <Th>File</Th>
                  <Th>Status</Th>
                  <Th>Total</Th>
                  <Th>Valid</Th>
                  <Th>Invalid</Th>
                  <Th>Imported</Th>
                  <Th>Rollback</Th>
                  <Th>Date</Th>
                  <Th>Action</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {history.map((batch) => (
                  <tr key={batch._id}>
                    <Td>{batch.fileName}</Td>

                    <Td>
                      <Badge
                        variant={
                          batch.status === "imported"
                            ? "green"
                            : batch.status === "rolled_back"
                              ? "red"
                              : "blue"
                        }
                      >
                        {batch.status}
                      </Badge>
                    </Td>

                    <Td>{batch.totalRows}</Td>
                    <Td>{batch.validCount}</Td>
                    <Td>{batch.invalidCount}</Td>
                    <Td>{batch.importedCount}</Td>
                    <Td>{batch.rollbackCount || 0}</Td>
                    <Td>{new Date(batch.createdAt).toLocaleString()}</Td>

                    <Td>
                      {batch.status === "imported" &&
                      batch.importedCount > 0 ? (
                        <Button
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => rollbackBatch(batch)}
                          disabled={rollbackMutation.isPending}
                        >
                          <RotateCcw size={16} className="mr-2" />
                          Rollback
                        </Button>
                      ) : (
                        "-"
                      )}
                    </Td>
                  </tr>
                ))}

                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-8 text-center font-bold text-slate-500"
                    >
                      No import history found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Modal>
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
