import { AlertCircle, Home } from 'lucide-react';

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-12 px-4 text-slate-500 dark:text-slate-400 text-sm" role="status">
      <span className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-blue-900 dark:border-t-blue-500 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorMessage({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl mb-6 text-sm bg-red-50/90 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/60 shadow-sm" role="alert">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" strokeWidth={2} />
        <span className="font-medium">{error.message || String(error)}</span>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="text-center py-12 px-4 text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 grid place-items-center mb-1 text-slate-400 dark:text-slate-500 shadow-sm">
        <Home size={22} strokeWidth={1.8} />
      </div>
      <strong className="text-slate-900 dark:text-white font-bold text-base tracking-tight">{title}</strong>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
