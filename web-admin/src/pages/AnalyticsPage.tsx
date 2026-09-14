import React, { useState, useEffect } from 'react';
import type { AnalyticsData } from '../api/analytics';
import { getAnalyticsApi } from '../api/analytics';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  Siren,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  RefreshCw,
  BarChart3,
  Flame,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnalyticsApi(range);
      setAnalytics(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load GIS analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  // Color helper for response time bars
  const getResponseTimeColor = (minutes: number) => {
    if (minutes < 2) return '#10b981'; // Emerald (<2m)
    if (minutes <= 5) return '#f59e0b'; // Amber (2-5m)
    return '#f43f5e'; // Rose (>5m)
  };

  // Color map for status pie chart
  const STATUS_COLORS: Record<string, string> = {
    safe: '#10b981',
    need_help: '#f59e0b',
    injured: '#f43f5e',
  };

  const STATUS_LABELS: Record<string, string> = {
    safe: 'Safe',
    need_help: 'Need Help',
    injured: 'Injured',
  };

  const HAZARD_TYPES = ['Structural', 'Electrical', 'Fire', 'Flood', 'Blocked Path'];
  const HAZARD_SEVERITIES = ['low', 'moderate', 'high', 'critical'] as const;

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-6 max-w-[1920px] mx-auto w-full">
      {/* Top Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Campus GIS Emergency Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Polonoling National High School Emergency Response Performance Metrics & GIS Heatmaps
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-900 border border-slate-800 rounded-xl transition-colors"
            title="Refresh Analytics Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2.5 mr-1.5" />
            <button
              onClick={() => setRange('7d')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                range === '7d'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                range === '30d'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setRange('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                range === 'all'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAnalytics} className="underline text-xs font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Alerts */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Alerts Issued
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Siren className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {analytics?.kpis.total_alerts ?? 0}
            </span>
            <span className="text-xs text-slate-400">broadcasts</span>
          </div>
          <p className="text-[11px] text-cyan-400 font-semibold">
            {analytics?.kpis.drill_alerts_count ?? 0} Drills • {analytics?.kpis.real_alerts_count ?? 0} Real Emergencies
          </p>
        </div>

        {/* Avg Response Time */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Avg Response Time
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {analytics?.kpis.avg_response_time_minutes ?? 0}
            </span>
            <span className="text-xs text-emerald-400 font-bold">minutes</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Drills: <strong className="text-blue-400">{analytics?.kpis.avg_drill_response_time_minutes ?? 0}m</strong> | Real: <strong className="text-rose-400">{analytics?.kpis.avg_real_response_time_minutes ?? 0}m</strong>
          </p>
        </div>

        {/* Completion Rate */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Check-in Rate
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {analytics?.kpis.overall_completion_rate ?? 0}%
            </span>
            <span className="text-xs text-blue-400 font-bold">completion</span>
          </div>
          <p className="text-[11px] text-slate-500">Across active campus personnel</p>
        </div>

        {/* Total Hazards */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Hazards
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {analytics?.kpis.total_hazards ?? 0}
            </span>
            <span className="text-xs text-slate-400">reported</span>
          </div>
          <p className="text-[11px] text-slate-500">Active and resolved GIS hazards</p>
        </div>
      </div>

      {/* Main Charts Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Check-in Response Times per Alert */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Average Check-in Response Time per Alert
              </h3>
              <p className="text-[11px] text-slate-400">
                Speed from alert broadcast to user check-in (in minutes)
              </p>
            </div>
            <div className="flex items-center space-x-3 text-[10px] font-bold">
              <span className="flex items-center space-x-1 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Drill</span>
              </span>
              <span className="flex items-center space-x-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>&lt;2m</span>
              </span>
              <span className="flex items-center space-x-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>2-5m</span>
              </span>
              <span className="flex items-center space-x-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>&gt;5m</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {analytics?.response_times && analytics.response_times.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.response_times} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="sent_date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit="m" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="avg_minutes" name="Avg Response Time (min)" radius={[6, 6, 0, 0]}>
                    {analytics.response_times.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.is_drill ? '#3b82f6' : getResponseTimeColor(entry.avg_minutes)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No alert response time data available for selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Check-in Status Pie/Donut Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Check-in Status Breakdown
            </h3>
            <p className="text-[11px] text-slate-400">
              Distribution of Safe, Need Help, and Injured personnel responses
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {analytics?.status_breakdown && analytics.status_breakdown.some((s) => s.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.status_breakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {analytics.status_breakdown.map((entry, index) => (
                      <Cell
                        key={`pie-cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || '#06b6d4'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${value} check-ins`,
                      STATUS_LABELS[name] || name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    formatter={(value: any) => STATUS_LABELS[String(value)] || String(value)}
                    wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No check-in status data available for selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Role Breakdown Horizontal Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Check-in Completion Rate by Role
            </h3>
            <p className="text-[11px] text-slate-400">
              Percentage of registered personnel checking in per user role
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            {analytics?.role_rates && analytics.role_rates.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={analytics.role_rates}
                  margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
                  <YAxis
                    dataKey="role"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val: any) => String(val).toUpperCase()}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value}% Completion`, 'Completion Rate']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="rate" name="Completion Rate (%)" fill="#06b6d4" radius={[0, 6, 6, 0]}>
                    {analytics.role_rates.map((_, index) => (
                      <Cell
                        key={`role-cell-${index}`}
                        fill={index === 0 ? '#06b6d4' : index === 1 ? '#3b82f6' : '#8b5cf6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No role check-in data available.
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Alert Frequency Line Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Emergency Alert History & Drills Over Time
            </h3>
            <p className="text-[11px] text-slate-400">
              Comparing real emergency broadcasts vs scheduled safety drills
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            {analytics?.alert_history && analytics.alert_history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.alert_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date_label" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                  <Line
                    type="monotone"
                    dataKey="real_alerts"
                    name="Real Emergencies"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f43f5e' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="drill_alerts"
                    name="Safety Drills"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#06b6d4' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No alert history data available for selected filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart 5: Hazard Frequency Matrix Card */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Hazard Frequency Matrix & Severity Distribution
            </h3>
            <p className="text-[11px] text-slate-400">
              Campus risk heatmap breakdown by hazard category and severity level
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {HAZARD_TYPES.map((type) => {
            return (
              <div
                key={type}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5"
              >
                <h4 className="text-xs font-bold text-white border-b border-slate-800 pb-1.5">
                  {type}
                </h4>

                <div className="space-y-1.5">
                  {HAZARD_SEVERITIES.map((severity) => {
                    const match = analytics?.hazard_frequency.find(
                      (h) =>
                        h.type.toLowerCase().includes(type.toLowerCase()) &&
                        h.severity === severity
                    );
                    const count = match ? match.count : 0;

                    let bgClass = 'bg-slate-800/40 text-slate-500 border-slate-800';
                    if (count > 0) {
                      if (severity === 'critical') bgClass = 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold';
                      else if (severity === 'high') bgClass = 'bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold';
                      else if (severity === 'moderate') bgClass = 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold';
                      else bgClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold';
                    }

                    return (
                      <div
                        key={severity}
                        className={`flex items-center justify-between px-2.5 py-1 rounded-lg border text-[10px] ${bgClass}`}
                      >
                        <span className="capitalize">{severity}</span>
                        <span className="font-mono text-xs">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
