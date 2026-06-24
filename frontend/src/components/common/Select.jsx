import { cn } from "../../utils/cn.js";

export default function Select({ className = "", children, ...props }) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
