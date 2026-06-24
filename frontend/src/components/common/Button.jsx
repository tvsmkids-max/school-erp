import { cn } from "../../utils/cn.js";

export default function Button({ className = "", type = "button", children, ...props }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
