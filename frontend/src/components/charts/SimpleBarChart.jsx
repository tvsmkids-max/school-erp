export default function SimpleBarChart({ title, data = [], valueSuffix = "" }) {
  const maxValue = Math.max(...data.map((item) => Number(item.value || 0)), 1);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-lg font-black text-slate-950 dark:text-white">
        {title}
      </h3>

      <div className="space-y-4">
        {data.map((item) => {
          const value = Number(item.value || 0);
          const width = Math.max((value / maxValue) * 100, value > 0 ? 4 : 0);

          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm font-bold">
                <span className="truncate text-slate-700 dark:text-slate-200">
                  {item.label}
                </span>
                <span className="shrink-0 text-slate-500">
                  {value}
                  {valueSuffix}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full ${item.color || "bg-blue-600"}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}

        {data.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500 dark:bg-slate-950">
            No chart data available
          </div>
        ) : null}
      </div>
    </div>
  );
}
