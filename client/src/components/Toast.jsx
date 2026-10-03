import { createContext, useCallback, useContext, useState } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        className="fixed top-4 right-4 sm:top-5 sm:right-5 flex flex-col items-end gap-2 z-50 pointer-events-none max-w-[calc(100vw-2rem)] sm:max-w-sm"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-sm shadow-xl max-w-full sm:max-w-sm border transition-all ${
              t.type === 'error'
                ? 'bg-red-600 text-white border-transparent'
                : 'bg-slate-900 dark:bg-slate-800 text-white border-slate-800 dark:border-slate-700'
            }`}
          >
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-ml-1 -mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded text-white/70 hover:text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-1 focus:ring-white shrink-0 cursor-pointer"
              aria-label="Dismiss notification"
              title="Dismiss"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
            <span className="flex-1 leading-snug break-words">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
