/** Simple horizontal bar chart built with Tailwind CSS — no chart library needed. */
export default function BarList({ items, labelKey, valueKey = 'count', colorFor }) {
  const max = Math.max(1, ...items.map((i) => i[valueKey]));
  const total = items.reduce((sum, i) => sum + i[valueKey], 0);

  return (
    <ul className="flex flex-col gap-4 list-none m-0 p-0">
      {items.map((item) => {
        const value = item[valueKey];
        const pct = total ? Math.round((value / total) * 100) : 0;
        return (
          <li key={item[labelKey]}>
            <div className="flex justify-between items-center text-sm mb-1.5 text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{item[labelKey]}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {value} <span className="text-[11px] text-slate-400 dark:text-slate-500">({pct}%)</span>
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out bg-blue-900 dark:bg-blue-500 min-w-[4px]"
                style={{
                  width: `${(value / max) * 100}%`,
                  background: colorFor ? colorFor(item[labelKey]) : undefined,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
