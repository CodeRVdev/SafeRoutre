import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createHazardApi } from '../../api/hazards';
import { X, AlertTriangle, MapPin, Upload, Trash2 } from 'lucide-react';

interface AddHazardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialPoint?: [number, number] | null;
}

export const AddHazardModal: React.FC<AddHazardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPoint,
}) => {
  const [type, setType] = useState('Structural Hazard');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'moderate' | 'high' | 'critical'>('high');
  // Default coordinates at Polonoling NHS near Senior High Building
  const [lng, setLng] = useState<number>(124.9504);
  const [lat, setLat] = useState<number>(6.3618);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPoint) {
      setLng(initialPoint[0]);
      setLat(initialPoint[1]);
    }
  }, [initialPoint]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new Error('Coordinates out of range. Longitude must be [-180, 180] and latitude [-90, 90].');
      }

      await createHazardApi({
        type: type.trim(),
        description: description.trim(),
        severity,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        photoFile,
      });

      setDescription('');
      setPhotoFile(null);
      setPhotoPreview(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to pin hazard.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Dark Modal Backdrop (Higher z-index than all MapLibre / map controls) */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in z-[10000]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Pin Campus Hazard Modal (Topmost - higher z-index than backdrop) */}
      <div
        className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700/80 p-6 shadow-2xl relative z-[10001] max-h-[90vh] overflow-y-auto pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Pin Campus Hazard</h2>
            <p className="text-xs text-slate-400">Polonoling National High School Hazard Reporting</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
            {error}
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
              <option value="Flooding">Flooding / Drainage Blockage</option>
              <option value="Blocked Pathway">Blocked Pathway / Obstruction</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Level</label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'moderate', 'high', 'critical'] as const).map((sev) => (
                <button
                  type="button"
                  key={sev}
                  onClick={() => setSeverity(sev)}
                  className={`py-2 rounded-xl text-xs font-bold uppercase border transition-all ${
                    severity === sev
                      ? sev === 'critical'
                        ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30'
                        : sev === 'high'
                        ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/30'
                        : sev === 'moderate'
                        ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/30'
                        : 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Hazard Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Exposed power line sagging near Grade 10 Sampaguita room entrance"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Photo Evidence Drag-and-Drop Dropzone & Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hazard Photo Evidence (Optional)
            </label>
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
                <img src={photoPreview} alt="Hazard preview" className="w-full h-36 object-cover" />
                <button
                  type="button"
                  onClick={() => handleFileChange(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/80 text-white hover:bg-rose-600 transition-colors shadow-md"
                  title="Remove Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-all">
                <div className="flex flex-col items-center justify-center pt-3 pb-3">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <p className="text-xs text-slate-300 font-medium">Click to upload photo evidence</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, or WEBP (Max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude (WGS84)</label>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude (WGS84)</label>
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
              className="flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 transition-all duration-200"
            >
              {loading ? (
                <span>Pinning...</span>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>Pin Hazard</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
