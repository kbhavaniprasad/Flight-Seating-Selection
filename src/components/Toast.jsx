import { useState, useEffect, useCallback } from 'react';

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  useEffect(() => {
    const timers = toasts.map((t) => {
      return setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, t.duration);
    });
    return () => timers.forEach((tm) => clearTimeout(tm));
  }, [toasts]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border animate-fade-in min-w-[300px] ${
            t.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : t.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : t.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
          role="alert"
          aria-live="polite"
        >
          <span className="flex-shrink-0 mt-0.5">
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}
          </span>
          <span className="text-sm font-medium">{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="ml-auto mt-0.5 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  // This hook is a placeholder; the ToastContainer manages state via context-free approach.
  // To keep the app simple and dependency-free, toasts are dispatched through a global module.
  return { addToast: () => {} };
}
