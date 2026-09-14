import React, { useState, useEffect, useCallback } from 'react';
import type { EvacuationReportRecord } from '../api/reports';
import { getReportApi, generateReportApi } from '../api/reports';
import type { AlertRecord } from '../api/alerts';
import { getActiveAlertsApi } from '../api/alerts';
import type { DashboardCheckinData } from '../api/dashboard';
import { getDashboardCheckinsApi } from '../api/dashboard';
import { exportReportPdf, exportReportCsv, triggerReportPrint } from '../utils/reportExporter';
import {
  FileText,
  PlusCircle,
  Clock,
  RefreshCw,
  FileDown,
  FileSpreadsheet,
  Printer,
  Users,
  ShieldCheck,
  UserX,
  Building2,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeAlerts, setActiveAlerts] = useState<AlertRecord[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [reportsList, setReportsList] = useState<EvacuationReportRecord[]>([]);
  const [detailedReportData, setDetailedReportData] = useState<DashboardCheckinData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlertsAndReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const alertsRes = await getActiveAlertsApi();
      setActiveAlerts(alertsRes.data);

      const targetAlertId =
        selectedAlertId || (alertsRes.data.length > 0 ? alertsRes.data[0].alert_id : 1);
      if (!selectedAlertId && alertsRes.data.length > 0) {
        setSelectedAlertId(alertsRes.data[0].alert_id);
      }

      // Fetch generated report record
      try {
        const reportRes = await getReportApi(targetAlertId);
        if (reportRes.report) {
          setReportsList([reportRes.report]);
        }
      } catch (err) {
        setReportsList([]);
      }

      // Fetch detailed checkin data for exports
      try {
        const detailedRes = await getDashboardCheckinsApi(targetAlertId);
        setDetailedReportData(detailedRes.data);
      } catch (err) {
        setDetailedReportData(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch evacuation reports.');
    } finally {
      setLoading(false);
    }
  }, [selectedAlertId]);

  useEffect(() => {
    fetchAlertsAndReports();
  }, [fetchAlertsAndReports]);

  const handleGenerateReport = async () => {
    if (!selectedAlertId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await generateReportApi(selectedAlertId);
      setReportsList((prev) => [res.report, ...prev]);

      // Refetch detailed checkins
      const detailedRes = await getDashboardCheckinsApi(selectedAlertId);
      setDetailedReportData(detailedRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate evacuation report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (!detailedReportData) return;
    exportReportPdf(detailedReportData);
  };

  const handleExportCsv = () => {
    if (!detailedReportData) return;
    exportReportCsv(detailedReportData);
  };

  const totalUsers = detailedReportData?.total_expected_users || 0;
  const checkedInCount = detailedReportData?.checked_in_count || 0;
  const missingCount = detailedReportData?.missing_count || 0;
  const percent = totalUsers > 0 ? Math.round((checkedInCount / totalUsers) * 100) : 0;

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-[1920px] mx-auto w-full space-y-6">
      {/* Print-Only CSS Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header & Main Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800 no-print">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Campus Evacuation Reports</h2>
          <p className="text-xs text-slate-400 mt-1">
            Polonoling National High School — Post-Evacuation Accountability Documentation & Export Center
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedAlertId || 1}
            onChange={(e) => setSelectedAlertId(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
          >
            {activeAlerts.map((a) => (
              <option key={a.alert_id} value={a.alert_id}>
                {a.is_drill ? '🔵 [DRILL EXERCISE]' : '🚨 [EMERGENCY]'} Alert #{a.alert_id} - {a.title}
              </option>
            ))}
            {activeAlerts.length === 0 && <option value={1}>Alert #1 (Default Campus Alert)</option>}
          </select>

          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/20 transition-all duration-200"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Compile Report</span>
          </button>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Export Action Buttons */}
          <button
            onClick={handleExportPdf}
            disabled={!detailedReportData}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40 transition-all shadow-md"
            title="Export Official PDF Document"
          >
            <FileDown className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!detailedReportData}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 transition-all shadow-md"
            title="Export CSV Dataset"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={triggerReportPrint}
            disabled={!detailedReportData}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition-all shadow-md"
            title="Print Report Document"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-2xl">
          {error}
        </div>
      )}

      {/* Printable Report Wrapper */}
      <div id="printable-report" className="space-y-6">
        {/* KPI Metrics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
              <span>Total Population</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">{totalUsers}</div>
            <p className="text-[11px] text-slate-500">Registered campus personnel</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
              <span>Accounted Safe</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">{checkedInCount}</div>
            <p className="text-[11px] text-slate-500">Confirmed checked-in safe</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
              <span>Unaccounted / Missing</span>
              <UserX className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-extrabold text-rose-400">{missingCount}</div>
            <p className="text-[11px] text-slate-500">Pending safety confirmation</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
              <span>Completion Rate</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-cyan-400">{percent}%</div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden mt-1">
              <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>

        {/* Generated Reports Table */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Generated Evacuation Report Records</h3>
            </div>
            <button
              onClick={fetchAlertsAndReports}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 no-print"
              title="Refresh Reports"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Alert Reference</th>
                  <th className="py-3 px-4">Total Users</th>
                  <th className="py-3 px-4">Checked-In Safe</th>
                  <th className="py-3 px-4">Completion %</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reportsList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No generated evacuation reports found for the selected alert. Click "Compile Report" above.
                    </td>
                  </tr>
                )}

                {reportsList.map((report) => {
                  const reportPercent =
                    report.total_users > 0
                      ? Math.round((report.checked_in_count / report.total_users) * 100)
                      : 0;

                  return (
                    <tr key={report.report_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-cyan-400">#{report.report_id}</td>
                      <td className="py-3 px-4 font-semibold text-white">Alert #{report.alert_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{report.total_users}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{report.checked_in_count}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{reportPercent}%</span>
                          <div className="w-16 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${reportPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(report.generated_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right no-print">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={handleExportPdf}
                            className="p-1.5 bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
                            title="Export PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleExportCsv}
                            className="p-1.5 bg-slate-900 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                            title="Export CSV"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={triggerReportPrint}
                            className="p-1.5 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Print Document"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Check-in Roster Preview */}
        {detailedReportData && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Checked-In Personnel Roster ({detailedReportData.checked_in_users.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time safety check-in log for Alert #{detailedReportData.alert_id}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Personnel Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department / Section</th>
                    <th className="py-3 px-4">Assembly Zone</th>
                    <th className="py-3 px-4">Check-in Time</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {detailedReportData.checked_in_users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No checked-in personnel recorded for this emergency alert.
                      </td>
                    </tr>
                  )}

                  {detailedReportData.checked_in_users.map((u) => {
                    const statusVal = u.status || 'safe';
                    let statusBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                    let IconComponent = CheckCircle;

                    if (statusVal === 'need_help') {
                      statusBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                      IconComponent = HelpCircle;
                    } else if (statusVal === 'injured') {
                      statusBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                      IconComponent = AlertTriangle;
                    }

                    return (
                      <tr key={u.checkin_id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">{u.full_name}</td>
                        <td className="py-3 px-4 capitalize">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          <span className="flex items-center space-x-1">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            <span>{u.department || 'General'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-cyan-400">
                          {u.zone_name || 'Main Oval Assembly'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(u.checked_in_at).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusBadge}`}
                          >
                            <IconComponent className="w-3 h-3" />
                            <span>{statusVal.replace('_', ' ')}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
