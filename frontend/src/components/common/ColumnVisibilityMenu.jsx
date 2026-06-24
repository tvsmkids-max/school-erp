import { Columns3 } from "lucide-react";
import { useState } from "react";
import Button from "./Button.jsx";

export default function ColumnVisibilityMenu({
  columns,
  visibleColumnKeys,
  onChange,
}) {
  const [open, setOpen] = useState(false);

  const toggleColumn = (columnKey) => {
    if (visibleColumnKeys.includes(columnKey)) {
      onChange(visibleColumnKeys.filter((key) => key !== columnKey));
    } else {
      onChange([...visibleColumnKeys, columnKey]);
    }
  };

  const selectableColumns = columns.filter((column) => !column.alwaysVisible);

  return (
    <div className="relative">
      <Button
        type="button"
        className="bg-slate-700 hover:bg-slate-800"
        onClick={() => setOpen((value) => !value)}
      >
        <Columns3 size={18} className="mr-2" />
        Columns
      </Button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
            <p className="text-sm font-black text-slate-900 dark:text-white">
              Column Visibility
            </p>

            <button
              type="button"
              className="text-xs font-bold text-blue-600"
              onClick={() =>
                onChange(selectableColumns.map((column) => column.key))
              }
            >
              Show All
            </button>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto">
            {selectableColumns.map((column) => (
              <label
                key={column.key}
                className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-950"
              >
                <span>{column.label}</span>

                <input
                  type="checkbox"
                  checked={visibleColumnKeys.includes(column.key)}
                  onChange={() => toggleColumn(column.key)}
                />
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
