export default function PageHeader({ title, description, actions = null }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-black text-slate-950 dark:text-white">
          {title}
        </h1>

        {description ? (
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
