import React, { useState } from 'react';
import type { HazardFeature } from '../../api/hazards';
import { resolveHazardApi } from '../../api/hazards';
import { X, CheckCircle2, AlertOctagon, Clock, MapPin } from 'lucide-react';

interface HazardDetailModalProps {
  hazard: HazardFeature | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const HazardDetailModal: React.FC<HazardDetailModalProps> = ({
  hazard,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hazard) return null;

  const handleResolve = async () => {
    try {
      setLoading(true);
      setError(null);
      await resolveHazardApi(hazard.properties.hazard_id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve hazard.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'moderate':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700/80 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white">{hazard.properties.type}</h2>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getSeverityBadgeClass(
                  hazard.properties.severity
                )}`}
              >
                {hazard.properties.severity}
              </span>
            </div>
            <p className="text-xs text-slate-400">Hazard ID: #{hazard.properties.hazard_id}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-3 bg-slate-900/90 border border-slate-800 p-4 rounded-xl mb-5 text-xs text-slate-300">
          {hazard.properties.photo_url && (
            <div>
              <span className="text-slate-500 font-semibold block mb-1">Photo Evidence:</span>
              <div className="rounded-xl overflow-hidden border border-slate-700 max-h-48 bg-slate-950 flex items-center justify-center">
                <img
                  src={`http://localhost:5000${hazard.properties.photo_url}`}
                  alt="Hazard evidence"
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(`http://localhost:5000${hazard.properties.photo_url}`, '_blank')}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <span className="text-slate-500 font-semibold block mb-0.5">Description:</span>
            <p className="text-sm font-medium text-white">{hazard.properties.description}</p>
          </div>

          <div className="flex items-center space-x-4 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Reported: {new Date(hazard.properties.created_at).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>
                [{hazard.geometry.coordinates[0].toFixed(4)}, {hazard.geometry.coordinates[1].toFixed(4)}]
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleResolve}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200"
          >
            {loading ? (
              <span>Resolving...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Resolved</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
