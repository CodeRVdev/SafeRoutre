import React, { useState, useEffect } from 'react';
import type { ZoneFeature } from '../../api/zones';
import { updateZoneApi } from '../../api/zones';
import { X, Edit3, CheckCircle } from 'lucide-react';

interface EditZoneModalProps {
  zone: ZoneFeature | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditZoneModal: React.FC<EditZoneModalProps> = ({
  zone,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'safe_zone' | 'evacuation_point'>('evacuation_point');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (zone) {
      setName(zone.properties.name);
      setType(zone.properties.type);
    }
  }, [zone]);

  if (!isOpen || !zone) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await updateZoneApi(zone.properties.zone_id, {
        name: name.trim(),
        type,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update campus zone.');
    } finally {
      setLoading(false);
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

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Edit Campus Zone</h2>
            <p className="text-xs text-slate-400">Zone ID #{zone.properties.zone_id}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Zone Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Oval Evacuation Area"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Designation Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="evacuation_point">Evacuation Point (Primary Assembly)</option>
              <option value="safe_zone">Safe Zone (Staging Area)</option>
            </select>
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
              className="flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all duration-200"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Update Zone</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
