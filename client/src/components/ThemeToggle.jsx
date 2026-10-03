import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#101726] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 select-none cursor-pointer group shadow-sm"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      <span className="inline-flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" aria-hidden="true">
        {isDark ? (
          <Sun size={17} strokeWidth={2} />
        ) : (
          <Moon size={17} strokeWidth={2} />
        )}
      </span>
      <span className="text-xs">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
