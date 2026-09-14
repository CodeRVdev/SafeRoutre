import React from 'react';
import { useToast } from '../../context/ToastContext';
import { Bell, X, Trash2, Info, CheckCircle, AlertTriangle, Siren } from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const { notifications, isDrawerOpen, closeDrawer, clearAllNotifications } = useToast();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-slide-left">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Recent Safety Notifications</h3>
              <p className="text-[10px] text-slate-400">
                {notifications.length} Total Events Logged
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Clear All Notifications"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={closeDrawer}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 && (
            <div className="py-20 text-center text-slate-500 text-xs">
              No recent notifications recorded.
            </div>
          )}

          {notifications.map((item) => {
            let icon = <Info className="w-4 h-4 text-cyan-400" />;
            let badgeClass = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';

            if (item.type === 'success') {
              icon = <CheckCircle className="w-4 h-4 text-emerald-400" />;
              badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            } else if (item.type === 'warning') {
              icon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
              badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            } else if (item.type === 'critical') {
              icon = <Siren className="w-4 h-4 text-rose-400" />;
              badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
            }

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 space-y-1.5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {icon}
                    <span className="text-xs font-bold text-white">{item.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${badgeClass}`}>
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-slate-300 pl-6 leading-snug">{item.message}</p>
                <p className="text-[10px] text-slate-500 pl-6 font-mono">
                  {item.timestamp.toLocaleTimeString()} — {item.timestamp.toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
