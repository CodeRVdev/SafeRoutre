import React, { useState, useEffect } from 'react';
import type { ScheduledDrill, CreateDrillPayload } from '../api/drills';
import {
  getAllDrillsApi,
  createDrillApi,
  updateDrillApi,
  deleteDrillApi,
  startDrillNowApi,
  completeDrillApi,
  getDrillByIdApi,
} from '../api/drills';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
  CheckCircle,
  Clock,
  Siren,
  X,
  Edit2,
  Trash2,
  BarChart2,
  ShieldCheck,
  UserX,
  Timer,
  CheckCircle2,
} from 'lucide-react';

export const DrillCalendarPage: React.FC = () => {
  const [drills, setDrills] = useState<ScheduledDrill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewingMetricsDrill, setViewingMetricsDrill] = useState<ScheduledDrill | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrill, setEditingDrill] = useState<ScheduledDrill | null>(null);
  const [deletingDrill, setDeletingDrill] = useState<ScheduledDrill | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateDrillPayload>({
    title: '',
    description: '',
    scheduled_date: '',
  });

  const fetchDrills = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllDrillsApi();
      setDrills(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load evacuation drills calendar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrills();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleOpenAddModal = (dateStr?: string) => {
    setEditingDrill(null);
    const defaultDate = dateStr
      ? new Date(`${dateStr}T10:00:00`).toISOString().slice(0, 16)
      : new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16);

    setFormData({
      title: '',
      description: '',
      scheduled_date: defaultDate,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (drill: ScheduledDrill) => {
    setEditingDrill(drill);
    const formattedDate = new Date(drill.scheduled_date).toISOString().slice(0, 16);
    setFormData({
      title: drill.title,
      description: drill.description || '',
      scheduled_date: formattedDate,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.scheduled_date) {
      alert('Title and scheduled date/time are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingDrill) {
        await updateDrillApi(editingDrill.drill_id, formData);
      } else {
        await createDrillApi(formData);
      }
      setIsModalOpen(false);
      fetchDrills();
    } catch (err: any) {
      alert(err.message || 'Failed to save scheduled drill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDrill = async (drill: ScheduledDrill) => {
    if (!confirm(`Are you sure you want to START the practice drill "${drill.title}" now? This will issue a live DRILL alert on all mobile devices and web admin.`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await startDrillNowApi(drill.drill_id);
      alert(res.message || 'Practice drill initiated!');
      fetchDrills();
    } catch (err: any) {
      alert(err.message || 'Failed to start drill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteDrill = async (drill: ScheduledDrill) => {
    try {
      setIsSubmitting(true);
      const res = await completeDrillApi(drill.drill_id);
      alert(res.message || 'Drill completed!');
      setViewingMetricsDrill(res.data);
      fetchDrills();
    } catch (err: any) {
      alert(err.message || 'Failed to complete drill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewMetrics = async (drill: ScheduledDrill) => {
    try {
      const res = await getDrillByIdApi(drill.drill_id);
      setViewingMetricsDrill(res.data);
    } catch (err: any) {
      alert(err.message || 'Failed to load drill metrics.');
    }
  };

  const handleDelete = async () => {
    if (!deletingDrill) return;
    try {
      setIsSubmitting(true);
      await deleteDrillApi(deletingDrill.drill_id);
      setDeletingDrill(null);
      fetchDrills();
    } catch (err: any) {
      alert(err.message || 'Failed to delete drill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calendar Days Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const getDrillsForDate = (dayNum: number) => {
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return drills.filter((d) => {
      const dStr = new Date(d.scheduled_date).toISOString().slice(0, 10);
      return dStr === targetDateStr;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
            <Siren className="w-3 h-3 text-rose-400" /> Live In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-400 border border-slate-700">
            Cancelled
          </span>
        );
      case 'scheduled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Clock className="w-3 h-3 text-cyan-400" /> Scheduled
          </span>
        );
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-[1920px] mx-auto w-full space-y-6">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-wide">Evacuation Drill Calendar</h2>
            <p className="text-xs text-slate-400">
              Schedule, trigger, and review campus practice emergency drills & response analytics
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Evacuation Drill</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-2xl">
          {error}
        </div>
      )}

      {/* Main Grid: Calendar Grid (Left) & Upcoming Drills List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Monthly Grid Calendar */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 shadow-xl">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>{monthNames[month]} {year}</span>
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-cyan-400 hover:text-white transition-all"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((dayNum, index) => {
              if (dayNum === null) {
                return <div key={`empty-${index}`} className="h-24 rounded-xl bg-slate-950/30 border border-transparent" />;
              }

              const dayDrills = getDrillsForDate(dayNum);
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => handleOpenAddModal(dateStr)}
                  className={`h-24 p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:border-cyan-500/50 ${
                    isToday
                      ? 'bg-slate-900 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[10px]'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayDrills.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-14">
                    {dayDrills.map((drill) => (
                      <div
                        key={drill.drill_id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(drill);
                        }}
                        className={`p-1 rounded-md text-[9px] font-bold leading-tight truncate border ${
                          drill.status === 'in_progress'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : drill.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        }`}
                        title={drill.title}
                      >
                        {drill.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Scheduled Drills Cards List */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Drills Agenda ({drills.length})</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Chronological</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading scheduled drills...</div>
          ) : drills.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No evacuation drills scheduled yet.</div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {drills.map((drill) => {
                const dateObj = new Date(drill.scheduled_date);

                return (
                  <div
                    key={drill.drill_id}
                    className={`p-4 rounded-xl border transition-all ${
                      drill.status === 'in_progress'
                        ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-500/10'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-xs font-bold text-white leading-snug">{drill.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          📅 {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                          {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {getStatusBadge(drill.status)}
                    </div>

                    {drill.description && (
                      <p className="text-[11px] text-slate-300 mb-3 line-clamp-2">{drill.description}</p>
                    )}

                    {/* Drill Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="flex items-center space-x-1.5">
                        {drill.status === 'scheduled' && (
                          <button
                            onClick={() => handleStartDrill(drill)}
                            disabled={isSubmitting}
                            className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-md shadow-rose-500/20 transition-all"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Start Drill Now</span>
                          </button>
                        )}

                        {drill.status === 'in_progress' && (
                          <button
                            onClick={() => handleCompleteDrill(drill)}
                            disabled={isSubmitting}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Complete Drill</span>
                          </button>
                        )}

                        {drill.status === 'completed' && (
                          <button
                            onClick={() => handleViewMetrics(drill)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-[10px] flex items-center gap-1 border border-cyan-500/30 transition-all"
                          >
                            <BarChart2 className="w-3 h-3 text-cyan-400" />
                            <span>View Drill Results</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(drill)}
                          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                          title="Edit Drill"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingDrill(drill)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                          title="Delete Drill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Schedule / Edit Drill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-slate-800 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-cyan-400" />
                <span>{editingDrill ? 'Edit Scheduled Drill' : 'Schedule Evacuation Drill'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Drill Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Q3 Campus-Wide Earthquake Evacuation Drill"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Drill Description & Instructions</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details, involved buildings, or evacuation assembly points..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingDrill ? 'Update Drill' : 'Schedule Drill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drill Performance Metrics Modal */}
      {viewingMetricsDrill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel max-w-xl w-full p-6 rounded-2xl border border-cyan-500/40 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{viewingMetricsDrill.title}</h3>
                  <p className="text-xs text-slate-400">Drill Performance & Accountability Analysis</p>
                </div>
              </div>
              <button
                onClick={() => setViewingMetricsDrill(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewingMetricsDrill.metrics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Response Duration</p>
                    <p className="text-xl font-extrabold text-cyan-400 mt-1 flex items-center justify-center gap-1">
                      <Timer className="w-4 h-4" />
                      {viewingMetricsDrill.metrics.duration_minutes}m
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Checked-In Safe</p>
                    <p className="text-xl font-extrabold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      {viewingMetricsDrill.metrics.checked_in_count}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Completion Rate</p>
                    <p className="text-xl font-extrabold text-white mt-1">
                      {viewingMetricsDrill.metrics.completion_rate_percent}%
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Unaccounted</p>
                    <p className="text-xl font-extrabold text-rose-400 mt-1 flex items-center justify-center gap-1">
                      <UserX className="w-4 h-4" />
                      {viewingMetricsDrill.metrics.missing_count}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Evacuation Benchmark Evaluation</span>
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    This practice exercise achieved a{' '}
                    <strong className="text-emerald-400">
                      {viewingMetricsDrill.metrics.completion_rate_percent}% accountability rate
                    </strong>{' '}
                    in {viewingMetricsDrill.metrics.duration_minutes} minutes.
                    {viewingMetricsDrill.metrics.completion_rate_percent >= 85
                      ? ' Excellent overall campus response time exceeding target safety benchmarks!'
                      : ' Recommendation: Conduct targeted safety briefings to improve student check-in speeds.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No check-in metrics available for this drill yet.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingMetricsDrill(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/20"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDrill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel max-w-sm w-full p-6 rounded-2xl border border-rose-500/40 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Delete Scheduled Drill?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to cancel and remove <strong className="text-white">{deletingDrill.title}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingDrill(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
