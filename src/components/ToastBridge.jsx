import { useState, useEffect } from 'react';

/**
 * Toast bus: simple global pub/sub so any component can show toasts without
 * prop drilling.
 */
const listeners = new Set();
let nextToastId = 0;

export function showToast(message, type = 'info', duration = 4000) {
  const toast = { id: ++nextToastId, message, type, duration };
  listeners.forEach((fn) => fn(toast));
}

export function ToastBridge() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const handler = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(
        () =>
          setToasts((prev) => prev.filter((item) => item.id !== toast.id)),
        toast.duration
      );
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border animate-fade-in min-w-[320px] ${
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
        </div>
      ))}
    </div>
  );
}
