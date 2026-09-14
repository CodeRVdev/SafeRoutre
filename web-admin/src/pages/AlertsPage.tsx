import React, { useState, useEffect } from 'react';
import type { AlertRecord } from '../api/alerts';
import { getActiveAlertsApi, deactivateAlertApi } from '../api/alerts';
import type { HazardFeatureCollection } from '../api/hazards';
import { getActiveHazardsApi } from '../api/hazards';
import { BroadcastAlertModal } from '../components/Alerts/BroadcastAlertModal';
import { getSocket } from '../socket/socketClient';
import { Radio, CheckCircle, Clock, XCircle } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [hazards, setHazards] = useState<HazardFeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  const fetchAlertsAndHazards = async () => {
    try {
      setLoading(true);
      setError(null);
      const [alertsRes, hazardsRes] = await Promise.all([
        getActiveAlertsApi(),
        getActiveHazardsApi(),
      ]);
      setAlerts(alertsRes.data);
      setHazards(hazardsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch emergency alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsAndHazards();
  }, []);

  // Socket.IO real-time alert updates listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAlertBroadcast = () => {
      fetchAlertsAndHazards();
    };

    socket.on('alert:broadcast', handleAlertBroadcast);

    return () => {
      socket.off('alert:broadcast', handleAlertBroadcast);
    };
  }, []);

  const handleDeactivate = async (id: number) => {
    try {
      await deactivateAlertApi(id);
      fetchAlertsAndHazards();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate alert.');
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-[1920px] mx-auto w-full space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Emergency Alert Broadcasting</h2>
          <p className="text-xs text-slate-400 mt-1">
            Polonoling National High School Emergency Broadcast System & Incident Center
          </p>
        </div>

        <button
          onClick={() => setIsBroadcastOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/30 transition-all duration-200"
        >
          <Radio className="w-4 h-4 animate-pulse text-white" />
          <span>Broadcast New Alert</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-2xl">
          {error}
        </div>
      )}

      {/* Alerts Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Emergency Alerts</h3>

        {alerts.length === 0 && !loading && (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">No Active Campus Emergency Alerts</h4>
            <p className="text-xs text-slate-500 mt-1">
              All clear at Polonoling National High School. Broadcast an alert if an evacuation is needed.
            </p>
          </div>
        )}

        {alerts.map((alert) => (
          <div
            key={alert.alert_id}
            className={`glass-panel p-6 rounded-2xl border ${
              alert.is_drill ? 'border-blue-500/30 glow-blue' : 'border-rose-500/30 glow-red'
            } shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all`}
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    alert.is_drill
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {alert.is_drill ? `🔵 DRILL EXERCISE #${alert.alert_id}` : `ACTIVE ALERT #${alert.alert_id}`}
                </span>
                <div className="flex items-center space-x-1 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Broadcasted: {new Date(alert.sent_at).toLocaleString()}</span>
                </div>
              </div>

              <h3 className="text-lg font-extrabold text-white">{alert.title}</h3>
              <p className="text-sm text-slate-300 max-w-3xl">{alert.message}</p>

              {alert.sent_by_name && (
                <p className="text-xs text-slate-500">
                  Issued By: <span className="text-slate-300 font-semibold">{alert.sent_by_name}</span>
                </p>
              )}
            </div>

            {/* Right Action */}
            <div className="shrink-0">
              <button
                onClick={() => handleDeactivate(alert.alert_id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border ${
                  alert.is_drill ? 'text-blue-400 border-blue-500/30' : 'text-rose-400 border-rose-500/30'
                } transition-all duration-200`}
              >
                <XCircle className={`w-4 h-4 ${alert.is_drill ? 'text-blue-400' : 'text-rose-400'}`} />
                <span>{alert.is_drill ? 'End Drill Exercise' : 'Deactivate Alert'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Broadcast Alert Modal */}
      <BroadcastAlertModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        onSuccess={fetchAlertsAndHazards}
        hazards={hazards}
      />
    </div>
  );
};
