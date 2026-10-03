import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'beowned_crm_theme';

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    // 1. Check localStorage first
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch {
      // localStorage may fail in restricted privacy modes
    }

    // 2. Check document attribute set by inline script
    const docTheme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null;
    if (docTheme === 'dark' || docTheme === 'light') {
      return docTheme;
    }

    // 3. Fallback to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return 'light';
  });

  // Apply theme to document root and persist
  const applyTheme = (nextTheme, withTransition = false) => {
    const root = document.documentElement;

    if (withTransition) {
      root.classList.add('theme-transitioning');
      window.clearTimeout(window.__themeTransitionTimer);
      window.__themeTransitionTimer = window.setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 300);
    }

    root.setAttribute('data-theme', nextTheme);
    root.style.colorScheme = nextTheme;
    root.classList.toggle('dark', nextTheme === 'dark');

    // Update meta color-scheme
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.content = nextTheme;
    }

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // ignore storage errors
    }
  };

  const setTheme = (newTheme) => {
    const target = newTheme === 'dark' ? 'dark' : 'light';
    setThemeState(target);
    applyTheme(target, true);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Synchronize on mount and handle system preference changes if no manual preference stored
  useEffect(() => {
    applyTheme(theme, false);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      // Only follow system change if user has not explicitly chosen a preference
      try {
        const hasManualPref = localStorage.getItem(STORAGE_KEY);
        if (!hasManualPref) {
          const next = e.matches ? 'dark' : 'light';
          setThemeState(next);
          applyTheme(next, true);
        }
      } catch {
        const next = e.matches ? 'dark' : 'light';
        setThemeState(next);
        applyTheme(next, true);
      }
    };

    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    } else if (mediaQuery?.addListener) {
      mediaQuery.addListener(handleSystemChange);
      return () => mediaQuery.removeListener(handleSystemChange);
    }
  }, [theme]);

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
