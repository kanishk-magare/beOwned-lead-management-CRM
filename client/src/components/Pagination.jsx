export default function Pagination({ page, totalPages, total, limit, onChange }) {
  if (!total) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex justify-between items-center py-3.5 px-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400 gap-3 flex-wrap border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0f172a]/50">
      <span className="font-medium">
        Showing <strong className="font-semibold text-slate-800 dark:text-slate-200">{from}</strong>–<strong className="font-semibold text-slate-800 dark:text-slate-200">{to}</strong> of <strong className="font-semibold text-slate-800 dark:text-slate-200">{total}</strong> leads
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          ← Prev
        </button>
        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
