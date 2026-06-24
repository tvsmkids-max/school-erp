import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import {
  getStudentFieldConfigApi,
  resetStudentFieldConfigApi,
  updateStudentFieldConfigApi,
} from "../../api/studentFieldConfig.api.js";
import Button from "../../components/common/Button.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";

export default function StudentFieldConfigPage() {
  const queryClient = useQueryClient();
  const [groups, setGroups] = useState([]);

  const configQuery = useQuery({
    queryKey: ["student-field-config"],
    queryFn: getStudentFieldConfigApi,
  });

  useEffect(() => {
    if (configQuery.data?.data) {
      setGroups(configQuery.data.data);
    }
  }, [configQuery.data]);

  const saveMutation = useMutation({
    mutationFn: updateStudentFieldConfigApi,
    onSuccess: (response) => {
      setGroups(response.data);
      queryClient.invalidateQueries({ queryKey: ["student-field-config"] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetStudentFieldConfigApi,
    onSuccess: (response) => {
      setGroups(response.data);
      queryClient.invalidateQueries({ queryKey: ["student-field-config"] });
    },
  });

  const updateField = (fieldKey, patch) => {
    setGroups((currentGroups) =>
      currentGroups.map((group) => ({
        ...group,
        fields: group.fields.map((field) => {
          if (field.fieldKey !== fieldKey) return field;

          const nextField = {
            ...field,
            ...patch,
          };

          if (nextField.isMandatory) {
            nextField.isVisible = true;
          }

          return nextField;
        }),
      })),
    );
  };

  const saveConfig = () => {
    const fields = groups.flatMap((group) =>
      group.fields.map((field) => ({
        fieldKey: field.fieldKey,
        label: field.label,
        isVisible: Boolean(field.isVisible),
        isMandatory: Boolean(field.isMandatory),
        isReadOnly: Boolean(field.isReadOnly),
        sortOrder: Number(field.sortOrder || 1),
      })),
    );

    saveMutation.mutate(fields);
  };

  const resetDefaults = () => {
    if (window.confirm("Reset all student field settings to defaults?")) {
      resetMutation.mutate();
    }
  };

  return (
    <div>
      <PageHeader
        title="Student Field Configuration"
        description="Control visible, mandatory and read-only fields in the student form. Mandatory fields are always visible."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-slate-600 hover:bg-slate-700"
              onClick={resetDefaults}
              disabled={resetMutation.isPending}
            >
              <RotateCcw size={18} className="mr-2" />
              {resetMutation.isPending ? "Resetting..." : "Reset Defaults"}
            </Button>

            <Button
              type="button"
              onClick={saveConfig}
              disabled={saveMutation.isPending}
            >
              <Save size={18} className="mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        }
      />

      <div className="mb-4 rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800 shadow-soft dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
        <div className="flex gap-3">
          <SlidersHorizontal className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-black">How this works</p>
            <p className="mt-1">
              If a field is hidden, it will not appear on the Add/Edit Student
              form. If a field is mandatory, users must fill it before saving.
              Section is intentionally optional for now.
            </p>
          </div>
        </div>
      </div>

      {configQuery.isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center font-bold text-slate-500 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          Loading field configuration...
        </div>
      ) : null}

      {configQuery.isError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700 shadow-soft dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {configQuery.error.message}
        </div>
      ) : null}

      {saveMutation.isSuccess ? (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          Student field configuration saved successfully.
        </div>
      ) : null}

      {saveMutation.isError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {saveMutation.error.message}
        </div>
      ) : null}

      <div className="space-y-5">
        {groups.map((group) => (
          <section
            key={group.groupKey}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                {group.groupLabel}
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                {group.groupKey}
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <Th>Field</Th>
                    <Th>Label</Th>
                    <Th>Visible</Th>
                    <Th>Mandatory</Th>
                    <Th>Read Only</Th>
                    <Th>Order</Th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {group.fields.map((field) => (
                    <tr
                      key={field.fieldKey}
                      className="hover:bg-slate-50 dark:hover:bg-slate-950/60"
                    >
                      <Td>
                        <span className="font-black text-slate-900 dark:text-white">
                          {field.fieldKey}
                        </span>
                      </Td>

                      <Td>
                        <input
                          value={field.label}
                          onChange={(event) =>
                            updateField(field.fieldKey, {
                              label: event.target.value,
                            })
                          }
                          className="w-full min-w-48 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                      </Td>

                      <Td>
                        <Toggle
                          checked={field.isVisible}
                          disabled={field.isMandatory}
                          onChange={(checked) =>
                            updateField(field.fieldKey, { isVisible: checked })
                          }
                        />
                      </Td>

                      <Td>
                        <Toggle
                          checked={field.isMandatory}
                          disabled={field.fieldKey === "sectionId"}
                          onChange={(checked) =>
                            updateField(field.fieldKey, {
                              isMandatory: checked,
                            })
                          }
                        />

                        {field.fieldKey === "sectionId" ? (
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            Optional for now
                          </p>
                        ) : null}
                      </Td>

                      <Td>
                        <Toggle
                          checked={field.isReadOnly}
                          onChange={(checked) =>
                            updateField(field.fieldKey, { isReadOnly: checked })
                          }
                        />
                      </Td>

                      <Td>
                        <input
                          type="number"
                          min="1"
                          value={field.sortOrder}
                          onChange={(event) =>
                            updateField(field.fieldKey, {
                              sortOrder: event.target.value,
                            })
                          }
                          className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Toggle({ checked, disabled = false, onChange }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
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
