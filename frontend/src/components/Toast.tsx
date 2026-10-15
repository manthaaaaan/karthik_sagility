import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl shadow-floating border flex items-start gap-3 animate-slide-up transition-all ${
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-ink-main'
              : toast.type === 'error'
              ? 'bg-white border-rose-200 text-ink-main'
              : 'bg-white border-blue-200 text-ink-main'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : toast.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          )}

          <div className="flex-1 text-xs">
            <div className="font-bold">{toast.message}</div>
            {toast.description && (
              <div className="text-ink-secondary mt-0.5">{toast.description}</div>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-ink-secondary hover:text-ink-main p-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
