import { X } from "lucide-react";

export default function Modal({ open, title, children, onClose, maxWidth = "max-w-2xl" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className={`max-h-[90vh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900 ${maxWidth}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">{title}</h2>

          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-4rem)] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
