import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { HazardFeature } from '../../api/hazards';
import { updateHazardApi } from '../../api/hazards';
import { X, Edit3, MapPin, Upload, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface EditHazardModalProps {
  hazard: HazardFeature | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditHazardModal: React.FC<EditHazardModalProps> = ({
  hazard,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'moderate' | 'high' | 'critical'>('high');
  const [lng, setLng] = useState<number>(124.9675);
  const [lat, setLat] = useState<number>(6.2882);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hazard) {
      setType(hazard.properties.type);
      setDescription(hazard.properties.description);
      setSeverity(hazard.properties.severity);
      setLng(hazard.geometry.coordinates[0]);
      setLat(hazard.geometry.coordinates[1]);
      setExistingPhotoUrl(hazard.properties.photo_url || null);
      setPhotoFile(null);
      setPhotoPreview(null);
      setError(null);
    }
  }, [hazard]);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo file size must not exceed 5MB.');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen || !hazard) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new Error('Coordinates out of range. Longitude must be [-180, 180] and latitude [-90, 90].');
      }

      await updateHazardApi(hazard.properties.hazard_id, {
        type: type.trim(),
        description: description.trim(),
        severity,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        photoFile,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update hazard.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Dark Modal Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in z-[10000]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Edit Hazard Dialog Container */}
      <div
        className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700/80 p-6 shadow-2xl relative z-[10001] max-h-[90vh] overflow-y-auto pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Edit Active Hazard</h2>
            <p className="text-xs text-slate-400">Hazard ID #{hazard.properties.hazard_id} — Polonoling NHS</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Hazard Category / Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="Structural Hazard">Structural Hazard / Debris</option>
              <option value="Electrical Hazard">Electrical Hazard / Live Wire</option>
              <option value="Fire Hazard">Fire / Smoke Hazard</option>
              <option value="Flooding">Flooding / Water Hazard</option>
              <option value="Pathway Blockage">Fallen Tree / Blocked Pathway</option>
              <option value="Other">Other Campus Danger</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Impact Severity & Avoidance Radius
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'moderate', 'high', 'critical'] as const).map((sev) => {
                const radiusMap = { critical: '30m', high: '25m', moderate: '20m', low: '15m' };
                const isSelected = severity === sev;
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold uppercase transition-all flex flex-col items-center justify-center space-y-0.5 border ${
                      isSelected
                        ? sev === 'critical'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30'
                          : sev === 'high'
                          ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/30'
                          : sev === 'moderate'
                          ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/30'
                          : 'bg-slate-600 text-white border-slate-500'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{sev}</span>
                    <span className="text-[10px] font-normal opacity-80">{radiusMap[sev]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Field Observations</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail specific observations, physical blockage status, or notes..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Longitude</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Latitude</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Photo upload / replace */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Update Evidence Photo (Optional)</label>
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-40 bg-slate-900 flex items-center justify-center">
                <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => handleFileChange(null)}
                  className="absolute top-2 right-2 p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition-colors shadow-lg"
                  title="Remove uploaded photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : existingPhotoUrl ? (
              <div className="space-y-2">
                <div className="rounded-xl overflow-hidden border border-slate-800 max-h-32 bg-slate-900 flex items-center justify-center relative">
                  <img
                    src={existingPhotoUrl.startsWith('http') ? existingPhotoUrl : `${window.location.origin}${existingPhotoUrl}`}
                    alt="Current"
                    className="w-full h-32 object-cover opacity-80"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] text-slate-300 font-medium">
                    Current photo saved
                  </div>
                </div>
                <label className="flex items-center justify-center space-x-2 border border-dashed border-slate-700 rounded-xl p-3 cursor-pointer hover:border-amber-500 bg-slate-900/50 transition-colors">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400 font-medium">Replace with new image</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl p-4 cursor-pointer hover:border-amber-500 bg-slate-900/50 transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs text-slate-300 font-medium">Upload photo evidence</span>
                <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WEBP up to 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/25 transition-all duration-200"
            >
              {loading ? (
                <span>Updating Hazard...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
