import React, { useState } from 'react';
import type { ZoneFeatureCollection, ZoneFeature } from '../../api/zones';
import { Layers, Search, X, Focus, Edit3, Move, Trash2 } from 'lucide-react';

interface ZonesSidebarProps {
  zones: ZoneFeatureCollection | null;
  isOpen: boolean;
  onClose: () => void;
  onFocusZone: (zone: ZoneFeature) => void;
  onEditZone: (zone: ZoneFeature) => void;
  onReshapeZone: (zone: ZoneFeature) => void;
  onDeleteZone: (zone: ZoneFeature) => void;
}

export const ZonesSidebar: React.FC<ZonesSidebarProps> = ({
  zones,
  isOpen,
  onClose,
  onFocusZone,
  onEditZone,
  onReshapeZone,
  onDeleteZone,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const features = zones?.features || [];
  const filteredZones = features.filter((z) =>
    z.properties.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="absolute top-0 right-0 bottom-0 z-[450] w-80 sm:w-96 glass-panel border-l border-slate-800 bg-slate-950/95 backdrop-blur-xl flex flex-col shadow-2xl transition-all duration-300 animate-slide-left">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Campus GIS Zones</h3>
            <p className="text-[10px] text-slate-400">
              {features.length} Evacuation & Safe Zones
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search zones by name..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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
      </div>

      {/* Zones List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredZones.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs">
            No campus GIS zones found matching search.
          </div>
        )}

        {filteredZones.map((zone) => {
          const isEvacuation = zone.properties.type === 'evacuation_point';
          const vertexCount =
            zone.geometry?.coordinates && zone.geometry.coordinates[0]
              ? Math.max(0, zone.geometry.coordinates[0].length - 1)
              : 0;

          return (
            <div
              key={zone.properties.zone_id}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 space-y-2.5 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {zone.properties.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        isEvacuation
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {isEvacuation ? 'Evacuation Area' : 'Safe Zone'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {vertexCount} vertices
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onFocusZone(zone)}
                  className="flex items-center justify-center space-x-1 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-cyan-400 text-[10px] font-bold rounded-lg transition-colors"
                  title="Focus on Map"
                >
                  <Focus className="w-3 h-3" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => onEditZone(zone)}
                  className="flex items-center justify-center space-x-1 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg transition-colors"
                  title="Edit Zone Name & Type"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onReshapeZone(zone)}
                  className="flex items-center justify-center space-x-1 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-amber-400 text-[10px] font-bold rounded-lg transition-colors"
                  title="Reshape Vertices on Map"
                >
                  <Move className="w-3 h-3" />
                  <span>Reshape</span>
                </button>
                <button
                  onClick={() => onDeleteZone(zone)}
                  className="flex items-center justify-center space-x-1 py-1.5 bg-slate-800/60 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold rounded-lg transition-colors"
                  title="Delete Zone"
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
