import React, { useState } from 'react';
import { createAlertApi } from '../../api/alerts';
import type { HazardFeatureCollection } from '../../api/hazards';
import { X, Radio, Send } from 'lucide-react';

interface BroadcastAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hazards?: HazardFeatureCollection | null;
}

export const BroadcastAlertModal: React.FC<BroadcastAlertModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  hazards,
}) => {
  const [title, setTitle] = useState('EMERGENCY EVACUATION: Polonoling NHS Main Campus');
  const [message, setMessage] = useState('Please proceed immediately to the Main Oval Evacuation Area due to falling debris.');
  const [hazardId, setHazardId] = useState<number | undefined>(undefined);
  const [isDrill, setIsDrill] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await createAlertApi({
        title: title.trim(),
        message: message.trim(),
        hazard_id: hazardId,
        is_drill: isDrill,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to broadcast emergency alert.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className={`glass-panel w-full max-w-lg rounded-2xl border ${isDrill ? 'border-blue-500/40 glow-blue' : 'border-rose-500/40 glow-red'} p-6 shadow-2xl relative transition-all duration-300`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className={`w-10 h-10 rounded-xl ${isDrill ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-rose-500/20 border-rose-500/30 text-rose-400'} border flex items-center justify-center transition-colors`}>
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {isDrill ? 'Broadcast Campus Evacuation Drill' : 'Broadcast Emergency Alert'}
            </h2>
            <p className={`text-xs font-medium ${isDrill ? 'text-blue-400' : 'text-rose-400'}`}>
              {isDrill ? 'Practice Exercise — Mobile & Web Broadcast' : 'Real-Time Mobile & Web Campus Broadcast'}
            </p>
          </div>
        </div>

        {/* Drill Mode Toggle Switch */}
        <div className="mb-5 p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-white block">This is a DRILL / Practice Exercise</label>
            <p className="text-[11px] text-slate-400">Toggle ON to issue a marked drill without panic sirens</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextDrill = !isDrill;
              setIsDrill(nextDrill);
              if (nextDrill && title.startsWith('EMERGENCY EVACUATION')) {
                setTitle('CAMPUS EVACUATION DRILL: Polonoling NHS Main Campus');
              } else if (!nextDrill && title.startsWith('CAMPUS EVACUATION DRILL')) {
                setTitle('EMERGENCY EVACUATION: Polonoling NHS Main Campus');
              }
            }}
            className={`w-12 h-6 rounded-full transition-colors p-1 relative flex items-center ${isDrill ? 'bg-blue-600' : 'bg-slate-700'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDrill ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Drill Blue Info Banner */}
        {isDrill && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs rounded-xl flex items-center gap-2">
            <span className="text-lg">🔵</span>
            <span>This alert will be clearly marked as a <strong>DRILL</strong> on all mobile devices and web displays.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Alert Headline / Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. EMERGENCY EVACUATION: Polonoling NHS"
              className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${isDrill ? 'focus:border-blue-500' : 'focus:border-rose-500'} transition-colors font-semibold`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Link Active Campus Hazard (Optional)</label>
            <select
              value={hazardId || ''}
              onChange={(e) => setHazardId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none ${isDrill ? 'focus:border-blue-500' : 'focus:border-rose-500'} transition-colors`}
            >
              <option value="">-- No Linked Hazard ({isDrill ? 'General Drill' : 'General Emergency'}) --</option>
              {hazards &&
                hazards.features.map((h) => (
                  <option key={h.properties.hazard_id} value={h.properties.hazard_id}>
                    #{h.properties.hazard_id} - {h.properties.type} ({h.properties.severity.toUpperCase()})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Evacuation Message & Instructions</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Instructions for students, faculty, and staff..."
              className={`w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none ${isDrill ? 'focus:border-blue-500' : 'focus:border-rose-500'} transition-colors`}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-200 ${
                isDrill
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-600/30'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
              }`}
            >
              {loading ? (
                <span>Broadcasting...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isDrill ? 'Broadcast Drill' : 'Broadcast Now'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
