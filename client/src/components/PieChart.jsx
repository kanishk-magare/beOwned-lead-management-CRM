import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SOURCE_COLORS = {
  Facebook: '#3b82f6',
  Google: '#ef4444',
  Instagram: '#ec4899',
  Referral: '#8b5cf6',
  Website: '#06b6d4',
  'Walk-in': '#10b981',
  Other: '#f59e0b',
};

const FALLBACK_COLORS = ['#3b82f6', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

export default function PieChart({ items = [], labelKey = 'source', valueKey = 'count' }) {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Filter out items with 0 leads and calculate total
  const validItems = items.filter((item) => Number(item[valueKey]) > 0);
  const total = validItems.reduce((sum, item) => sum + Number(item[valueKey]), 0);

  if (total === 0 || validItems.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
        No lead source data available
      </div>
    );
  }

  // Standard SVG circle parameters for donut chart (no trigonometry or coordinate math)
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.3
  let cumulativeOffset = 0;

  const slices = validItems.map((item, index) => {
    const value = Number(item[valueKey]);
    const fraction = value / total;
    const percentage = Math.round(fraction * 100);
    const strokeLength = fraction * circumference;
    const strokeOffset = -cumulativeOffset;

    cumulativeOffset += strokeLength;

    const color = SOURCE_COLORS[item[labelKey]] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

    return {
      label: item[labelKey],
      value,
      percentage,
      color,
      strokeLength,
      strokeOffset,
    };
  });

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  const handleFilterBySource = (sourceLabel) => {
    navigate(`/leads?source=${encodeURIComponent(sourceLabel)}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
      {/* SVG Donut Chart */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg viewBox="0 0 100 100" className="w-52 h-52 sm:w-56 sm:h-56 -rotate-90 select-none">
          {slices.map((slice, index) => {
            const isHovered = hoveredIndex === index;
            const isDimmed = hoveredIndex !== null && !isHovered;

            return (
              <circle
                key={slice.label}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? 18 : 15}
                strokeDasharray={`${slice.strokeLength} ${circumference}`}
                strokeDashoffset={slice.strokeOffset}
                className="cursor-pointer transition-all duration-200"
                style={{ opacity: isDimmed ? 0.35 : 1 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleFilterBySource(slice.label)}
                role="button"
                tabIndex={0}
                aria-label={`${slice.label}: ${slice.value} leads (${slice.percentage}%)`}
              />
            );
          })}
        </svg>

        {/* Center Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          {activeSlice ? (
            <>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate max-w-[90px]">
                {activeSlice.label}
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {activeSlice.value}
              </span>
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-400">
                {activeSlice.percentage}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {total}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">leads</span>
            </>
          )}
        </div>
      </div>

      {/* Legend & Channel Breakdown */}
      <div className="flex-1 w-full max-w-xs flex flex-col gap-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 px-1 flex justify-between">
          <span>Source</span>
          <span>Leads (%)</span>
        </div>

        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
          {slices.map((slice, index) => {
            const isHovered = hoveredIndex === index;
            const isDimmed = hoveredIndex !== null && !isHovered;

            return (
              <button
                key={slice.label}
                type="button"
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer border ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                } ${isDimmed ? 'opacity-50' : 'opacity-100'}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleFilterBySource(slice.label)}
                title={`Filter by ${slice.label}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: slice.color }}
                  />
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                    {slice.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {slice.value}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] w-8 text-right">
                    {slice.percentage}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 px-1 mt-1 text-center sm:text-left">
          Hover to inspect · Click to filter leads
        </p>
      </div>
    </div>
  );
}
