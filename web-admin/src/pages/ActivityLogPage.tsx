import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActivityLogs } from '../api/activitylog';
import type { ActivityLogItem } from '../api/activitylog';
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Users,
  FileText,
  Clock,
  Globe,
  ChevronLeft,
  ChevronRight,
  Code,
} from 'lucide-react';

export const ActivityLogPage: React.FC = () => {
  const { token } = useAuth();

  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const data = await getActivityLogs(token, {
        page,
        limit: 15,
        search: search.trim() || undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
      });

      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error loading activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('all');
    setPage(1);
  };

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'ALERT_BROADCAST':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
          badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          label: 'ALERT BROADCAST',
        };
      case 'ALERT_DEACTIVATED':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-slate-400" />,
          badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
          label: 'ALERT DEACTIVATED',
        };
      case 'HAZARD_PINNED':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          label: 'HAZARD PINNED',
        };
      case 'HAZARD_RESOLVED':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-emerald-400" />,
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          label: 'HAZARD RESOLVED',
        };
      case 'ZONE_CREATED':
        return {
          icon: <MapPin className="w-4 h-4 text-emerald-400" />,
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          label: 'ZONE CREATED',
        };
      case 'ZONE_UPDATED':
        return {
          icon: <MapPin className="w-4 h-4 text-cyan-400" />,
          badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          label: 'ZONE UPDATED',
        };
      case 'ZONE_DELETED':
        return {
          icon: <MapPin className="w-4 h-4 text-rose-400" />,
          badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          label: 'ZONE DELETED',
        };
      case 'USER_ROLE_CHANGED':
        return {
          icon: <Users className="w-4 h-4 text-cyan-400" />,
          badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          label: 'USER ROLE CHANGED',
        };
      case 'USER_DEACTIVATED':
        return {
          icon: <Users className="w-4 h-4 text-rose-400" />,
          badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          label: 'USER DEACTIVATED',
        };
      case 'REPORT_GENERATED':
        return {
          icon: <FileText className="w-4 h-4 text-emerald-400" />,
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          label: 'REPORT GENERATED',
        };
      default:
        return {
          icon: <ScrollText className="w-4 h-4 text-cyan-400" />,
          badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
          label: action,
        };
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-wide">Audit Trail & Compliance Log</h2>
              <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {total} Events
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Immutable activity log recording administrator and coordinator actions for system accountability.
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by user name, email, action, or entity..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Action Type Dropdown */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-cyan-400 shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 w-full md:w-48"
          >
            <option value="all">All Action Types</option>
            <option value="ALERT_BROADCAST">Alert Broadcasts</option>
            <option value="ALERT_DEACTIVATED">Alert Deactivations</option>
            <option value="HAZARD_PINNED">Hazard Pinned</option>
            <option value="HAZARD_RESOLVED">Hazard Resolved</option>
            <option value="ZONE_CREATED">Zone Created</option>
            <option value="ZONE_UPDATED">Zone Updated</option>
            <option value="ZONE_DELETED">Zone Deleted</option>
            <option value="USER_ROLE_CHANGED">User Role Changed</option>
            <option value="USER_DEACTIVATED">User Deactivated</option>
            <option value="REPORT_GENERATED">Report Generated</option>
          </select>
        </div>

        {(search || actionFilter !== 'all') && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-rose-400 hover:underline shrink-0"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Audit Trail Timeline */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs glass-panel rounded-2xl border border-slate-800">
            No activity logs found matching the selected filter criteria.
          </div>
        ) : (
          logs.map((item) => {
            const config = getActionConfig(item.action);
            const isExpanded = expandedLogId === item.log_id;

            return (
              <div
                key={item.log_id}
                className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      {config.icon}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${config.badgeClass}`}>
                          {config.label}
                        </span>
                        {item.entity_type && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.entity_type.toUpperCase()} #{item.entity_id || 'N/A'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-white mt-1">
                        {item.user_full_name || 'System / Anonymous'}{' '}
                        <span className="text-[11px] font-normal text-slate-400">
                          ({item.user_email || 'No email'}) • {item.user_role || 'role N/A'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-[10px] text-slate-400 font-mono self-end sm:self-auto">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </div>

                    {item.ip_address && (
                      <div className="hidden md:flex items-center space-x-1">
                        <Globe className="w-3 h-3 text-slate-500" />
                        <span>{item.ip_address}</span>
                      </div>
                    )}

                    {item.details && (
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : item.log_id)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors flex items-center gap-1 text-[10px]"
                        title="Toggle Details JSON"
                      >
                        <Code className="w-3 h-3 text-cyan-400" />
                        <span>{isExpanded ? 'Hide Payload' : 'View Payload'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded JSON Details Inspector */}
                {isExpanded && item.details && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                    <pre>{JSON.stringify(item.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-slate-400">
            Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
          </p>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
