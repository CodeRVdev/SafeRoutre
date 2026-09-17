import React, { useState, useEffect, useCallback } from 'react';
import type { ZoneFeatureCollection, ZoneFeature } from '../api/zones';
import { getZonesApi, updateZoneApi, deleteZoneApi } from '../api/zones';
import type { HazardFeatureCollection, HazardFeature } from '../api/hazards';
import { getActiveHazardsApi, deleteHazardApi } from '../api/hazards';
import { CampusMap } from '../components/Map/CampusMap';
import { AddZoneModal } from '../components/Map/AddZoneModal';
import { EditZoneModal } from '../components/Map/EditZoneModal';
import { ZonesSidebar } from '../components/Map/ZonesSidebar';
import { AddHazardModal } from '../components/Map/AddHazardModal';
import { EditHazardModal } from '../components/Map/EditHazardModal';
import { HazardsSidebar } from '../components/Map/HazardsSidebar';
import { HazardDetailModal } from '../components/Map/HazardDetailModal';
import { AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';

export const MapPage: React.FC = () => {
  const [zones, setZones] = useState<ZoneFeatureCollection | null>(null);
  const [hazards, setHazards] = useState<HazardFeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal & Sidebar States for Zones
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [addZoneCoords, setAddZoneCoords] = useState<[number, number][] | undefined>(undefined);
  const [editingZone, setEditingZone] = useState<ZoneFeature | null>(null);
  const [deleteConfirmZone, setDeleteConfirmZone] = useState<ZoneFeature | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal & Sidebar States for Hazards (CRUD)
  const [isAddHazardOpen, setIsAddHazardOpen] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState<HazardFeature | null>(null);
  const [editingHazard, setEditingHazard] = useState<HazardFeature | null>(null);
  const [deleteConfirmHazard, setDeleteConfirmHazard] = useState<HazardFeature | null>(null);
  const [isDeletingHazard, setIsDeletingHazard] = useState(false);
  const [isHazardsSidebarOpen, setIsHazardsSidebarOpen] = useState(false);
  const [clickedPoint, setClickedPoint] = useState<[number, number] | null>(null);

  const fetchMapLayers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [zonesRes, hazardsRes] = await Promise.all([
        getZonesApi(),
        getActiveHazardsApi(),
      ]);
      setZones(zonesRes.data);
      setHazards(hazardsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load GIS map layers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapLayers();
  }, [fetchMapLayers]);

  const handleOpenAddZoneWithCoords = (coordinates: [number, number][]) => {
    setAddZoneCoords(coordinates);
    setIsAddZoneOpen(true);
  };

  const handleSaveReshapedZone = async (
    zoneId: number,
    coordinates: [number, number][]
  ) => {
    await updateZoneApi(zoneId, {
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
    });
    fetchMapLayers();
  };

  const handleConfirmDeleteZone = async () => {
    if (!deleteConfirmZone) return;
    try {
      setIsDeleting(true);
      await deleteZoneApi(deleteConfirmZone.properties.zone_id);
      setDeleteConfirmZone(null);
      fetchMapLayers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete campus zone.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteHazard = async () => {
    if (!deleteConfirmHazard) return;
    try {
      setIsDeletingHazard(true);
      await deleteHazardApi(deleteConfirmHazard.properties.hazard_id);
      setDeleteConfirmHazard(null);
      fetchMapLayers();
    } catch (err: any) {
      setError(err.message || 'Failed to remove active hazard.');
    } finally {
      setIsDeletingHazard(false);
    }
  };

  const handleOpenAddHazardWithPoint = (point?: [number, number]) => {
    if (point) setClickedPoint(point);
    setIsAddHazardOpen(true);
  };

  const totalEvacuationPoints =
    zones?.features.filter((f) => f.properties.type === 'evacuation_point').length || 0;
  const totalSafeZones =
    zones?.features.filter((f) => f.properties.type === 'safe_zone').length || 0;
  const totalActiveHazards = hazards?.features.length || 0;

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-4 max-w-[1920px] mx-auto w-full relative">
      {/* Top Header & GIS Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Polonoling NHS Campus GIS Map</h2>
          <p className="text-xs text-slate-400">
            Barangay Polonoling, Tupi, South Cotabato (Zipcode 9505) — Real-time Spatial Monitoring
          </p>
        </div>

        {/* GIS Metric Pill Stats */}
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-xs text-slate-300 font-medium">
              <strong className="text-white">{totalEvacuationPoints}</strong> Evacuation Areas
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-300 font-medium">
              <strong className="text-white">{totalSafeZones}</strong> Safe Zones
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs text-slate-300 font-medium">
              <strong className="text-rose-400">{totalActiveHazards}</strong> Active Hazards
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center justify-between">
          <span>{error.toLowerCase().includes('token') ? 'Administrative session expired. Please sign in again to synchronize live PostGIS layers.' : error}</span>
          <button
            onClick={() => {
              if (error.toLowerCase().includes('token')) {
                localStorage.removeItem('saferoute_jwt_token');
                localStorage.removeItem('saferoute_user_profile');
                window.location.reload();
              } else {
                fetchMapLayers();
              }
            }}
            className="underline text-xs font-semibold hover:text-white cursor-pointer"
          >
            {error.toLowerCase().includes('token') ? 'Sign In Again' : 'Retry'}
          </button>
        </div>
      )}

      {/* Main Map View Container */}
      <div className="flex-1 relative" style={{ height: 'calc(100vh - 140px)', minHeight: 620 }}>
        <CampusMap
          zones={zones}
          hazards={hazards}
          onSelectHazard={(hazard) => setSelectedHazard(hazard)}
          onOpenAddZoneWithCoords={handleOpenAddZoneWithCoords}
          onOpenEditZone={(zone) => setEditingZone(zone)}
          onDeleteZone={(zone) => setDeleteConfirmZone(zone)}
          onSaveReshapedZone={handleSaveReshapedZone}
          onOpenAddHazard={handleOpenAddHazardWithPoint}
          onRefresh={fetchMapLayers}
          loading={loading}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isHazardsSidebarOpen={isHazardsSidebarOpen}
          onToggleHazardsSidebar={() => setIsHazardsSidebarOpen((prev) => !prev)}
        />

        {/* Collapsible Zones Management Sidebar */}
        <ZonesSidebar
          zones={zones}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onFocusZone={() => {
            setEditingZone(null);
          }}
          onEditZone={(zone) => setEditingZone(zone)}
          onReshapeZone={() => {
            setIsSidebarOpen(false);
          }}
          onDeleteZone={(zone) => setDeleteConfirmZone(zone)}
        />

        {/* Collapsible Hazards Management Sidebar */}
        <HazardsSidebar
          hazards={hazards}
          isOpen={isHazardsSidebarOpen}
          onClose={() => setIsHazardsSidebarOpen(false)}
          onFocusHazard={(hazard) => {
            setSelectedHazard(hazard);
          }}
          onEditHazard={(hazard) => setEditingHazard(hazard)}
          onDeleteHazard={(hazard) => setDeleteConfirmHazard(hazard)}
        />
      </div>

      {/* Modals */}
      <AddZoneModal
        isOpen={isAddZoneOpen}
        onClose={() => {
          setIsAddZoneOpen(false);
          setAddZoneCoords(undefined);
        }}
        onSuccess={fetchMapLayers}
        initialCoordinates={addZoneCoords}
      />

      <EditZoneModal
        zone={editingZone}
        isOpen={!!editingZone}
        onClose={() => setEditingZone(null)}
        onSuccess={fetchMapLayers}
      />

      <AddHazardModal
        isOpen={isAddHazardOpen}
        onClose={() => {
          setIsAddHazardOpen(false);
          setClickedPoint(null);
        }}
        onSuccess={fetchMapLayers}
        initialPoint={clickedPoint}
      />

      <EditHazardModal
        hazard={editingHazard}
        isOpen={!!editingHazard}
        onClose={() => setEditingHazard(null)}
        onSuccess={fetchMapLayers}
      />

      <HazardDetailModal
        hazard={selectedHazard}
        onClose={() => setSelectedHazard(null)}
        onSuccess={fetchMapLayers}
        onEdit={(hazard) => setEditingHazard(hazard)}
        onDelete={(hazard) => setDeleteConfirmHazard(hazard)}
      />

      {/* Zone Delete Confirmation Modal */}
      {deleteConfirmZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2 bg-rose-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Campus Zone</h3>
                <p className="text-xs text-rose-400">Zone ID #{deleteConfirmZone.properties.zone_id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to delete campus zone{' '}
              <strong className="text-white">"{deleteConfirmZone.properties.name}"</strong>? This action will permanently remove it from PostGIS and GIS map layers.
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirmZone(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDeleteZone}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Zone'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hazard Delete Confirmation Modal */}
      {deleteConfirmHazard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2 bg-rose-500/20 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove Active Hazard</h3>
                <p className="text-xs text-rose-400">Hazard ID #{deleteConfirmHazard.properties.hazard_id} — {deleteConfirmHazard.properties.type}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove this active hazard?
            </p>
            <p className="text-[11px] text-slate-400">
              This will remove the obstacle from the campus map and re-open affected evacuation pathways.
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirmHazard(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingHazard}
                onClick={handleConfirmDeleteHazard}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingHazard ? 'Removing...' : 'Remove Hazard'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
