import React, { useState } from 'react';
import type { HazardFeatureCollection, HazardFeature } from '../../api/hazards';
import { AlertTriangle, Search, X, Focus, Edit3, Trash2, MapPin, Clock, ShieldAlert, Image as ImageIcon } from 'lucide-react';

interface HazardsSidebarProps {
  hazards: HazardFeatureCollection | null;
  isOpen: boolean;
  onClose: () => void;
  onFocusHazard: (hazard: HazardFeature) => void;
  onEditHazard: (hazard: HazardFeature) => void;
  onDeleteHazard: (hazard: HazardFeature) => void;
}

const getHazardRadius = (severity: string): number => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 30;
    case 'high':
      return 25;
    case 'moderate':
      return 20;
    case 'low':
      return 15;
    default:
      return 20;
  }
};

const getSeverityBadgeClass = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    case 'moderate':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    case 'low':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
  }
};

export const HazardsSidebar: React.FC<HazardsSidebarProps> = ({
  hazards,
  isOpen,
  onClose,
  onFocusHazard,
  onEditHazard,
  onDeleteHazard,
}) => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  if (!isOpen) return null;

  const features = hazards?.features || [];
  const filteredHazards = features.filter((h) => {
    const matchesSearch =
      h.properties.type.toLowerCase().includes(search.toLowerCase().trim()) ||
      h.properties.description.toLowerCase().includes(search.toLowerCase().trim());
    const matchesSeverity =
      severityFilter === 'all' || h.properties.severity.toLowerCase() === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="absolute top-0 right-0 bottom-0 z-[450] w-84 sm:w-96 glass-panel border-l border-slate-800 bg-slate-950/95 backdrop-blur-xl flex flex-col shadow-2xl transition-all duration-300 animate-slide-left">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Active Hazards</h3>
            <p className="text-[10px] text-slate-400">
              {features.length} Real-time Campus Obstacles
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Close Sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Severity Filter Bar */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hazards by type or notes..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center space-x-1 text-[10px] overflow-x-auto pb-1">
          {['all', 'critical', 'high', 'moderate', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-0.5 rounded-lg font-semibold uppercase tracking-wider transition-colors ${
                severityFilter === sev
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Hazards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredHazards.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-600" />
            <span>No active campus hazards matching criteria.</span>
          </div>
        )}

        {filteredHazards.map((hazard) => {
          const radius = getHazardRadius(hazard.properties.severity);
          const [lng, lat] = hazard.geometry.coordinates;

          return (
            <div
              key={hazard.properties.hazard_id}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 space-y-2.5 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-white truncate">
                      {hazard.properties.type}
                    </h4>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                    {hazard.properties.description}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border whitespace-nowrap ${getSeverityBadgeClass(
                    hazard.properties.severity
                  )}`}
                >
                  {hazard.properties.severity}
                </span>
              </div>

              {/* Buffer Radius & Coordinates Meta */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <div className="flex items-center space-x-1 text-rose-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>{radius}m Hazard Buffer</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-500">
                  <MapPin className="w-3 h-3" />
                  <span>{lng.toFixed(4)}, {lat.toFixed(4)}</span>
                </div>
              </div>

              {/* Timestamp & Photo indicator */}
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>
                    {new Date(hazard.properties.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {hazard.properties.photo_url && (
                  <div className="flex items-center space-x-1 text-cyan-400 text-[10px]">
                    <ImageIcon className="w-3 h-3" />
                    <span>Photo Attached</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => onFocusHazard(hazard)}
                  className="flex items-center justify-center space-x-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold transition-colors"
                  title="Center map on hazard"
                >
                  <Focus className="w-3 h-3 text-cyan-400" />
                  <span>Focus</span>
                </button>

                <button
                  onClick={() => onEditHazard(hazard)}
                  className="flex items-center justify-center space-x-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold transition-colors"
                  title="Edit hazard properties"
                >
                  <Edit3 className="w-3 h-3 text-amber-400" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => onDeleteHazard(hazard)}
                  className="flex items-center justify-center space-x-1 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-semibold border border-rose-500/20 transition-colors"
                  title="Remove hazard"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
