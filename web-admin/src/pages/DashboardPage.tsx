import React, { useState, useEffect, useCallback } from 'react';
import type { AlertRecord } from '../api/alerts';
import { getActiveAlertsApi } from '../api/alerts';
import type { DashboardCheckinData, EvacuationCapacity } from '../api/dashboard';
import { getDashboardCheckinsApi, getEvacuationCapacityApi } from '../api/dashboard';
import type { ScheduledDrill } from '../api/drills';
import { getUpcomingDrillsApi, startDrillNowApi } from '../api/drills';
import type { SosMessage } from '../api/sos';
import { getSosForAlertApi, replySosApi } from '../api/sos';
import { getSocket } from '../socket/socketClient';
import {
  Activity,
  ShieldCheck,
  UserX,
  CheckCircle,
  Radio,
  Clock,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  X,
  Volume2,
  Siren,
  Send,
  MapPin,
  MessageSquare,
  Building,
  Users,
  AlertOctagon,
  Calendar,
  Play,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [activeAlerts, setActiveAlerts] = useState<AlertRecord[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardCheckinData | null>(null);
  const [capacities, setCapacities] = useState<EvacuationCapacity[]>([]);
  const [sosMessages, setSosMessages] = useState<SosMessage[]>([]);
  const [upcomingDrill, setUpcomingDrill] = useState<ScheduledDrill | null>(null);
  const [countdown, setCountdown] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });
  const [replyingSosId, setReplyingSosId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSocketUpdate, setLastSocketUpdate] = useState<Date | null>(null);
  const [criticalAlertBanner, setCriticalAlertBanner] = useState<{
    name: string;
    message?: string;
    status: string;
    timestamp: Date;
  } | null>(null);

  const playCriticalSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  const fetchActiveAlerts = async () => {
    try {
      const [alertRes, drillRes] = await Promise.all([
        getActiveAlertsApi(),
        getUpcomingDrillsApi().catch(() => ({ data: [] })),
      ]);
      setActiveAlerts(alertRes.data);
      if (alertRes.data.length > 0 && !selectedAlertId) {
        setSelectedAlertId(alertRes.data[0].alert_id);
      }
      if (drillRes.data && drillRes.data.length > 0) {
        setUpcomingDrill(drillRes.data[0]);
      }
    } catch (err: any) {
      console.error('Failed to fetch active alerts or upcoming drills:', err);
    }
  };

  useEffect(() => {
    if (!upcomingDrill) return;

    const updateTimer = () => {
      const diff = new Date(upcomingDrill.scheduled_date).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setCountdown({ d, h, m, s });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [upcomingDrill]);

  const fetchDashboardData = useCallback(async (alertId: number) => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, sosRes, capRes] = await Promise.all([
        getDashboardCheckinsApi(alertId),
        getSosForAlertApi(alertId),
        getEvacuationCapacityApi(alertId),
      ]);
      setDashboardData(dashRes.data);
      setSosMessages(sosRes.data);
      setCapacities(capRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load live dashboard stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveAlerts();
  }, []);

  useEffect(() => {
    if (selectedAlertId) {
      fetchDashboardData(selectedAlertId);
    }
  }, [selectedAlertId, fetchDashboardData]);

  // Subscribe to real-time Socket.IO events (checkin:new, alert:broadcast, sos:new, sos:reply)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleCheckinNew = (data: any) => {
      setLastSocketUpdate(new Date());

      const status = data.status || data.checkin?.status;
      const userName = data.user_name || data.checkin?.user_name || 'Campus Person';
      const msg = data.message || data.checkin?.message;

      if (status === 'injured') {
        playCriticalSound();
        setCriticalAlertBanner({
          name: userName,
          message: msg,
          status: 'injured',
          timestamp: new Date(),
        });
      } else if (status === 'need_help' && !criticalAlertBanner) {
        setCriticalAlertBanner({
          name: userName,
          message: msg,
          status: 'need_help',
          timestamp: new Date(),
        });
      }

      if (selectedAlertId && (data.alert_id === selectedAlertId || data.checkin?.alert_id === selectedAlertId)) {
        fetchDashboardData(selectedAlertId);
      }
    };

    const handleAlertBroadcast = () => {
      fetchActiveAlerts();
    };

    const handleSosNew = (sos: SosMessage) => {
      setLastSocketUpdate(new Date());

      if (sos.priority === 'critical' || sos.priority === 'urgent') {
        playCriticalSound();
        setCriticalAlertBanner({
          name: sos.sender_name,
          message: sos.content,
          status: 'injured',
          timestamp: new Date(),
        });
      }

      setSosMessages((prev) => [sos, ...prev]);
    };

    const handleSosReply = (reply: SosMessage) => {
      setSosMessages((prev) => [...prev, reply]);
    };

    socket.on('checkin:new', handleCheckinNew);
    socket.on('alert:broadcast', handleAlertBroadcast);
    socket.on('sos:new', handleSosNew);
    socket.on('sos:reply', handleSosReply);

    return () => {
      socket.off('checkin:new', handleCheckinNew);
      socket.off('alert:broadcast', handleAlertBroadcast);
      socket.off('sos:new', handleSosNew);
      socket.off('sos:reply', handleSosReply);
    };
  }, [selectedAlertId, fetchDashboardData, criticalAlertBanner]);

  const handleSendReply = async (parentSosId: number) => {
    if (!replyText.trim()) return;

    try {
      setSubmittingReply(true);
      const res = await replySosApi(parentSosId, replyText.trim());
      setSosMessages((prev) => [...prev, res.data]);
      setReplyingSosId(null);
      setReplyText('');
    } catch (err: any) {
      alert(err.message || 'Failed to send reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const checkedInPercent =
    dashboardData && dashboardData.total_expected_users > 0
      ? Math.round((dashboardData.checked_in_count / dashboardData.total_expected_users) * 100)
      : 0;

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-[1920px] mx-auto w-full space-y-6">
      {/* Critical Visual Flash Banner */}
      {criticalAlertBanner && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between shadow-2xl transition-all ${
            criticalAlertBanner.status === 'injured'
              ? 'bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse'
              : 'bg-amber-950/90 border-amber-500 text-amber-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Volume2 className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                <span>
                  {criticalAlertBanner.status === 'injured'
                    ? '🚨 CRITICAL INJURY ALERT RECEIVED'
                    : '⚠️ HELP REQUEST RECEIVED'}
                </span>
                <span className="text-[10px] font-normal opacity-75">
                  ({criticalAlertBanner.timestamp.toLocaleTimeString()})
                </span>
              </h4>
              <p className="text-xs font-semibold mt-0.5">
                <span className="underline">{criticalAlertBanner.name}</span> reported status{' '}
                <strong className="uppercase">{criticalAlertBanner.status.replace('_', ' ')}</strong>
                {criticalAlertBanner.message && ` — "${criticalAlertBanner.message}"`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCriticalAlertBanner(null)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-wide">Live Evacuation Dashboard</h2>
            {lastSocketUpdate && (
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Updated: {lastSocketUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Polonoling National High School — Real-Time Check-In & Safety Accountability
          </p>
        </div>

        {/* Alert Selector Dropdown */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">Active Emergency Alert:</span>
          </div>
          <select
            value={selectedAlertId || ''}
            onChange={(e) => setSelectedAlertId(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
          >
            {activeAlerts.length === 0 && <option value="">No Active Emergency Alert</option>}
            {activeAlerts.map((a) => (
              <option key={a.alert_id} value={a.alert_id}>
                #{a.alert_id} - {a.title}
              </option>
            ))}
          </select>

          {selectedAlertId && (
            <button
              onClick={() => fetchDashboardData(selectedAlertId)}
              className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-900 border border-slate-800 rounded-xl transition-all"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-2xl">
          {error}
        </div>
      )}

      {/* Next Scheduled Evacuation Drill Countdown Banner */}
      {upcomingDrill && (
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Calendar className="w-6 h-6 animate-pulse text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Next Scheduled Evacuation Drill
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(upcomingDrill.scheduled_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-1">{upcomingDrill.title}</h3>
            </div>
          </div>

          {/* Live Countdown Timer */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-center">
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 min-w-[48px]">
                <p className="text-lg font-extrabold text-cyan-400 leading-none">{String(countdown.d).padStart(2, '0')}</p>
                <p className="text-[9px] uppercase font-bold text-slate-500 mt-0.5">Days</p>
              </div>
              <span className="text-slate-600 font-bold">:</span>
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 min-w-[48px]">
                <p className="text-lg font-extrabold text-cyan-400 leading-none">{String(countdown.h).padStart(2, '0')}</p>
                <p className="text-[9px] uppercase font-bold text-slate-500 mt-0.5">Hrs</p>
              </div>
              <span className="text-slate-600 font-bold">:</span>
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 min-w-[48px]">
                <p className="text-lg font-extrabold text-cyan-400 leading-none">{String(countdown.m).padStart(2, '0')}</p>
                <p className="text-[9px] uppercase font-bold text-slate-500 mt-0.5">Mins</p>
              </div>
              <span className="text-slate-600 font-bold">:</span>
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 min-w-[48px]">
                <p className="text-lg font-extrabold text-rose-400 leading-none">{String(countdown.s).padStart(2, '0')}</p>
                <p className="text-[9px] uppercase font-bold text-slate-500 mt-0.5">Secs</p>
              </div>
            </div>

            <button
              onClick={async () => {
                if (confirm(`Start drill "${upcomingDrill.title}" live now?`)) {
                  try {
                    await startDrillNowApi(upcomingDrill.drill_id);
                    alert('Practice drill alert issued!');
                    fetchActiveAlerts();
                  } catch (e: any) {
                    alert(e.message || 'Failed to start drill.');
                  }
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-lg shadow-rose-500/25 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Drill Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Expected Users */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campus Population</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">
            {dashboardData?.total_expected_users || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total registered students, faculty & staff</p>
        </div>

        {/* Card 2: Checked-In Safe */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Checked-In Safe</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">
            {dashboardData?.checked_in_count || 0}
          </p>
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1 font-semibold">
              <span className="text-slate-400">Accountability Progress</span>
              <span className="text-emerald-400">{checkedInPercent}%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${checkedInPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Missing / Unaccounted */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unaccounted / Missing</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-rose-400">
            {dashboardData?.missing_count || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Pending safety status response</p>
        </div>
      </div>

      {/* Tables Breakdown: Checked-In vs Missing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Table: Safe / Checked-in Users */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Safety Check-In Roster</h3>
            </div>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {dashboardData?.checked_in_users.length || 0} Responses
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Role / Dept</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(!dashboardData || dashboardData.checked_in_users.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No safety check-ins recorded yet for this alert.
                    </td>
                  </tr>
                )}

                {dashboardData?.checked_in_users.map((user) => {
                  const status = user.status || 'safe';
                  let rowBg = 'hover:bg-slate-800/40';
                  if (status === 'injured') {
                    rowBg = 'bg-rose-950/40 hover:bg-rose-900/50 border-l-4 border-l-rose-500';
                  } else if (status === 'need_help') {
                    rowBg = 'bg-amber-950/30 hover:bg-amber-900/40 border-l-4 border-l-amber-500';
                  }

                  return (
                    <tr key={user.checkin_id} className={`${rowBg} transition-colors`}>
                      <td className="py-2.5 px-3">
                        {status === 'injured' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> INJURED
                          </span>
                        )}
                        {status === 'need_help' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" /> NEED HELP
                          </span>
                        )}
                        {status === 'safe' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> SAFE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {user.full_name}
                        {user.id_number && <span className="block text-[10px] text-slate-500">{user.id_number}</span>}
                        {user.message && (
                          <span className="block text-[11px] text-amber-300 font-medium italic mt-1 bg-slate-900/80 px-2 py-0.5 rounded border border-amber-500/20">
                            💬 "{user.message}"
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-cyan-400 border border-cyan-500/20">
                          {user.role}
                        </span>
                        {user.department && <span className="block text-[10px] text-slate-400 mt-0.5">{user.department}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-medium">
                        {user.zone_name || 'Evacuation Area'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(user.checked_in_at).toLocaleTimeString()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Table: Missing / Unaccounted Users */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserX className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-white">Unaccounted / Missing Roster</h3>
            </div>
            <span className="text-xs font-extrabold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
              {dashboardData?.missing_users.length || 0} Pending
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(!dashboardData || dashboardData.missing_users.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-emerald-400 font-semibold">
                      🎉 All campus personnel & students have checked in safe!
                    </td>
                  </tr>
                )}

                {dashboardData?.missing_users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {user.full_name}
                      {user.id_number && <span className="block text-[10px] text-slate-500">{user.id_number}</span>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{user.department || 'N/A'}</td>
                    <td className="py-2.5 px-3 text-rose-400 font-bold uppercase text-[10px]">
                      Not Checked In
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Evacuation Center Capacity Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide">Evacuation Center Capacity Tracking</h3>
              <p className="text-xs text-slate-400">
                Real-time occupancy status & capacity thresholds for assembly points
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
            {capacities.length} Active Centers
          </span>
        </div>

        {capacities.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
            No active evacuation zones configured yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capacities.map((cap) => {
              const pct = cap.percentage_full;
              const isFull = cap.is_full || pct >= 100;

              let barColor = 'from-emerald-500 to-teal-400';
              let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              let statusLabel = 'NORMAL CAPACITY';

              if (pct >= 95 || isFull) {
                barColor = 'from-rose-600 to-red-500 animate-pulse';
                badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
                statusLabel = 'AT CAPACITY — REDIRECT';
              } else if (pct >= 80) {
                barColor = 'from-orange-500 to-amber-500';
                badgeColor = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
                statusLabel = 'HIGH OCCUPANCY';
              } else if (pct >= 50) {
                barColor = 'from-amber-400 to-yellow-500';
                badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                statusLabel = 'MODERATE OCCUPANCY';
              }

              return (
                <div
                  key={cap.zone_id}
                  className={`p-4 rounded-xl border transition-all ${
                    isFull
                      ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-500/10'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{cap.zone_name}</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {cap.zone_type === 'evacuation_point' ? 'Primary Evacuation Point' : 'Safe Assembly Zone'}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${badgeColor}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {/* Occupancy Stats */}
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Occupancy:</span>
                    </span>
                    <span className={isFull ? 'text-rose-400 font-extrabold' : 'text-white'}>
                      {cap.current_occupancy} / {cap.max_capacity} people ({pct}%)
                    </span>
                  </div>

                  {/* Visual Capacity Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-2.5 rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  {isFull && (
                    <div className="mt-2.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[10px] font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                      <span>This evacuation center is full! Personnel are being redirected to alternative zones.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-Time Two-Way SOS Emergency Messages Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-rose-500/40 shadow-2xl space-y-4 glow-red">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Siren className="w-5 h-5 animate-pulse text-rose-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white tracking-wide">Active SOS Emergency Dispatch</h3>
                <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {sosMessages.length} Messages
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Two-way real-time emergency communication between distressed personnel and safety coordinators
              </p>
            </div>
          </div>
        </div>

        {sosMessages.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
            No distress SOS messages sent for this alert.
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {sosMessages.map((sos) => {
              const isCoordinatorReply = sos.receiver_id !== null;
              const isCritical = sos.priority === 'critical' || sos.priority === 'urgent';
              const isReplyingThis = replyingSosId === sos.message_id;

              return (
                <div
                  key={sos.message_id}
                  className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                    isCoordinatorReply
                      ? 'bg-slate-900/70 border-slate-800 ml-6 sm:ml-12 border-l-4 border-l-cyan-500'
                      : isCritical
                      ? 'bg-rose-950/40 border-rose-500/50 animate-pulse border-l-4 border-l-rose-500 shadow-lg shadow-rose-500/10'
                      : 'bg-slate-900/90 border-slate-800 border-l-4 border-l-amber-500'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          isCoordinatorReply
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                            : isCritical
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isCoordinatorReply ? 'COORDINATOR REPLY' : `SOS ${sos.priority.toUpperCase()}`}
                      </span>

                      <h4 className="text-xs font-bold text-white">
                        {sos.sender_name}{' '}
                        <span className="text-[10px] font-normal text-slate-400">
                          ({sos.sender_role} • {sos.sender_department || 'General'})
                        </span>
                      </h4>

                      {sos.receiver_name && (
                        <span className="text-[10px] text-slate-400">
                          ➜ <strong className="text-cyan-400">{sos.receiver_name}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(sos.created_at).toLocaleTimeString()}</span>
                      </div>

                      {sos.location_geojson && (
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800 flex items-center gap-1 font-semibold">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>
                            {sos.location_geojson.coordinates[1].toFixed(4)}, {sos.location_geojson.coordinates[0].toFixed(4)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Body */}
                  <p className="text-xs font-medium text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    "{sos.content}"
                  </p>

                  {/* Coordinator Inline Reply Action */}
                  {!isCoordinatorReply && (
                    <div className="pt-1 flex items-center justify-end">
                      {isReplyingThis ? (
                        <div className="w-full flex items-center space-x-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to ${sos.sender_name}...`}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSendReply(sos.message_id)}
                            disabled={submittingReply || !replyText.trim()}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send Reply</span>
                          </button>
                          <button
                            onClick={() => {
                              setReplyingSosId(null);
                              setReplyText('');
                            }}
                            className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setReplyingSosId(sos.message_id);
                            setReplyText('');
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Reply to {sos.sender_name}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
