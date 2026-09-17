// CampusMap — Primary GIS evacuation map for Polonuling NHS
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Map, { Source, Layer, Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';

import type { ZoneFeatureCollection, ZoneFeature } from '../../api/zones';
import type { HazardFeature, HazardFeatureCollection } from '../../api/hazards';
import { getSocket } from '../../socket/socketClient';
import {
  CAMPUS_NODES,
  findEvacuationRoute,
  findNearestNodeToGps,
  blockHazardZone,
  clearAllBlocks,
  type RouteResult,
} from './campusGraph';
import { fetchSafeRouteApi } from '../../api/routing';
import {
  RefreshCw, PlusCircle, Navigation, XCircle, MapPin, Layers, AlertTriangle,
  Info, ZoomIn, ZoomOut, Maximize, PanelLeftClose, PanelLeftOpen, CheckCircle,
  Compass, ShieldCheck, DoorOpen, Building2, Locate
} from 'lucide-react';

import {
  campusBoundaryData,
  schoolGroundData,
  buildingsData,
  gatesData,
  pathwaysData,
} from './data/campusGeoData';

// ── ROBUST HIGH-RESOLUTION BASEMAP STYLES ─────────────────────────
const MAP_STYLES: Record<string, any> = {
  satellite: {
    version: 8,
    sources: {
      'google-hybrid': {
        type: 'raster',
        tiles: [
          'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        ],
        tileSize: 256,
        maxzoom: 22,
        attribution: '© Google Maps Satellite Imagery',
      },
    },
    layers: [
      {
        id: 'google-hybrid-layer',
        type: 'raster',
        source: 'google-hybrid',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  },
  dark: {
    version: 8,
    sources: {
      'carto-dark': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution: '© CARTO, © OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'carto-dark-layer',
        type: 'raster',
        source: 'carto-dark',
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  },
  streets: {
    version: 8,
    sources: {
      'carto-voyager': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution: '© CARTO, © OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'carto-voyager-layer',
        type: 'raster',
        source: 'carto-voyager',
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  },
};

// Exact Authoritative Center on Polonuling National High School (Tupi, South Cotabato)
const CAMPUS_CENTER = { lat: 6.2882333, lng: 124.9675614 };

interface CampusMapProps {
  zones: ZoneFeatureCollection | null;
  hazards: HazardFeatureCollection | null;
  onSelectHazard: (hazard: HazardFeature) => void;
  onOpenAddZoneWithCoords: (coordinates: [number, number][]) => void;
  onOpenEditZone: (zone: ZoneFeature) => void;
  onDeleteZone: (zone: ZoneFeature) => void;
  onSaveReshapedZone: (zoneId: number, coordinates: [number, number][]) => Promise<void>;
  onOpenAddHazard: (point?: [number, number]) => void;
  onRefresh: () => void;
  loading: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isHazardsSidebarOpen?: boolean;
  onToggleHazardsSidebar?: () => void;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  hazards,
  onSelectHazard,
  onOpenAddHazard,
  onRefresh,
  loading,
  isSidebarOpen,
  onToggleSidebar,
  isHazardsSidebarOpen = false,
  onToggleHazardsSidebar,
}) => {
  const mapRef = useRef<any>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(18);
  const [selectedLocation, setSelectedLocation] = useState<string>('bcd_building');
  const [selectedDestination, setSelectedDestination] = useState<string>('oval');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPinMode, setIsPinMode] = useState(false);
  const [showHazards, setShowHazards] = useState(true);
  const [showPathways, setShowPathways] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [show3D, setShow3D] = useState(true);
  const [activeBaseMap, setActiveBaseMap] = useState<'satellite' | 'dark' | 'streets'>('satellite');
  const [hoveredFeature, setHoveredFeature] = useState<any | null>(null);
  const [selectedHazardInfo, setSelectedHazardInfo] = useState<HazardFeature | null>(null);
  const [rtHazards, setRtHazards] = useState<HazardFeature[]>([]);
  const [infoPanelOpen, setInfoPanelOpen] = useState(true);

  // ── LIVE GPS TRACKING & ROUTING STATE ──
  const [userGpsCoord, setUserGpsCoord] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isGpsMode, setIsGpsMode] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'active' | 'denied' | 'error'>('idle');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Recalculate dynamic hazard blocks
  const recomputeHazardBlocks = useCallback((hazardsList: HazardFeature[]) => {
    clearAllBlocks();
    for (const h of hazardsList) {
      if (h.properties.status !== 'resolved') {
        const radius = h.properties.severity === 'critical' ? 30 : 20;
        blockHazardZone(h.geometry.coordinates[1], h.geometry.coordinates[0], radius);
      }
    }
  }, []);

  // Request high-accuracy Live GPS position
  const handleRequestGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGpsStatus('locating');
    setGpsErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserGpsCoord({ lat: latitude, lng: longitude, accuracy });
        setGpsStatus('active');
        setIsGpsMode(true);
        const nearest = findNearestNodeToGps(latitude, longitude);
        setSelectedLocation(nearest.id);
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 19,
          duration: 1000,
        });
        if (isNavigating) {
          setRoute(findEvacuationRoute(nearest.id, selectedDestination));
        }
      },
      (err) => {
        setGpsStatus('denied');
        setGpsErrorMsg(err.message || 'GPS location permission was denied.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [isNavigating, selectedDestination]);

  // Background geolocation watch
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserGpsCoord({ lat: latitude, lng: longitude, accuracy });
        setGpsStatus('active');
      },
      (err) => {
        console.warn('Background geolocation notice:', err.message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Auto-recalculate route if user moves significantly in GPS mode while navigating
  useEffect(() => {
    if (isNavigating && isGpsMode && userGpsCoord) {
      const nearest = findNearestNodeToGps(userGpsCoord.lat, userGpsCoord.lng);
      if (nearest.id !== selectedLocation) {
        setSelectedLocation(nearest.id);
        setRoute(findEvacuationRoute(nearest.id, selectedDestination));
      }
    }
  }, [userGpsCoord, isNavigating, isGpsMode, selectedLocation, selectedDestination]);

  // Sync hazards
  useEffect(() => {
    if (hazards?.features) {
      setRtHazards(hazards.features);
      recomputeHazardBlocks(hazards.features);
    }
  }, [hazards, recomputeHazardBlocks]);

  // Real-time authoritative route calculation via backend API (with local fallback)
  const calculateEvacuationRoute = useCallback(
    async (startNodeId: string, destId: string): Promise<RouteResult> => {
      try {
        const startNode = CAMPUS_NODES.find((n) => n.id === startNodeId) || {
          lat: 6.2882333,
          lng: 124.9675614,
        };

        const apiResult = await fetchSafeRouteApi({
          fromLat: isGpsMode && userGpsCoord ? userGpsCoord.lat : startNode.lat,
          fromLng: isGpsMode && userGpsCoord ? userGpsCoord.lng : startNode.lng,
          startNodeId: isGpsMode ? undefined : startNodeId,
          destinationId: destId,
        });

        if (apiResult.success && apiResult.route) {
          const r = apiResult.route;
          const convertedResult: RouteResult = {
            path: r.pathNodes.map((n) => ({
              id: n.id,
              name: n.name,
              lat: n.lat,
              lng: n.lng,
              type: n.type as any,
            })),
            totalDistance: r.distanceMeters,
            estimatedSeconds: r.estimatedSeconds,
            found: true,
            hazardsAvoidedCount: r.hazardsAvoidedCount,
            isHazardRerouted: r.isHazardRerouted,
          };
          setRoute(convertedResult);
          return convertedResult;
        }
      } catch (err) {
        console.warn('Backend routing API request failed, using local graph fallback:', err);
      }

      // Local graph fallback if backend is momentarily unreachable
      const fallbackResult = findEvacuationRoute(startNodeId, destId);
      setRoute(fallbackResult);
      return fallbackResult;
    },
    [userGpsCoord, isGpsMode]
  );

  // Socket for real-time hazard updates & dynamic rerouting
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onHazardNew = (data: HazardFeature) => {
      setRtHazards((prev) => {
        const next = prev.find((h) => h.properties.hazard_id === data.properties.hazard_id)
          ? prev
          : [...prev, data];
        recomputeHazardBlocks(next);
        if (isNavigating) {
          const startId = isGpsMode && userGpsCoord ? findNearestNodeToGps(userGpsCoord.lat, userGpsCoord.lng).id : selectedLocation;
          calculateEvacuationRoute(startId, selectedDestination);
        }
        return next;
      });
    };

    const onHazardUpdated = (data: HazardFeature) => {
      setRtHazards((prev) => {
        const hazardId = data.properties?.hazard_id || (data as any).id;
        const next = prev.map((h) =>
          h.properties.hazard_id === hazardId ? data : h
        );
        recomputeHazardBlocks(next);
        if (isNavigating) {
          const startId = isGpsMode && userGpsCoord ? findNearestNodeToGps(userGpsCoord.lat, userGpsCoord.lng).id : selectedLocation;
          calculateEvacuationRoute(startId, selectedDestination);
        }
        return next;
      });
    };

    const onHazardResolved = (data: any) => {
      const hazardId = data.hazard_id || data.properties?.hazard_id || data.id;
      setRtHazards((prev) => {
        const next = prev.filter((h) => h.properties.hazard_id !== hazardId);
        recomputeHazardBlocks(next);
        if (isNavigating) {
          const startId = isGpsMode && userGpsCoord ? findNearestNodeToGps(userGpsCoord.lat, userGpsCoord.lng).id : selectedLocation;
          calculateEvacuationRoute(startId, selectedDestination);
        }
        return next;
      });
    };

    socket.on('hazard:new', onHazardNew);
    socket.on('hazard:updated', onHazardUpdated);
    socket.on('hazard:resolved', onHazardResolved);

    return () => {
      socket.off('hazard:new', onHazardNew);
      socket.off('hazard:updated', onHazardUpdated);
      socket.off('hazard:resolved', onHazardResolved);
    };
  }, [isNavigating, isGpsMode, userGpsCoord, selectedLocation, selectedDestination, recomputeHazardBlocks, calculateEvacuationRoute]);

  // Navigation handlers
  const handleStartNavigation = useCallback(async () => {
    let startNodeId = selectedLocation;
    if (isGpsMode && userGpsCoord) {
      const nearest = findNearestNodeToGps(userGpsCoord.lat, userGpsCoord.lng);
      startNodeId = nearest.id;
      setSelectedLocation(nearest.id);
    }
    const result = await calculateEvacuationRoute(startNodeId, selectedDestination);
    setIsNavigating(true);
    if (result.found && mapRef.current) {
      const coords = result.path.map((n) => [n.lng, n.lat]);
      if (isGpsMode && userGpsCoord) {
        coords.unshift([userGpsCoord.lng, userGpsCoord.lat]);
      }
      const line = turf.lineString(coords);
      const bbox = turf.bbox(line) as [number, number, number, number];
      mapRef.current.fitBounds(bbox, { padding: 90, duration: 1200, pitch: show3D ? 55 : 0 });
    }
  }, [selectedLocation, selectedDestination, isGpsMode, userGpsCoord, show3D, calculateEvacuationRoute]);

  const handleClearNavigation = useCallback(() => {
    setRoute(null);
    setIsNavigating(false);
  }, []);

  const handleResetView = () => {
    mapRef.current?.flyTo({
      center: [CAMPUS_CENTER.lng, CAMPUS_CENTER.lat],
      zoom: 18,
      pitch: show3D ? 55 : 0,
      bearing: show3D ? -15 : 0,
      duration: 1200,
    });
  };

  const handleToggle3D = () => {
    const next = !show3D;
    setShow3D(next);
    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: next ? 55 : 0,
        bearing: next ? -15 : 0,
        duration: 800,
      });
    }
  };

  const handleMapClick = (e: any) => {
    if (isPinMode) {
      setIsPinMode(false);
      onOpenAddHazard([e.lngLat.lng, e.lngLat.lat]);
    }
  };

  // Selected Origin Node lookup
  const selectedNode = useMemo(() => {
    return CAMPUS_NODES.find((n) => n.id === selectedLocation);
  }, [selectedLocation]);

  // Convert route into LineString FeatureCollection GeoJSON
  const routeGeoJSON = useMemo(() => {
    if (!route || !route.found || route.path.length < 2) return null;
    const coords = route.path.map((n) => [n.lng, n.lat]);
    if (isGpsMode && userGpsCoord) {
      coords.unshift([userGpsCoord.lng, userGpsCoord.lat]);
    }
    const line = turf.lineString(coords, { name: 'Active Evacuation Route' });
    return turf.featureCollection([line]);
  }, [route, isGpsMode, userGpsCoord]);

  // GPS Uncertainty / Accuracy Area Circle GeoJSON
  const gpsAccuracyCircleGeoJSON = useMemo(() => {
    if (!userGpsCoord || !userGpsCoord.accuracy || userGpsCoord.accuracy < 10) return null;
    const pt = turf.point([userGpsCoord.lng, userGpsCoord.lat]);
    return turf.buffer(pt, userGpsCoord.accuracy, { units: 'meters' });
  }, [userGpsCoord]);

  // Connector between raw GPS and snapped pathway junction
  const gpsConnectorGeoJSON = useMemo(() => {
    if (!isGpsMode || !userGpsCoord || !selectedNode) return null;
    return turf.lineString([
      [userGpsCoord.lng, userGpsCoord.lat],
      [selectedNode.lng, selectedNode.lat],
    ]);
  }, [isGpsMode, userGpsCoord, selectedNode]);

  // Standardized Hazard Radius Definition
  const getHazardRadius = (severity?: string): number => {
    const s = (severity || '').toLowerCase();
    if (s === 'critical') return 30;
    if (s === 'high') return 25;
    if (s === 'moderate') return 20;
    if (s === 'low') return 15;
    return 20;
  };

  // Hazard Danger Buffer Circles GeoJSON
  const hazardBuffersGeoJSON = useMemo(() => {
    if (!showHazards || rtHazards.length === 0) return null;
    const features = rtHazards
      .map((h) => {
        const point = turf.point(h.geometry.coordinates);
        const radius = getHazardRadius(h.properties.severity);
        const buffer = turf.buffer(point, radius, { units: 'meters' });
        if (buffer) {
          buffer.properties = { ...h.properties, radius };
        }
        return buffer;
      })
      .filter((f): f is Feature<Polygon | MultiPolygon> => f != null);
    return turf.featureCollection(features);
  }, [showHazards, rtHazards]);

  const formatTime = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  const buildingNodes = CAMPUS_NODES.filter((n) => n.type === 'building');

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex bg-slate-950 font-sans">
      {/* ══════════════ MAP CANVAS ══════════════ */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        {/* Pin Hazard Mode Warning Banner */}
        {isPinMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[450] bg-amber-950/95 border border-amber-500 text-amber-200 px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-4 animate-bounce">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold">HAZARD PIN MODE: Click on the campus map to place hazard</span>
            <button
              onClick={() => setIsPinMode(false)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── Top Header Controls ── */}
        <div className="absolute top-3 right-3 z-[400] flex flex-col items-end space-y-2">
          {/* Main Action Bar */}
          <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-2 rounded-2xl shadow-xl">
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-xl transition-all ${
                isSidebarOpen
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800'
              }`}
              title="Toggle Zones Roster"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition-all"
              title="Refresh Real-time Map Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            {onToggleHazardsSidebar && (
              <button
                onClick={onToggleHazardsSidebar}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isHazardsSidebarOpen
                    ? 'bg-rose-500/30 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-500/20'
                    : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20'
                }`}
                title="Toggle Active Hazards List"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Hazards ({rtHazards.length})</span>
              </button>
            )}
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <button
              onClick={() => setIsPinMode((v) => !v)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isPinMode
                  ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/30'
                  : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30'
              }`}
              title="Pin a hazard on the campus map"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isPinMode ? 'Click Map...' : 'Pin Hazard'}</span>
            </button>
            <button
              onClick={() => setInfoPanelOpen((v) => !v)}
              className={`p-2 rounded-xl transition-all ${
                infoPanelOpen
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Toggle Evacuation Guide Panel"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* Layer & Basemap Switcher */}
          <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-2xl shadow-xl relative">
            {/* MAP STYLE */}
            <div className="flex items-center space-x-1 border-r border-slate-700 pr-2">
              <button
                onClick={() => setActiveBaseMap('satellite')}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                  activeBaseMap === 'satellite'
                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-md'
                    : 'text-slate-400 border-transparent hover:bg-slate-800'
                }`}
              >
                🛰️ Satellite
              </button>
              <button
                onClick={() => setActiveBaseMap('dark')}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                  activeBaseMap === 'dark'
                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-md'
                    : 'text-slate-400 border-transparent hover:bg-slate-800'
                }`}
              >
                🌙 Dark
              </button>
              <button
                onClick={() => setActiveBaseMap('streets')}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                  activeBaseMap === 'streets'
                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-md'
                    : 'text-slate-400 border-transparent hover:bg-slate-800'
                }`}
              >
                🗺️ Streets
              </button>
            </div>

            {/* LAYERS MENU DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setShowLayerMenu((v) => !v)}
                className="flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Map Layers</span>
                <span className="w-4 h-4 rounded-full bg-cyan-500/30 text-cyan-300 text-[9px] flex items-center justify-center font-black">
                  {[showHazards, showPathways, showLabels].filter(Boolean).length}
                </span>
              </button>

              {showLayerMenu && (
                <div className="absolute top-full mt-2 left-0 w-44 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-xl p-2 shadow-2xl z-[600] space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-1 pb-1 border-b border-slate-800">
                    GIS Layers
                  </p>
                  <label className="flex items-center justify-between px-2 py-1 hover:bg-slate-800/60 rounded cursor-pointer text-[11px] text-slate-300">
                    <span>⚠️ Hazards</span>
                    <input
                      type="checkbox"
                      checked={showHazards}
                      onChange={(e) => setShowHazards(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </label>
                  <label className="flex items-center justify-between px-2 py-1 hover:bg-slate-800/60 rounded cursor-pointer text-[11px] text-slate-300">
                    <span>🚶 Pathways</span>
                    <input
                      type="checkbox"
                      checked={showPathways}
                      onChange={(e) => setShowPathways(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </label>
                  <label className="flex items-center justify-between px-2 py-1 hover:bg-slate-800/60 rounded cursor-pointer text-[11px] text-slate-300">
                    <span>🏷️ Labels</span>
                    <input
                      type="checkbox"
                      checked={showLabels}
                      onChange={(e) => setShowLabels(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* 3D MODE BUTTON */}
            <button
              onClick={handleToggle3D}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                show3D
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/30'
                  : 'text-slate-400 border-slate-700 hover:bg-slate-800'
              }`}
            >
              🏢 3D Mode
            </button>
          </div>

          {/* Navigation Zoom / Pitch Tools */}
          <div className="flex items-center space-x-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-xl">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-all"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-all"
              title="Reset Campus View"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Official Blueprint Map Legend ── */}
        <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3.5 rounded-2xl shadow-xl text-xs space-y-2 pointer-events-none max-w-[240px]">
          <p className="text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center space-x-1.5 border-b border-slate-800 pb-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Polonuling NHS Blueprint</span>
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-white shadow" />
            <span className="text-slate-200">Your Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]" />
            <span className="text-emerald-300 font-bold">Evacuation Escape Route</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded bg-emerald-600/80 border border-emerald-400" />
            <span className="text-slate-200">School Ground (Assembly Area)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded bg-red-700/90 border border-red-400" />
            <span className="text-slate-200">Classroom Buildings (SHS/JHS)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded bg-sky-600/90 border border-sky-400" />
            <span className="text-slate-200">School GYM / Stages</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white" />
            <span className="text-amber-300 font-medium">School Gates (In / Out)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white animate-pulse" />
            <span className="text-rose-300 font-medium">Hazard Alert Danger Zone</span>
          </div>
        </div>

        {/* ══════════════ MAPLIBRE GIS MAP INSTANCE ══════════════ */}
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={{
            longitude: CAMPUS_CENTER.lng,
            latitude: CAMPUS_CENTER.lat,
            zoom: 17.5,
            pitch: show3D ? 45 : 0,
            bearing: 0,
          }}
          onZoom={(e) => setCurrentZoom(e.viewState.zoom)}
          mapStyle={MAP_STYLES[activeBaseMap]}
          onClick={handleMapClick}
          interactiveLayerIds={['buildings-fill', 'school-ground-fill', 'assembly-oval-fill']}
          onMouseMove={(e) => {
            const feature = e.features?.[0];
            if (feature) {
              setHoveredFeature(feature);
            } else {
              setHoveredFeature(null);
            }
          }}
          cursor={isPinMode ? 'crosshair' : 'grab'}
        >
          <GeolocateControl
            position="bottom-right"
            trackUserLocation={true}
            showAccuracyCircle={true}
            onGeolocate={(e: any) => {
              if (e.coords) {
                const { latitude, longitude, accuracy } = e.coords;
                setUserGpsCoord({ lat: latitude, lng: longitude, accuracy });
                setIsGpsMode(true);
                setGpsStatus('active');
                const nearest = findNearestNodeToGps(latitude, longitude);
                setSelectedLocation(nearest.id);
                if (isNavigating) {
                  setRoute(findEvacuationRoute(nearest.id));
                }
              }
            }}
          />
          <NavigationControl position="bottom-right" />

          {/* ── 1. CAMPUS BOUNDARY & PROPERTY PERIMETER ── */}
          <Source id="campus-boundary" type="geojson" data={campusBoundaryData}>
            <Layer
              id="campus-perimeter-fill"
              type="fill"
              filter={['in', ['get', 'type'], ['literal', ['campus_boundary', 'boundary']]]}
              paint={{
                'fill-color': '#0f172a',
                'fill-opacity': activeBaseMap === 'satellite' ? 0.15 : 0.4,
              }}
            />
            <Layer
              id="campus-perimeter-line"
              type="line"
              filter={['in', ['get', 'type'], ['literal', ['campus_boundary', 'boundary']]]}
              paint={{
                'line-color': '#f8fafc',
                'line-width': 2.5,
                'line-dasharray': [4, 2],
                'line-opacity': 0.8,
              }}
            />
            {/* Perimeter Roads */}
            <Layer
              id="campus-roads-casing"
              type="line"
              filter={['==', ['get', 'type'], 'road']}
              paint={{
                'line-color': '#1e293b',
                'line-width': 14,
              }}
            />
            <Layer
              id="campus-roads-center"
              type="line"
              filter={['==', ['get', 'type'], 'road']}
              paint={{
                'line-color': '#e2e8f0',
                'line-width': 2,
                'line-dasharray': [3, 3],
              }}
            />
          </Source>

          {/* ── 2. CENTRAL SCHOOL GROUND & EVACUATION ASSEMBLY OVAL ── */}
          <Source id="school-ground" type="geojson" data={schoolGroundData}>
            {/* Green Lawn Area */}
            <Layer
              id="school-ground-fill"
              type="fill"
              filter={['in', ['get', 'type'], ['literal', ['school_ground', 'ground']]]}
              paint={{
                'fill-color': '#15803d',
                'fill-opacity': activeBaseMap === 'satellite' ? 0.45 : 0.8,
              }}
            />
            <Layer
              id="school-ground-outline"
              type="line"
              filter={['in', ['get', 'type'], ['literal', ['school_ground', 'ground']]]}
              paint={{
                'line-color': '#22c55e',
                'line-width': 3,
                'line-opacity': 0.9,
              }}
            />
            {/* Assembly Oval Safe Zone */}
            <Layer
              id="assembly-oval-fill"
              type="fill"
              filter={['==', ['get', 'type'], 'assembly_area']}
              paint={{
                'fill-color': '#10b981',
                'fill-opacity': 0.5,
              }}
            />
            <Layer
              id="assembly-oval-outline"
              type="line"
              filter={['==', ['get', 'type'], 'assembly_area']}
              paint={{
                'line-color': '#ffffff',
                'line-width': 3,
                'line-dasharray': [2, 2],
              }}
            />
          </Source>

          {/* ── 3. WALKABLE PATHWAYS NETWORK (DARK GREY CORRIDORS) ── */}
          {showPathways && (
            <Source id="pathways" type="geojson" data={pathwaysData}>
              {/* Wide asphalt walkway casing */}
              <Layer
                id="pathways-casing"
                type="line"
                paint={{
                  'line-color': '#1e293b',
                  'line-width': 9,
                  'line-opacity': 0.95,
                }}
              />
              {/* Walkway surface */}
              <Layer
                id="pathways-surface"
                type="line"
                paint={{
                  'line-color': '#334155',
                  'line-width': 6,
                  'line-opacity': 1,
                }}
              />
              {/* Center guidance escape dash line */}
              <Layer
                id="pathways-center-dash"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': '#facc15',
                  'line-width': 1.5,
                  'line-dasharray': [2, 2],
                  'line-opacity': 0.9,
                }}
              />
            </Source>
          )}

          {/* ── 4. VECTOR BUILDINGS (POLYGON FOOTPRINTS + 3D EXTRUSION) ── */}
          <Source id="buildings" type="geojson" data={buildingsData}>
            {/* 3D Extrusion Layer */}
            {show3D && (
              <Layer
                id="buildings-extrusion"
                type="fill-extrusion"
                paint={{
                  'fill-extrusion-color': ['get', 'roofColor'],
                  'fill-extrusion-height': ['get', 'height'],
                  'fill-extrusion-base': 0,
                  'fill-extrusion-opacity': 0.95,
                }}
              />
            )}
            {/* 2D Crisp Polygon Fill */}
            <Layer
              id="buildings-fill"
              type="fill"
              paint={{
                'fill-color': ['get', 'color'],
                'fill-opacity': show3D ? 0.35 : 0.9,
              }}
            />
            {/* Building Roof Ridge Outline */}
            <Layer
              id="buildings-outline"
              type="line"
              paint={{
                'line-color': ['get', 'strokeColor'],
                'line-width': 2.5,
                'line-opacity': 1,
              }}
            />
          </Source>

          {/* ── 5. HAZARD DANGER ZONES (SPATIAL BUFFER CIRCLES) ── */}
          {hazardBuffersGeoJSON && (
            <Source id="hazard-buffers" type="geojson" data={hazardBuffersGeoJSON}>
              <Layer
                id="hazard-buffers-fill"
                type="fill"
                paint={{
                  'fill-color': '#ef4444',
                  'fill-opacity': 0.35,
                }}
              />
              <Layer
                id="hazard-buffers-line"
                type="line"
                paint={{
                  'line-color': '#f87171',
                  'line-width': 2,
                  'line-dasharray': [3, 2],
                }}
              />
            </Source>
          )}

          {/* GPS Uncertainty / Accuracy Area Circle */}
          {gpsAccuracyCircleGeoJSON && (
            <Source id="gps-accuracy-circle" type="geojson" data={gpsAccuracyCircleGeoJSON}>
              <Layer
                id="gps-accuracy-fill"
                type="fill"
                paint={{
                  'fill-color': '#3b82f6',
                  'fill-opacity': 0.18,
                }}
              />
              <Layer
                id="gps-accuracy-stroke"
                type="line"
                paint={{
                  'line-color': '#60a5fa',
                  'line-width': 1.5,
                  'line-dasharray': [3, 2],
                  'line-opacity': 0.7,
                }}
              />
            </Source>
          )}

          {/* Dashed connector line between raw GPS and snapped pathway junction */}
          {gpsConnectorGeoJSON && (
            <Source id="gps-connector" type="geojson" data={gpsConnectorGeoJSON}>
              <Layer
                id="gps-connector-line"
                type="line"
                paint={{
                  'line-color': '#38bdf8',
                  'line-width': 2.5,
                  'line-dasharray': [2, 2],
                  'line-opacity': 0.9,
                }}
              />
            </Source>
          )}

          {/* ── 6. DYNAMIC EVACUATION ESCAPE ROUTE ── */}
          {isNavigating && routeGeoJSON && (
            <Source id="route" type="geojson" data={routeGeoJSON}>
              {/* Ultra-bold high-contrast black casing */}
              <Layer
                id="route-casing"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': '#000000',
                  'line-width': 14,
                  'line-opacity': 0.95,
                }}
              />
              {/* Electric cyan neon aura glow */}
              <Layer
                id="route-glow"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': '#00ffff',
                  'line-width': 10,
                  'line-opacity': 0.85,
                }}
              />
              {/* Solid core escape route */}
              <Layer
                id="route-line"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': '#06b6d4',
                  'line-width': 5,
                }}
              />
              {/* Inner animated white directional escape dash */}
              <Layer
                id="route-inner-dash"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': '#ffffff',
                  'line-width': 2.5,
                  'line-dasharray': [2, 2],
                }}
              />
            </Source>
          )}

          {/* Intermediate Step Waypoint Nodes along Active Evacuation Route */}
          {isNavigating &&
            route &&
            route.found &&
            route.path.length > 2 &&
            route.path.slice(1, -1).map((node, idx) => (
              <Marker key={`route-step-${node.id}-${idx}`} longitude={node.lng} latitude={node.lat} anchor="center">
                <div className="flex items-center justify-center pointer-events-none z-[430]">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_12px_#22c55e] flex items-center justify-center text-[9px] font-black text-white animate-pulse">
                    {idx + 1}
                  </div>
                </div>
              </Marker>
            ))}

          {/* ── 7. BUILDING LABELS (ZOOM-DEPENDENT LOD TO PREVENT OVERLAP) ── */}
          {showLabels &&
            buildingsData.features.map((f: any) => {
              const isMajor =
                f.properties.id === 'school_gym' ||
                f.properties.id === 'bcd_building' ||
                f.properties.id === 'admin_building' ||
                f.properties.id === 'school_clinic';

              // Priority 9 Zoom LOD:
              // < 17.0: Show no building labels
              // 17.0 - 18.2: Show only major landmarks (Gym, BOD, Admin, Clinic)
              // >= 18.2: Show all buildings
              if (currentZoom < 17.0) return null;
              if (currentZoom < 18.2 && !isMajor) return null;

              return (
                <Marker
                  key={f.properties.id}
                  longitude={f.properties.lng}
                  latitude={f.properties.lat}
                  anchor="center"
                >
                  <div
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-lg pointer-events-none whitespace-nowrap border flex items-center space-x-1 backdrop-blur-sm"
                    style={{
                      backgroundColor: `${f.properties.color}ee`,
                      borderColor: f.properties.strokeColor,
                      transform: show3D ? 'translateY(-14px)' : 'none',
                    }}
                  >
                    <Building2 className="w-2.5 h-2.5 opacity-90" />
                    <span>{f.properties.name}</span>
                  </div>
                </Marker>
              );
            })}



          {/* ── 8. CENTRAL EVACUATION ASSEMBLY AREA BADGE ── */}
          <Marker
            longitude={CAMPUS_CENTER.lng}
            latitude={CAMPUS_CENTER.lat}
            anchor="center"
          >
            <div className="flex flex-col items-center pointer-events-none">
              <div className="w-11 h-11 rounded-full bg-emerald-500/95 border-2 border-white shadow-[0_0_25px_#10b981] flex items-center justify-center text-xl animate-bounce">
                🛡️
              </div>
              <span className="mt-1 px-2.5 py-0.5 bg-emerald-950/95 border border-emerald-400 text-emerald-200 text-[10px] font-black rounded-full uppercase tracking-wider shadow-lg">
                School Ground (Evacuation Oval)
              </span>
            </div>
          </Marker>

          {/* ── 9. SCHOOL GATES (ENTRANCE / EXIT) ── */}
          {gatesData.features.map((gate: any) => (
            <Marker
              key={gate.properties.id}
              longitude={gate.properties.lng}
              latitude={gate.properties.lat}
              anchor="center"
            >
              <div className="flex items-center space-x-1.5 bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-full border-2 border-white shadow-2xl text-[10px] pointer-events-none uppercase tracking-wide">
                <DoorOpen className="w-3.5 h-3.5" />
                <span>{gate.properties.name}</span>
              </div>
            </Marker>
          ))}

          {/* ── 10. USER CURRENT LOCATION / SNAPPED PATHWAY PIN ── */}
          {selectedNode && (
            <Marker longitude={selectedNode.lng} latitude={selectedNode.lat} anchor="center">
              <div className="flex flex-col items-center pointer-events-none">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-10 h-10 rounded-full bg-cyan-400/40 animate-ping" />
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
                      borderRadius: '50%',
                      border: '3px solid white',
                      boxShadow: '0 0 20px rgba(6,182,212,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                    }}
                  >
                    📍
                  </div>
                </div>
                <span className="mt-1 px-2.5 py-0.5 bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-[10px] font-bold rounded-lg shadow-xl whitespace-nowrap">
                  {isGpsMode ? `Snapped Pathway (${selectedNode.name})` : `Your Location (${selectedNode.name})`}
                </span>
              </div>
            </Marker>
          )}

          {/* ── 10B. LIVE REAL-TIME DEVICE GPS PULSE MARKER ── */}
          {userGpsCoord && (
            <Marker longitude={userGpsCoord.lng} latitude={userGpsCoord.lat} anchor="center">
              <div className="flex flex-col items-center pointer-events-none z-[460]">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-12 h-12 rounded-full bg-blue-500/30 animate-ping" />
                  <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_15px_#3b82f6] flex items-center justify-center text-white text-[9px] font-black">
                    ●
                  </div>
                </div>
                <span className="mt-1 px-2 py-0.5 bg-blue-950/95 border border-blue-400 text-blue-200 text-[9px] font-bold rounded-md shadow-lg whitespace-nowrap">
                  📍 Live GPS {userGpsCoord.accuracy ? `(±${Math.round(userGpsCoord.accuracy)}m)` : ''}
                </span>
              </div>
            </Marker>
          )}

          {/* ── 11. ACTIVE HAZARDS (PULSING ON MAP) ── */}
          {showHazards &&
            rtHazards.map((hazard) => (
              <Marker
                key={hazard.properties.hazard_id}
                longitude={hazard.geometry.coordinates[0]}
                latitude={hazard.geometry.coordinates[1]}
                anchor="center"
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background:
                      hazard.properties.severity === 'critical' ? '#dc2626' : '#ea580c',
                    borderRadius: '50%',
                    border: '3px solid white',
                    boxShadow: '0 0 20px rgba(239,68,68,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectHazard(hazard);
                    setSelectedHazardInfo(hazard);
                  }}
                  title={`${hazard.properties.type} (${hazard.properties.severity})`}
                >
                  🔥
                </div>
              </Marker>
            ))}

          {/* ── 12. HOVER BUILDING TOOLTIP ── */}
          {hoveredFeature && hoveredFeature.properties?.name && (
            <Popup
              longitude={hoveredFeature.geometry.coordinates?.[0]?.[0]?.[0] || CAMPUS_CENTER.lng}
              latitude={hoveredFeature.geometry.coordinates?.[0]?.[0]?.[1] || CAMPUS_CENTER.lat}
              closeButton={false}
              closeOnClick={false}
              anchor="top"
            >
              <div className="text-xs p-1">
                <p className="font-bold text-white">{hoveredFeature.properties.name}</p>
                <p className="text-[10px] text-slate-400">{hoveredFeature.properties.category}</p>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* ══════════════ RIGHT EVACUATION ROUTER & HAZARDS SIDEBAR ══════════════ */}
      {infoPanelOpen && (
        <div
          className="w-80 flex-shrink-0 bg-slate-950/95 border-l border-slate-800 flex flex-col overflow-y-auto"
          style={{ maxHeight: '100%' }}
        >
          {/* Evacuation Router Header */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Compass className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Emergency Evacuation Router
              </span>
            </div>

            {/* GPS Trigger / Mode Switcher */}
            <div className="flex flex-col space-y-1.5 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <button
                type="button"
                onClick={handleRequestGps}
                className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  isGpsMode && userGpsCoord
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/30'
                }`}
                title="Detect live device GPS location and snap to nearest evacuation pathway"
              >
                <Locate className={`w-3.5 h-3.5 text-cyan-400 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
                <span>
                  {gpsStatus === 'locating'
                    ? 'Detecting GPS Satellite Fix...'
                    : isGpsMode && userGpsCoord
                    ? `📍 Live GPS Active (±${Math.round(userGpsCoord.accuracy || 0)}m)`
                    : '📍 Use Real-Time Device GPS'}
                </span>
              </button>

              {gpsErrorMsg && (
                <p className="text-[10px] text-rose-400 px-1">{gpsErrorMsg}</p>
              )}

              {isGpsMode && userGpsCoord && (
                <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Snapped to: <strong className="text-cyan-300">{selectedNode?.name}</strong></span>
                  <button
                    type="button"
                    onClick={() => setIsGpsMode(false)}
                    className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Manual Select
                  </button>
                </div>
              )}
            </div>

            <label className="block text-[11px] font-medium text-slate-400">
              {isGpsMode ? 'Origin Snapped Pathway Node:' : 'Select Starting Classroom / Building:'}
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setIsGpsMode(false);
                setSelectedLocation(e.target.value);
                if (isNavigating) {
                  calculateEvacuationRoute(e.target.value, selectedDestination);
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <optgroup label="Academic Classrooms">
                {buildingNodes
                  .filter((n) => n.category?.includes('High') || n.id.includes('bcd') || n.id.includes('shs') || n.id.includes('jhs'))
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Facilities & Offices">
                {buildingNodes
                  .filter((n) => !n.category?.includes('High') && !n.id.includes('bcd') && !n.id.includes('shs') && !n.id.includes('jhs'))
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Pathway Junctions">
                {CAMPUS_NODES.filter((n) => n.type === 'junction').map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </optgroup>
            </select>

            <label className="block text-[11px] font-medium text-slate-400 pt-1">
              Select Evacuation Destination:
            </label>
            <select
              value={selectedDestination}
              onChange={(e) => {
                setSelectedDestination(e.target.value);
                if (isNavigating) {
                  const startId = isGpsMode && userGpsCoord ? findNearestNodeToGps(userGpsCoord.lat, userGpsCoord.lng).id : selectedLocation;
                  calculateEvacuationRoute(startId, e.target.value);
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="oval">🛡️ School Ground (Central Evacuation Oval)</option>
              <option value="gate_entrance">🚪 School Gate (Main Entrance - South Road)</option>
              <option value="gate_exit">🚪 School Gate (North Exit Road)</option>
            </select>

            {!isNavigating ? (
              <button
                onClick={handleStartNavigation}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer mt-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>
                  {rtHazards.some((h) => h.properties.status !== 'resolved')
                    ? 'Calculate Safest Available Route'
                    : 'Calculate Evacuation Route'}
                </span>
              </button>
            ) : (
              <button
                onClick={handleClearNavigation}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all cursor-pointer mt-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Clear Navigation Route</span>
              </button>
            )}
          </div>

          {/* Calculated Route Details */}
          {isNavigating && route && (
            <div className="p-4 border-b border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                {route.found ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    route.found ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {!route.found
                    ? 'No Safe Route Available'
                    : route.isHazardRerouted
                    ? 'Safest Available Route (Hazard-Aware)'
                    : 'Recommended Evacuation Route Active'}
                </span>
              </div>

              {route.found ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-1.5 text-xs">
                  {route.isHazardRerouted && (
                    <div className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg text-[10px] text-amber-300 font-bold flex items-center space-x-1.5">
                      <span>⚠️</span>
                      <span>Hazard Avoidance Active ({route.hazardsAvoidedCount} blocked points avoided)</span>
                    </div>
                  )}

                  <p className="text-slate-300">
                    <span className="text-slate-500 font-semibold">Origin:</span>{' '}
                    {isGpsMode && userGpsCoord ? (
                      <span className="text-blue-300 font-bold">
                        📍 Live GPS Position (near {selectedNode?.name})
                      </span>
                    ) : (
                      selectedNode?.name
                    )}
                  </p>
                  <p className="text-slate-300">
                    <span className="text-slate-500 font-semibold">Destination:</span>{' '}
                    {selectedDestination === 'oval'
                      ? 'School Ground (Central Evacuation Oval)'
                      : selectedDestination === 'gate_entrance'
                      ? 'School Gate (Main Entrance - South)'
                      : 'School Gate (North Exit)'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-500/20">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        Distance
                      </span>
                      <p className="text-sm font-extrabold text-emerald-400">
                        {route.totalDistance} meters
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        Est. Time
                      </span>
                      <p className="text-sm font-extrabold text-cyan-400">
                        {formatTime(route.estimatedSeconds)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-emerald-500/20">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      Step-by-step Pathway Route:
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                      {route.path.map((n) => n.name).join(' ➔ ')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                  <p className="text-xs text-rose-300">
                    All direct pathways to the designated safe zone are currently blocked by active hazards. Please seek emergency
                    cover inside the nearest reinforced structure and await instructions from the School DRRM Team.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Active Hazards Section */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Active Campus Hazards ({rtHazards.length})
              </span>
            </div>

            {rtHazards.length === 0 ? (
              <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>All campus pathways are clear</span>
              </div>
            ) : (
              <div className="space-y-2">
                {rtHazards.map((h) => (
                  <button
                    key={h.properties.hazard_id}
                    onClick={() => setSelectedHazardInfo(h)}
                    className="w-full text-left bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-2.5 space-y-1 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{h.properties.type}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                          h.properties.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-400'
                            : h.properties.severity === 'high'
                            ? 'bg-orange-500/20 text-orange-400'
                            : h.properties.severity === 'moderate'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {h.properties.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {h.properties.description}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsPinMode(true)}
              className="mt-3 w-full flex items-center justify-center space-x-2 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report New Hazard (Pin on Map)</span>
            </button>
          </div>

          {/* Hazard Detail Card */}
          {selectedHazardInfo && (
            <div className="p-4 border-b border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Hazard Detail</span>
                </div>
                <button
                  onClick={() => setSelectedHazardInfo(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white font-bold">{selectedHazardInfo.properties.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Severity</span>
                  <span
                    className={`font-extrabold uppercase ${
                      selectedHazardInfo.properties.severity === 'critical'
                        ? 'text-rose-400'
                        : selectedHazardInfo.properties.severity === 'high'
                        ? 'text-orange-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {selectedHazardInfo.properties.severity}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="text-rose-400 font-bold uppercase">
                    {selectedHazardInfo.properties.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Description</span>
                  <p className="text-white mt-1">{selectedHazardInfo.properties.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
