import React, { useEffect, useState } from 'react';
import type { ToastMessage } from '../../context/ToastContext';
import { useToast } from '../../context/ToastContext';
import { X, Info, CheckCircle, AlertTriangle, Siren } from 'lucide-react';

const ToastItem: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
  const { removeToast } = useToast();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 8000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        removeToast(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.id, removeToast]);

  let icon = <Info className="w-5 h-5 text-cyan-400" />;
  let borderClass = 'border-cyan-500/40 bg-slate-900/95 shadow-cyan-500/10 text-cyan-300';
  let progressClass = 'bg-cyan-500';

  if (toast.type === 'success') {
    icon = <CheckCircle className="w-5 h-5 text-emerald-400" />;
    borderClass = 'border-emerald-500/40 bg-slate-900/95 shadow-emerald-500/10 text-emerald-300';
    progressClass = 'bg-emerald-500';
  } else if (toast.type === 'warning') {
    icon = <AlertTriangle className="w-5 h-5 text-amber-400" />;
    borderClass = 'border-amber-500/40 bg-slate-900/95 shadow-amber-500/10 text-amber-300';
    progressClass = 'bg-amber-500';
  } else if (toast.type === 'critical') {
    icon = <Siren className="w-5 h-5 text-rose-400 animate-pulse" />;
    borderClass = 'border-rose-500 bg-slate-950/95 shadow-rose-600/30 text-rose-300 animate-pulse-border';
    progressClass = 'bg-rose-500';
  }

  return (
    <div
      className={`pointer-events-auto w-full p-4 rounded-2xl border backdrop-blur-xl shadow-2xl space-y-2.5 relative overflow-hidden transition-all duration-300 animate-slide-left ${borderClass}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 pr-4">
          <div className="mt-0.5 shrink-0">{icon}</div>
          <div>
            <h4 className="text-xs font-extrabold text-white leading-tight">{toast.title}</h4>
            <p className="text-xs text-slate-300 mt-1 leading-snug">{toast.message}</p>
            <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
              {toast.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden">
        <div
          className={`h-1 transition-all duration-75 ease-linear ${progressClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
