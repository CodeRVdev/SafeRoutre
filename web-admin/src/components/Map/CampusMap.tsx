// CampusMap — Primary GIS evacuation map for Polonuling NHS
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Map, { Source, Layer, Marker, Popup, GeolocateControl } from 'react-map-gl/maplibre';
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
import { apiRequest } from '../../api/client';
import { getActiveAlertsApi } from '../../api/alerts';
import {
  RefreshCw, PlusCircle, Navigation, XCircle, MapPin, Layers, AlertTriangle,
  Info, ZoomIn, ZoomOut, Maximize, PanelLeftClose, PanelLeftOpen, CheckCircle,
  Compass, ShieldCheck, DoorOpen, Building2, Locate, ChevronDown, ChevronUp,
  Expand, Minimize2
} from 'lucide-react';

export interface EmergencyMarkerItem {
  id: string;
  type: 'sos' | 'injured';
  title: string;
  name: string;
  role: string;
  department?: string | null;
  message?: string | null;
  lat: number;
  lng: number;
  timestamp: string | Date;
  priority?: string;
  alertId?: number;
}

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
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
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
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
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
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
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

// School Ground & Central Evacuation Assembly Oval Geographic Datum
export const SCHOOL_GROUND_CENTER = { lat: 6.2879084, lng: 124.9676961 };

// ── AUTHORITATIVE BUILDING-TO-ROOMS MAPPING (PNHS GIS DATA) ──────
export const BUILDING_ROOMS_MAP: Record<string, { name: string; category: string; rooms: string[] }> = {
  jhs_north: {
    name: 'JHS Building (North-Center)',
    category: 'Academic Classrooms',
    rooms: ['SCI LAB', 'SHS OFFICE', '10 ONYX', '10 STE', '10 JADE', '10 SPA'],
  },
  shs_north: {
    name: 'SHS Building (North)',
    category: 'Academic Classrooms',
    rooms: ['7 STE'],
  },
  bcd_building: {
    name: 'BCD Building (School ID 304561)',
    category: 'Academic Classrooms',
    rooms: ['11 TECHPRO A', '12 COOKERY'],
  },
  boq_building: {
    name: 'BOQ Building / JHS West',
    category: 'Academic Classrooms',
    rooms: ['9 SPA A', '9 SPA B', '9 AQUA-MARINE', '9 CRYS-TAL', '8 SPA A', '8 SPA B', '8 RUBY', '7 OPAL', 'FACULTY'],
  },
  shs_south: {
    name: 'SHS Building (South Wing)',
    category: 'Academic Classrooms',
    rooms: ['11 ACAD-B', '11 TECHPRO B', '12 AFA', 'COMPUTER', '11 ACAD-A', '11 ACAD-D'], // exact 12 AFA preserved
  },
  admin_building: {
    name: 'ADMIN Building',
    category: 'Facilities & Offices',
    rooms: ['ADMIN OFFICE', "PRINCIPAL'S OFFICE", 'LIBRARY', 'GUIDANCE OFFICE'],
  },
  jhs_east_top: {
    name: 'JHS Building (East-Top)',
    category: 'Academic Classrooms',
    rooms: ['12 EIM', '12 STEM', '9 STE', '8 STE'],
  },
  jhs_east_bottom_1: {
    name: 'JHS Building (East-Bottom 1)',
    category: 'Academic Classrooms',
    rooms: ['7 PEARL', '7 SPA A', 'CANTEEN 2'],
  },
  jhs_east_bottom_2: {
    name: 'JHS Building (East-Bottom 2)',
    category: 'Academic Classrooms',
    rooms: ['8 JASPER', 'COMPUTER ROOM'],
  },
  school_gym: {
    name: 'School GYM (Covered Court)',
    category: 'Facilities & Offices',
    rooms: ['SCHOOL COVERED GYM'],
  },
  stage_ground: {
    name: 'Stage (School Ground)',
    category: 'Facilities & Offices',
    rooms: ['OPEN STAGE'],
  },
  stage_gym: {
    name: 'Stage (Gymnasium)',
    category: 'Facilities & Offices',
    rooms: ['GYM STAGE'],
  },
  school_clinic: {
    name: 'School Clinic',
    category: 'Facilities & Offices',
    rooms: ['CLINIC'],
  },
  school_ground: {
    name: 'School Ground (Central Open Field)',
    category: 'Other Layers',
    rooms: ['SCHOOL GROUND', 'ASSIGNED AREA', '12 ABM', '12 HUMSS'],
  },
  gate_entrance: {
    name: 'Entrance Gate',
    category: 'Facilities & Offices',
    rooms: ['ENTRANCE GATE'],
  },
  gate_exit: {
    name: 'Exit Gate',
    category: 'Facilities & Offices',
    rooms: ['EXIT GATE'],
  },
};

// ── SECTOR STYLES & VISUAL TOKENS FOR ROOM LABELS ─────────────────
export const SECTOR_STYLES = {
  north: { bg: 'bg-amber-950/90', border: 'border-amber-400/60', text: 'text-amber-200', dot: 'bg-amber-400' },
  west: { bg: 'bg-rose-950/90', border: 'border-rose-400/60', text: 'text-rose-200', dot: 'bg-rose-400' },
  central: { bg: 'bg-emerald-950/90', border: 'border-emerald-400/60', text: 'text-emerald-200', dot: 'bg-emerald-400' },
  south: { bg: 'bg-orange-950/90', border: 'border-orange-400/60', text: 'text-orange-200', dot: 'bg-orange-400' },
  east: { bg: 'bg-sky-950/90', border: 'border-sky-400/60', text: 'text-sky-200', dot: 'bg-sky-400' },
  facility: { bg: 'bg-cyan-950/90', border: 'border-cyan-400/70', text: 'text-cyan-200', dot: 'bg-cyan-400' },
};

// ── AUTHORITATIVE PNHS CLASSROOM & FACILITY ROOM LABELS ───────────
// Visual reference: PNHS School Map layout. Coordinates strictly attached to existing GIS buildings.
export interface CampusRoomLabel {
  id: string;
  name: string;
  category: 'north' | 'west' | 'central' | 'south' | 'east' | 'facility';
  lat: number;
  lng: number;
  minZoom: number;
  priority: 1 | 2 | 3 | 4; // Priority 1: Major Landmarks, 2: Key Facilities, 3: Buildings, 4: Classrooms
  parentBuildingId?: string;
}

export const CAMPUS_ROOM_LABELS: CampusRoomLabel[] = [
  // ── NORTH / SHS AREA ──
  { id: 'room-11-techpro-a', name: '11 TECHPRO A', category: 'north', lat: 6.288135, lng: 124.967465, minZoom: 17.5, priority: 4, parentBuildingId: 'bcd_building' },
  { id: 'room-12-cookery', name: '12 COOKERY', category: 'north', lat: 6.288050, lng: 124.967420, minZoom: 17.7, priority: 4, parentBuildingId: 'bcd_building' },
  { id: 'room-sci-lab', name: 'SCI LAB', category: 'north', lat: 6.288130, lng: 124.967625, minZoom: 17.5, priority: 4, parentBuildingId: 'jhs_north' },
  { id: 'room-shs-office', name: 'SHS OFFICE', category: 'north', lat: 6.288115, lng: 124.967655, minZoom: 17.7, priority: 4, parentBuildingId: 'jhs_north' },
  { id: 'room-10-onyx', name: '10 ONYX', category: 'north', lat: 6.288100, lng: 124.967685, minZoom: 17.8, priority: 4, parentBuildingId: 'jhs_north' },
  { id: 'room-10-ste', name: '10 STE', category: 'north', lat: 6.288085, lng: 124.967715, minZoom: 17.8, priority: 4, parentBuildingId: 'jhs_north' },
  { id: 'room-10-jade', name: '10 JADE', category: 'north', lat: 6.288070, lng: 124.967745, minZoom: 17.8, priority: 4, parentBuildingId: 'jhs_north' },
  { id: 'room-10-spa', name: '10 SPA', category: 'north', lat: 6.288055, lng: 124.967775, minZoom: 17.8, priority: 4, parentBuildingId: 'jhs_north' },

  // ── WEST / LEFT CLASSROOM AREA ──
  { id: 'room-9-spa-a', name: '9 SPA A', category: 'west', lat: 6.287945, lng: 124.967390, minZoom: 17.5, priority: 4, parentBuildingId: 'boq_building' },
  { id: 'room-9-spa-b', name: '9 SPA B', category: 'west', lat: 6.287915, lng: 124.967375, minZoom: 17.8, priority: 4, parentBuildingId: 'boq_building' },
  { id: 'room-9-aqua-marine', name: '9 AQUA-MARINE', category: 'west', lat: 6.287885, lng: 124.967360, minZoom: 17.8, priority: 4, parentBuildingId: 'boq_building' },
  { id: 'room-9-crys-tal', name: '9 CRYS-TAL', category: 'west', lat: 6.287855, lng: 124.967345, minZoom: 17.8, priority: 4, parentBuildingId: 'boq_building' },
  { id: 'room-8-spa-a', name: '8 SPA A', category: 'west', lat: 6.287825, lng: 124.967330, minZoom: 17.8, priority: 4, parentBuildingId: 'boq_building' },
  { id: 'room-8-spa-b', name: '8 SPA B', category: 'west', lat: 6.287795, lng: 124.967315, minZoom: 17.8, priority: 4, parentBuildingId: 'boq_building' },
  { id: 'room-8-ruby', name: '8 RUBY', category: 'west', lat: 6.287765, lng: 124.967300, minZoom: 17.5, priority: 4, parentBuildingId: 'boq_building' },
  { id: 'room-7-opal', name: '7 OPAL', category: 'west', lat: 6.287735, lng: 124.967285, minZoom: 17.8, priority: 4, parentBuildingId: 'boq_building' },
  { id: 'room-faculty-west', name: 'FACULTY', category: 'west', lat: 6.287710, lng: 124.967325, minZoom: 17.6, priority: 4, parentBuildingId: 'boq_building' },

  // ── CENTRAL / SCHOOL GROUND ──
  { id: 'label-school-ground', name: 'SCHOOL GROUND', category: 'central', lat: 6.287975, lng: 124.967660, minZoom: 16.0, priority: 1, parentBuildingId: 'school_ground' },
  { id: 'label-assigned-area', name: 'ASSIGNED AREA', category: 'central', lat: 6.287840, lng: 124.967730, minZoom: 17.5, priority: 2, parentBuildingId: 'school_ground' },
  { id: 'label-open-stage', name: 'OPEN STAGE', category: 'central', lat: 6.2876298, lng: 124.9678173, minZoom: 16.8, priority: 2, parentBuildingId: 'stage_ground' },
  { id: 'room-7-ste', name: '7 STE', category: 'central', lat: 6.288020, lng: 124.967820, minZoom: 17.6, priority: 4, parentBuildingId: 'shs_north' },
  { id: 'room-12-abm', name: '12 ABM', category: 'central', lat: 6.287750, lng: 124.967600, minZoom: 17.4, priority: 4, parentBuildingId: 'school_ground' },
  { id: 'room-12-humss', name: '12 HUMSS', category: 'central', lat: 6.287720, lng: 124.967680, minZoom: 17.4, priority: 4, parentBuildingId: 'school_ground' },
  { id: 'room-canteen-2', name: 'CANTEEN 2', category: 'central', lat: 6.287650, lng: 124.967920, minZoom: 17.6, priority: 2, parentBuildingId: 'jhs_east_bottom_1' },

  // ── SOUTH / LOWER CLASSROOM AREA ──
  { id: 'room-11-acad-b', name: '11 ACAD-B', category: 'south', lat: 6.287670, lng: 124.967320, minZoom: 17.8, priority: 4, parentBuildingId: 'shs_south' },
  { id: 'room-11-techpro-b', name: '11 TECHPRO B', category: 'south', lat: 6.287630, lng: 124.967400, minZoom: 17.8, priority: 4, parentBuildingId: 'shs_south' },
  { id: 'room-12-afa', name: '12 AFA', category: 'south', lat: 6.287590, lng: 124.967480, minZoom: 17.2, priority: 4, parentBuildingId: 'shs_south' }, // CRITICAL: exact room name 12 AFA preserved
  { id: 'room-computer-south', name: 'COMPUTER', category: 'south', lat: 6.287545, lng: 124.967560, minZoom: 17.7, priority: 4, parentBuildingId: 'shs_south' },
  { id: 'room-11-acad-a', name: '11 ACAD-A', category: 'south', lat: 6.287500, lng: 124.967640, minZoom: 17.8, priority: 4, parentBuildingId: 'shs_south' },
  { id: 'room-11-acad-d', name: '11 ACAD-D', category: 'south', lat: 6.287450, lng: 124.967730, minZoom: 17.8, priority: 4, parentBuildingId: 'shs_south' },

  // ── EAST / RIGHT SIDE ──
  { id: 'room-admin-office', name: 'ADMIN OFFICE', category: 'east', lat: 6.287840, lng: 124.968020, minZoom: 17.0, priority: 2, parentBuildingId: 'admin_building' },
  { id: 'room-principals-office', name: "PRINCIPAL'S OFFICE", category: 'east', lat: 6.287880, lng: 124.968060, minZoom: 17.2, priority: 2, parentBuildingId: 'admin_building' },
  { id: 'room-library', name: 'LIBRARY', category: 'east', lat: 6.287810, lng: 124.968040, minZoom: 17.2, priority: 2, parentBuildingId: 'admin_building' },
  { id: 'room-guidance-office', name: 'GUIDANCE OFFICE', category: 'east', lat: 6.287920, lng: 124.968070, minZoom: 17.2, priority: 2, parentBuildingId: 'admin_building' },
  { id: 'room-12-eim', name: '12 EIM', category: 'east', lat: 6.287720, lng: 124.968140, minZoom: 17.5, priority: 4, parentBuildingId: 'jhs_east_top' },
  { id: 'room-12-stem', name: '12 STEM', category: 'east', lat: 6.287780, lng: 124.968180, minZoom: 17.5, priority: 4, parentBuildingId: 'jhs_east_top' },
  { id: 'room-9-ste', name: '9 STE', category: 'east', lat: 6.287820, lng: 124.968160, minZoom: 17.8, priority: 4, parentBuildingId: 'jhs_east_top' },
  { id: 'room-8-ste', name: '8 STE', category: 'east', lat: 6.287740, lng: 124.968200, minZoom: 17.8, priority: 4, parentBuildingId: 'jhs_east_top' },
  { id: 'room-7-pearl', name: '7 PEARL', category: 'east', lat: 6.287600, lng: 124.967960, minZoom: 17.8, priority: 4, parentBuildingId: 'jhs_east_bottom_1' },
  { id: 'room-7-spa-a', name: '7 SPA A', category: 'east', lat: 6.287640, lng: 124.967990, minZoom: 17.8, priority: 4, parentBuildingId: 'jhs_east_bottom_1' },
  { id: 'room-8-jasper', name: '8 JASPER', category: 'east', lat: 6.287500, lng: 124.967900, minZoom: 17.6, priority: 4, parentBuildingId: 'jhs_east_bottom_2' },
  { id: 'room-computer-room', name: 'COMPUTER ROOM', category: 'east', lat: 6.287540, lng: 124.967940, minZoom: 17.7, priority: 4, parentBuildingId: 'jhs_east_bottom_2' },

  // ── OTHER FACILITIES ──
  { id: 'facility-clinic', name: 'CLINIC', category: 'facility', lat: 6.2873927, lng: 124.9679164, minZoom: 16.0, priority: 1, parentBuildingId: 'school_clinic' },
  { id: 'facility-gym', name: 'SCHOOL COVERED GYM', category: 'facility', lat: 6.2882209, lng: 124.9675284, minZoom: 16.0, priority: 1, parentBuildingId: 'school_gym' },
  { id: 'facility-exit-gate', name: 'EXIT GATE', category: 'facility', lat: 6.288412, lng: 124.967531, minZoom: 16.0, priority: 1, parentBuildingId: 'gate_exit' },
  { id: 'facility-entrance-gate', name: 'ENTRANCE GATE', category: 'facility', lat: 6.287371, lng: 124.968212, minZoom: 16.0, priority: 1, parentBuildingId: 'gate_entrance' },
];


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
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPinMode, setIsPinMode] = useState(false);
  const [showHazards, setShowHazards] = useState(true);
  const [showEmergencyMarkers, setShowEmergencyMarkers] = useState(true);
  const [emergencyMarkers, setEmergencyMarkers] = useState<EmergencyMarkerItem[]>([]);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyMarkerItem | null>(null);
  const [showPathways, setShowPathways] = useState(true);
  const [showBuildingLabels, setShowBuildingLabels] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showRoomLabels, setShowRoomLabels] = useState(false); // Clean by default, toggled on for detailed room info
  const [showBoundary, setShowBoundary] = useState(true);
  const [show3D, setShow3D] = useState(true);
  const [activeBaseMap, setActiveBaseMap] = useState<'satellite' | 'dark' | 'streets'>('satellite');
  const [hoveredFeature, setHoveredFeature] = useState<any | null>(null);
  const [selectedHazardInfo, setSelectedHazardInfo] = useState<HazardFeature | null>(null);
  const [rtHazards, setRtHazards] = useState<HazardFeature[]>([]);
  const [infoPanelOpen, setInfoPanelOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState({
    classrooms: false,
    facilities: false,
    pathways: false,
    other: false,
  });

  const toggleSection = (key: keyof typeof sectionOpen) => {
    setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const layerMenuRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize fullscreen state changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (mapContainerRef.current?.requestFullscreen) {
        mapContainerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Close layer menu on outside click
  useEffect(() => {
    if (!showLayerMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (layerMenuRef.current && !layerMenuRef.current.contains(e.target as Node)) {
        setShowLayerMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showLayerMenu]);

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

  // Initial fetch of active SOS and injured check-in emergency markers
  const fetchEmergencyMarkers = useCallback(async () => {
    try {
      // Load acknowledged/cleared distress IDs from localStorage
      let clearedIds: string[] = [];
      try {
        const stored = localStorage.getItem('saferoute_cleared_emergencies');
        clearedIds = stored ? JSON.parse(stored) : [];
      } catch (_) {}

      const markers: EmergencyMarkerItem[] = [];

      // 1. Fetch recent SOS distress signals (only unread / active)
      try {
        const sosRes = await apiRequest('/sos');
        const sosList = sosRes.data || sosRes || [];
        if (Array.isArray(sosList)) {
          for (const s of sosList) {
            // Skip if already marked read or acknowledged
            if (s.is_read) continue;
            const markerId = `sos-${s.message_id}`;
            if (clearedIds.includes(markerId)) continue;

            const lat = s.latitude ?? s.location_geojson?.coordinates?.[1];
            const lng = s.longitude ?? s.location_geojson?.coordinates?.[0];
            if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
              markers.push({
                id: markerId,
                type: 'sos',
                title: 'DISTRESS SOS SIGNAL',
                name: s.sender_name || 'Personnel',
                role: s.sender_role || 'Staff / Student',
                department: s.sender_department || null,
                message: s.content || null,
                lat,
                lng,
                timestamp: s.created_at,
                priority: s.priority || 'normal',
                alertId: s.alert_id,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch initial SOS markers:', err);
      }

      // 2. Fetch active alert check-ins for injured personnel
      try {
        const alertsRes = await getActiveAlertsApi();
        if (alertsRes.success && Array.isArray(alertsRes.data)) {
          for (const alert of alertsRes.data) {
            try {
              const dashRes = await apiRequest(`/checkins/dashboard?alert_id=${alert.alert_id}`);
              const checkedIn = dashRes.checked_in_users || [];
              for (const c of checkedIn) {
                if (c.status === 'injured') {
                  const markerId = `injured-${c.checkin_id}`;
                  if (clearedIds.includes(markerId)) continue;

                  const lat = c.latitude ?? c.location?.coordinates?.[1];
                  const lng = c.longitude ?? c.location?.coordinates?.[0];
                  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                    markers.push({
                      id: markerId,
                      type: 'injured',
                      title: 'INJURED PERSONNEL',
                      name: c.full_name || 'Personnel',
                      role: c.role || 'Staff / Student',
                      department: c.department || null,
                      message: c.message || 'Reported injured during emergency check-in',
                      lat,
                      lng,
                      timestamp: c.checked_in_at,
                      priority: 'critical',
                      alertId: alert.alert_id,
                    });
                  }
                }
              }
            } catch (_) {}
          }
        }
      } catch (err) {
        console.warn('Could not fetch initial injured checkin markers:', err);
      }

      setEmergencyMarkers(markers);
    } catch (err) {
      console.warn('Failed to initialize emergency markers:', err);
    }
  }, []);

  // Persistent handler when coordinator clicks "Acknowledge & Clear Marker"
  const handleAcknowledgeEmergency = useCallback(async (emergency: EmergencyMarkerItem) => {
    // 1. Immediately remove from map and clear popup
    setEmergencyMarkers((prev) => prev.filter((m) => m.id !== emergency.id));
    setSelectedEmergency(null);

    // 2. Persist in localStorage so it never returns on page refresh
    try {
      const stored = localStorage.getItem('saferoute_cleared_emergencies');
      const clearedIds: string[] = stored ? JSON.parse(stored) : [];
      if (!clearedIds.includes(emergency.id)) {
        clearedIds.push(emergency.id);
        const trimmed = clearedIds.slice(-200);
        localStorage.setItem('saferoute_cleared_emergencies', JSON.stringify(trimmed));
      }
    } catch (err) {
      console.warn('Could not save cleared emergency to localStorage:', err);
    }

    // 3. If it's an SOS distress message, persist in backend database via PATCH /api/sos/:id/read
    if (emergency.type === 'sos') {
      const numericId = parseInt(emergency.id.replace('sos-', ''), 10);
      if (!isNaN(numericId)) {
        try {
          await apiRequest(`/sos/${numericId}/read`, {
            method: 'PATCH',
          });
        } catch (err) {
          console.warn(`Could not mark SOS message ${numericId} as read on backend:`, err);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchEmergencyMarkers();
  }, [fetchEmergencyMarkers]);

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

    // Emergency real-time listeners (SOS & Injured Check-ins)
    const onSosNew = (data: any) => {
      const lat =
        data.latitude ??
        data.location?.latitude ??
        data.location_geojson?.coordinates?.[1] ??
        (data.location?.coordinates ? data.location.coordinates[1] : undefined);
      const lng =
        data.longitude ??
        data.location?.longitude ??
        data.location_geojson?.coordinates?.[0] ??
        (data.location?.coordinates ? data.location.coordinates[0] : undefined);

      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        const newMarker: EmergencyMarkerItem = {
          id: `sos-${data.message_id || Date.now()}`,
          type: 'sos',
          title: 'DISTRESS SOS SIGNAL',
          name: data.sender_name || data.full_name || 'Personnel',
          role: data.sender_role || data.role || 'Staff / Student',
          department: data.sender_department || data.department || null,
          message: data.content || null,
          lat,
          lng,
          timestamp: data.created_at || new Date().toISOString(),
          priority: data.priority || 'normal',
          alertId: data.alert_id,
        };

        setEmergencyMarkers((prev) => [newMarker, ...prev.filter((m) => m.id !== newMarker.id)]);
      }
    };

    const onCheckinNew = (data: any) => {
      const checkin = data.checkin || data;
      const status = checkin.status;
      if (status === 'injured') {
        const lat = checkin.latitude ?? checkin.location?.coordinates?.[1];
        const lng = checkin.longitude ?? checkin.location?.coordinates?.[0];

        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
          const newMarker: EmergencyMarkerItem = {
            id: `injured-${checkin.checkin_id || Date.now()}`,
            type: 'injured',
            title: 'INJURED PERSONNEL',
            name: checkin.full_name || checkin.user_name || 'Personnel',
            role: checkin.role || 'Staff / Student',
            department: checkin.department || null,
            message: checkin.message || 'Reported injured during emergency check-in',
            lat,
            lng,
            timestamp: checkin.checked_in_at || new Date().toISOString(),
            priority: 'critical',
            alertId: checkin.alert_id,
          };

          setEmergencyMarkers((prev) => [newMarker, ...prev.filter((m) => m.id !== newMarker.id)]);
        }
      }
    };

    const onAlertResolved = (data: any) => {
      const resolvedAlertId = data.alert_id || data.alert?.alert_id;
      if (resolvedAlertId) {
        setEmergencyMarkers((prev) => prev.filter((m) => m.alertId !== resolvedAlertId));
        setSelectedEmergency((prev) => (prev?.alertId === resolvedAlertId ? null : prev));
      }
    };

    const onSosAcknowledged = (data: any) => {
      const sosId = data.message_id;
      if (sosId) {
        setEmergencyMarkers((prev) => prev.filter((m) => m.id !== `sos-${sosId}`));
        setSelectedEmergency((prev) => (prev?.id === `sos-${sosId}` ? null : prev));
      }
    };

    socket.on('sos:new', onSosNew);
    socket.on('sos:acknowledged', onSosAcknowledged);
    socket.on('checkin:new', onCheckinNew);
    socket.on('alert:resolved', onAlertResolved);

    return () => {
      socket.off('hazard:new', onHazardNew);
      socket.off('hazard:updated', onHazardUpdated);
      socket.off('hazard:resolved', onHazardResolved);
      socket.off('sos:new', onSosNew);
      socket.off('sos:acknowledged', onSosAcknowledged);
      socket.off('checkin:new', onCheckinNew);
      socket.off('alert:resolved', onAlertResolved);
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
      center: [SCHOOL_GROUND_CENTER.lng, SCHOOL_GROUND_CENTER.lat],
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

  // Handle building selection & camera flyTo
  const handleSelectBuilding = useCallback((bId: string, lat?: number, lng?: number) => {
    setSelectedBuildingId((prev) => (prev === bId ? null : bId));
    const matchingNode = CAMPUS_NODES.find((n) => n.id === bId);
    if (matchingNode) {
      setSelectedLocation(bId);
    }
    if (lat && lng && mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 18.5,
        duration: 1000,
      });
    }
  }, []);

  const handleMapClick = (e: any) => {
    if (isPinMode) {
      setIsPinMode(false);
      onOpenAddHazard([e.lngLat.lng, e.lngLat.lat]);
      return;
    }
    const bFeature = e.features?.find((f: any) => f.layer?.id === 'buildings-fill');
    if (bFeature && bFeature.properties?.id) {
      handleSelectBuilding(bFeature.properties.id, bFeature.properties.lat, bFeature.properties.lng);
      return;
    }
    const groundFeature = e.features?.find(
      (f: any) => f.layer?.id === 'school-ground-fill' || f.layer?.id === 'assembly-oval-fill'
    );
    if (groundFeature) {
      handleSelectBuilding('school_ground', SCHOOL_GROUND_CENTER.lat, SCHOOL_GROUND_CENTER.lng);
      return;
    }
    // Clicked outside any building/ground
    setSelectedBuildingId(null);
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

  // Selected Building Highlight GeoJSON
  const selectedBuildingGeoJSON = useMemo(() => {
    if (!selectedBuildingId) return null;
    const feat = buildingsData.features.find((f: any) => f.properties.id === selectedBuildingId);
    if (!feat) return null;
    return turf.featureCollection([feat as any]);
  }, [selectedBuildingId]);

  // Selected Building Metadata & Associated Rooms
  const selectedBuildingInfo = useMemo(() => {
    if (!selectedBuildingId) return null;
    const bData = BUILDING_ROOMS_MAP[selectedBuildingId];
    const feat = buildingsData.features.find((f: any) => f.properties?.id === selectedBuildingId) as any;
    if (feat && feat.properties) {
      return {
        id: selectedBuildingId,
        name: bData?.name || feat.properties.name,
        lat: feat.properties.lat,
        lng: feat.properties.lng,
        rooms: bData?.rooms || [],
      };
    }
    if (selectedBuildingId === 'school_ground') {
      return {
        id: 'school_ground',
        name: 'School Ground (Central Open Field)',
        lat: SCHOOL_GROUND_CENTER.lat,
        lng: SCHOOL_GROUND_CENTER.lng,
        rooms: bData?.rooms || [],
      };
    }
    return null;
  }, [selectedBuildingId]);

  // Academic Classrooms buildings list for Directory
  const academicBuildings = useMemo(() => {
    const ids = [
      'jhs_north',
      'shs_north',
      'bcd_building',
      'shs_south',
      'jhs_east_top',
      'jhs_east_bottom_1',
      'jhs_east_bottom_2',
    ];
    return ids
      .map((id) => {
        const feat = buildingsData.features.find((f: any) => f.properties?.id === id) as any;
        return feat && feat.properties
          ? { id, name: feat.properties.name, lat: feat.properties.lat, lng: feat.properties.lng }
          : null;
      })
      .filter(Boolean) as { id: string; name: string; lat: number; lng: number }[];
  }, []);

  // Facilities & Offices buildings list for Directory
  const facilityBuildings = useMemo(() => {
    const ids = [
      'school_gym',
      'stage_ground',
      'boq_building',
      'school_clinic',
      'admin_building',
    ];
    return ids
      .map((id) => {
        const feat = buildingsData.features.find((f: any) => f.properties?.id === id) as any;
        return feat && feat.properties
          ? { id, name: feat.properties.name, lat: feat.properties.lat, lng: feat.properties.lng }
          : null;
      })
      .filter(Boolean) as { id: string; name: string; lat: number; lng: number }[];
  }, []);

  return (
    <div ref={mapContainerRef} className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex bg-slate-950 font-sans">
      {/* ══════════════ MAP CANVAS ══════════════ */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        {/* Pin Hazard Mode Warning Banner (Positioned below top toolbar to avoid overlap) */}
        {isPinMode && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-amber-950/95 border border-amber-500 text-amber-200 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-3 text-xs font-bold animate-bounce max-w-[calc(100vw-32px)]">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
            <span className="truncate">HAZARD PIN MODE: Click on the campus map to place hazard</span>
            <button
              onClick={() => setIsPinMode(false)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer flex-shrink-0"
            >
              Cancel
            </button>
          </div>
        )}
        {/* ── Top Map Controls Floating Ribbon (Z-Index 40) ── */}
        <div className="absolute top-3 left-3 right-3 z-40 flex items-center justify-between pointer-events-auto flex-wrap gap-2">
          {/* ROW 1: Emergency & Quick Actions */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-xl">
            <button
              onClick={onToggleSidebar}
              className={`p-1.5 rounded-xl transition-all ${
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
              className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition-all"
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
                    : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border-rose-500/30'
                }`}
                title="Toggle Active Hazards List"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Hazards ({rtHazards.length})</span>
              </button>
            )}
            <div className="h-4 w-px bg-slate-700 mx-0.5" />
            <button
              onClick={() => setIsPinMode((v) => !v)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isPinMode
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/40'
                  : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30'
              }`}
              title="Pin a hazard on the campus map"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isPinMode ? 'Click Map...' : 'Pin Hazard'}</span>
            </button>
            <button
              onClick={() => setInfoPanelOpen((v) => !v)}
              className={`p-1.5 rounded-xl transition-all ${
                infoPanelOpen
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Toggle Evacuation Guide Panel"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* ROW 2: Map Actions (Satellite, Map Layers) */}
          <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-xl relative">
            <button
              type="button"
              onClick={() => setActiveBaseMap('satellite')}
              className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                activeBaseMap === 'satellite'
                  ? 'bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Google Satellite Hybrid View"
              aria-label="Satellite Map View"
            >
              🛰️ Satellite
            </button>

            {/* Map Layers Dropdown Button & Collapsible GIS Popover */}
            <div className="relative" ref={layerMenuRef}>
              <button
                onClick={() => setShowLayerMenu((v) => !v)}
                className={`flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                  showLayerMenu
                    ? 'bg-slate-800 text-cyan-300 border-cyan-500/50'
                    : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Toggle GIS Vector Layers & Campus Directory"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Map Layers</span>
                <span className="w-4 h-4 rounded-full bg-cyan-500/30 text-cyan-300 text-[10px] flex items-center justify-center font-black">
                  {[showBuildingLabels, showFacilities, showRoomLabels, showPathways, showHazards, showBoundary].filter(Boolean).length}
                </span>
              </button>

              {/* Map Layers Popup — Structured, Collapsible, Clean School-GIS */}
              {showLayerMenu && (
                <div className="absolute top-full mt-2.5 right-0 w-64 max-h-[75vh] bg-slate-900/98 backdrop-blur-md border border-slate-700/90 rounded-2xl p-3 shadow-2xl z-[70] flex flex-col space-y-2 text-xs overflow-hidden">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 flex-shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Map Layers</span>
                    </p>
                    <span className="text-[9px] text-cyan-400 font-mono">
                      {[showBuildingLabels, showFacilities, showRoomLabels, showPathways, showHazards, showBoundary].filter(Boolean).length}/6 Active
                    </span>
                  </div>

                  <div className="overflow-y-auto pr-1 space-y-2 flex-1 max-h-[60vh]">
                    {/* Layer Visibility Toggles */}
                    <div className="space-y-1 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                      <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                        Layer Visibility
                      </p>
                      <label className="flex items-center justify-between py-1 px-1.5 hover:bg-slate-800/60 rounded cursor-pointer text-slate-200">
                        <span className="flex items-center space-x-1.5 text-[11px]">
                          <span>🏢</span>
                          <span>Buildings</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={showBuildingLabels}
                          onChange={(e) => setShowBuildingLabels(e.target.checked)}
                          className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between py-1 px-1.5 hover:bg-slate-800/60 rounded cursor-pointer text-slate-200">
                        <span className="flex items-center space-x-1.5 text-[11px]">
                          <span>🏛️</span>
                          <span>Facilities</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={showFacilities}
                          onChange={(e) => setShowFacilities(e.target.checked)}
                          className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between py-1 px-1.5 hover:bg-slate-800/60 rounded cursor-pointer text-slate-200">
                        <span className="flex items-center space-x-1.5 text-[11px]">
                          <span>🏫</span>
                          <span>Room Labels</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={showRoomLabels}
                          onChange={(e) => setShowRoomLabels(e.target.checked)}
                          className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between py-1 px-1.5 hover:bg-slate-800/60 rounded cursor-pointer text-slate-200">
                        <span className="flex items-center space-x-1.5 text-[11px]">
                          <span>🚶</span>
                          <span>Pathways</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={showPathways}
                          onChange={(e) => setShowPathways(e.target.checked)}
                          className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between py-1 px-1.5 hover:bg-slate-800/60 rounded cursor-pointer text-slate-200">
                        <span className="flex items-center space-x-1.5 text-[11px]">
                          <span>⚠️</span>
                          <span>Active Hazards</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={showHazards}
                          onChange={(e) => setShowHazards(e.target.checked)}
                          className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between py-1 px-1.5 hover:bg-slate-800/60 rounded cursor-pointer text-slate-200">
                        <span className="flex items-center space-x-1.5 text-[11px]">
                          <span>🚨</span>
                          <span>Emergency Beacons ({emergencyMarkers.length})</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={showEmergencyMarkers}
                          onChange={(e) => setShowEmergencyMarkers(e.target.checked)}
                          className="rounded border-slate-700 text-rose-500 focus:ring-0 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between py-1 px-1.5 hover:bg-slate-800/60 rounded cursor-pointer text-slate-200">
                        <span className="flex items-center space-x-1.5 text-[11px]">
                          <span>🗺️</span>
                          <span>Campus Boundary</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={showBoundary}
                          onChange={(e) => setShowBoundary(e.target.checked)}
                          className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Section 1: Academic Classrooms */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleSection('classrooms')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5">
                          <span>📚</span>
                          <span>Academic Classrooms</span>
                        </span>
                        {sectionOpen.classrooms ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                      {sectionOpen.classrooms && (
                        <div className="p-1.5 space-y-1 bg-slate-950/50">
                          {academicBuildings.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => {
                                handleSelectBuilding(b.id, b.lat, b.lng);
                                setShowLayerMenu(false);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-[10.5px] transition-colors flex items-center justify-between cursor-pointer ${
                                selectedBuildingId === b.id
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                              }`}
                            >
                              <span className="truncate">{b.name}</span>
                              <span className="text-[9px] text-slate-500 font-mono flex-shrink-0 ml-1">
                                {BUILDING_ROOMS_MAP[b.id]?.rooms.length || 0} rms
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 2: Facilities & Offices */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleSection('facilities')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5">
                          <span>🏛️</span>
                          <span>Facilities & Offices</span>
                        </span>
                        {sectionOpen.facilities ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                      {sectionOpen.facilities && (
                        <div className="p-1.5 space-y-1 bg-slate-950/50">
                          {facilityBuildings.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => {
                                handleSelectBuilding(b.id, b.lat, b.lng);
                                setShowLayerMenu(false);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-[10.5px] transition-colors flex items-center justify-between cursor-pointer ${
                                selectedBuildingId === b.id
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                              }`}
                            >
                              <span className="truncate">{b.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 3: Pathways */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleSection('pathways')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5">
                          <span>🚶</span>
                          <span>Pathways</span>
                        </span>
                        {sectionOpen.pathways ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                      {sectionOpen.pathways && (
                        <div className="p-1.5 space-y-1 text-[10.5px] text-slate-400 bg-slate-950/50">
                          <div className="px-2 py-1 flex items-center justify-between">
                            <span>Pathway Junctions</span>
                            <span className="text-emerald-400 font-mono">14 nodes</span>
                          </div>
                          <div className="px-2 py-1 flex items-center justify-between">
                            <span>Evacuation Route</span>
                            <span className={isNavigating ? 'text-cyan-400 font-mono font-bold' : 'text-slate-500 font-mono'}>
                              {isNavigating ? 'Active' : 'Standby'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 4: Other Layers */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleSection('other')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5">
                          <span>🗺️</span>
                          <span>Other Layers</span>
                        </span>
                        {sectionOpen.other ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                      {sectionOpen.other && (
                        <div className="p-1.5 space-y-1 text-[10.5px] text-slate-400 bg-slate-950/50">
                          <button
                            onClick={() => {
                              handleSelectBuilding('school_ground', SCHOOL_GROUND_CENTER.lat, SCHOOL_GROUND_CENTER.lng);
                              setShowLayerMenu(false);
                            }}
                            className="w-full text-left px-2 py-1 hover:bg-slate-800/70 hover:text-white rounded text-[10.5px] text-slate-300 cursor-pointer"
                          >
                            School Ground / Central Oval
                          </button>
                          <div className="px-2 py-1 text-slate-400">
                            Campus Boundary Perimeter
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Navigation & View Controls (Bottom-Right, Z-Index 30 — Fully Separated from Map Layers) ── */}
        <div className="absolute bottom-6 right-4 z-30 flex flex-col items-end space-y-2 pointer-events-auto">
          {/* VIEW CONTROLS GROUP */}
          <div className="flex flex-col bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-800">
            <button
              type="button"
              onClick={handleToggle3D}
              className={`w-9 h-9 flex items-center justify-center transition-all cursor-pointer ${
                show3D
                  ? 'text-purple-300 bg-purple-600/30'
                  : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80'
              }`}
              title={show3D ? "Switch to 2D Top-Down View" : "Switch to 3D Isometric View"}
              aria-label="Toggle 3D View"
            >
              <span className="text-xs font-black">3D</span>
            </button>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 transition-all cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Expand className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 transition-all cursor-pointer"
              title="Reset Campus View (Fit Bounds)"
              aria-label="Reset Campus View"
            >
              <Maximize className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.resetNorthPitch()}
              className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 transition-all cursor-pointer"
              title="Reset Bearing to North"
              aria-label="Reset North"
            >
              <Compass className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
            </button>
          </div>

          {/* NAVIGATION CONTROLS GROUP */}
          <div className="flex flex-col bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-800">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 transition-all cursor-pointer"
              title="Zoom In (+)"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 transition-all cursor-pointer"
              title="Zoom Out (−)"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRequestGps}
              className={`w-9 h-9 flex items-center justify-center transition-all cursor-pointer ${
                isGpsMode && userGpsCoord
                  ? 'text-blue-400 bg-blue-500/20'
                  : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80'
              }`}
              title="Locate My Position (GPS)"
              aria-label="Locate GPS"
            >
              <Locate className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Official Blueprint Map Legend (Z-Index 30, Collapsible) ── */}
        <div className="absolute bottom-4 left-4 z-30 pointer-events-auto">
          {isLegendCollapsed ? (
            <button
              onClick={() => setIsLegendCollapsed(false)}
              className="flex items-center space-x-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-2xl text-xs font-bold text-slate-200 hover:text-white hover:border-cyan-500/50 transition-all cursor-pointer"
              title="Expand Blueprint Legend"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>PNHS Blueprint</span>
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-2xl shadow-2xl text-xs space-y-1.5 max-w-[210px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <div className="flex items-center space-x-1.5 text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  <span>PNHS Blueprint</span>
                </div>
                <button
                  onClick={() => setIsLegendCollapsed(true)}
                  className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all cursor-pointer"
                  title="Collapse Legend"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-white shadow flex-shrink-0" />
                <span className="text-slate-200 text-[10px]">Your Location</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-1 bg-emerald-400 rounded-full shadow-[0_0_6px_#34d399] flex-shrink-0" />
                <span className="text-emerald-300 font-bold text-[10px]">Evacuation Escape Route</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded bg-emerald-600/80 border border-emerald-400 flex-shrink-0" />
                <span className="text-slate-200 text-[10px]">School Ground (Assembly Area)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded bg-red-700/90 border border-red-400 flex-shrink-0" />
                <span className="text-slate-200 text-[10px]">Classroom Buildings (SHS/JHS)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded bg-sky-600/90 border border-sky-400 flex-shrink-0" />
                <span className="text-slate-200 text-[10px]">School GYM / Stages</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white flex-shrink-0" />
                <span className="text-amber-300 font-medium text-[10px]">School Gates (In / Out)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white animate-pulse flex-shrink-0" />
                <span className="text-rose-300 font-medium text-[10px]">Hazard Alert Danger Zone</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white animate-ping flex-shrink-0" />
                <span className="text-rose-400 font-bold text-[10px]">Distress Beacon ({emergencyMarkers.length})</span>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════ MAPLIBRE GIS MAP INSTANCE ══════════════ */}
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={{
            longitude: SCHOOL_GROUND_CENTER.lng,
            latitude: SCHOOL_GROUND_CENTER.lat,
            zoom: 17.8,
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

          {/* ── 1. CAMPUS BOUNDARY & PROPERTY PERIMETER ── */}
          {showBoundary && (
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
          )}

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

          {/* ── 4B. SELECTED BUILDING HIGHLIGHT OUTLINE (EMERALD GLOW) ── */}
          {selectedBuildingGeoJSON && (
            <Source id="selected-building-outline-src" type="geojson" data={selectedBuildingGeoJSON}>
              <Layer
                id="selected-building-glow"
                type="line"
                paint={{
                  'line-color': '#10b981',
                  'line-width': 7,
                  'line-opacity': 0.85,
                }}
              />
              <Layer
                id="selected-building-outline"
                type="line"
                paint={{
                  'line-color': '#34d399',
                  'line-width': 3,
                  'line-opacity': 1,
                }}
              />
            </Source>
          )}

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

          {/* ── 7. BUILDING LABELS (ZOOM-DEPENDENT HIERARCHY + SELECTION INTERACTION) ── */}
          {showBuildingLabels &&
            buildingsData.features.map((f: any) => {
              const id = f.properties.id;
              const isSelected = selectedBuildingId === id;

              // Priority 1/2 Major Landmarks & Core Wings
              const isMajor =
                id === 'school_gym' ||
                id === 'stage_gym' ||
                id === 'stage_ground' ||
                id === 'school_ground' ||
                id === 'bcd_building' ||
                id === 'admin_building' ||
                id === 'school_clinic';

              // Zoom LOD Policy:
              // < 16.8: Clean view (no building badges, only Gates/Gym/Oval)
              // 16.8 - 17.5: Major buildings only
              // >= 17.5: All buildings
              if (currentZoom < 16.8 && !isSelected) return null;
              if (currentZoom < 17.5 && !isMajor && !isSelected) return null;

              return (
                <Marker
                  key={f.properties.id}
                  longitude={f.properties.lng}
                  latitude={f.properties.lat}
                  anchor="center"
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectBuilding(f.properties.id, f.properties.lat, f.properties.lng);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-md cursor-pointer border flex items-center space-x-1 backdrop-blur-md max-w-[170px] truncate z-20 transition-all ${
                      isSelected
                        ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/50 shadow-emerald-500/20 scale-105'
                        : 'bg-slate-900/90 border-slate-600/80 text-slate-200 hover:border-cyan-400 hover:text-white'
                    }`}
                    style={{
                      transform: show3D ? 'translateY(-14px)' : 'none',
                    }}
                    title={f.properties.name}
                  >
                    <Building2 className={`w-2.5 h-2.5 flex-shrink-0 ${isSelected ? 'text-emerald-400' : 'text-cyan-400'}`} />
                    <span className="truncate">{f.properties.name}</span>
                  </div>
                </Marker>
              );
            })}

          {/* ── 7B. PNHS CLASSROOM & FACILITY ROOM LABELS (PROGRESSIVE ZOOM HIERARCHY & REVELATION) ── */}
          {CAMPUS_ROOM_LABELS.map((room) => {
            const isParentSelected = Boolean(selectedBuildingId && room.parentBuildingId === selectedBuildingId);

            // Progressive Zoom & Collision Prevention Hierarchy:
            // 1. If building is selected: ALWAYS reveal its rooms with emerald GIS styling!
            // 2. Priority 1 (Gates, Gym, Clinic, Ground): show if showFacilities && zoom >= 16.0
            // 3. Priority 2 (Admin, Library, Guidance, Principal's, Stage, Canteen): show if showFacilities && zoom >= 17.0
            // 4. Priority 4 (Classrooms): ONLY show if:
            //    - isParentSelected is true, OR
            //    - (showRoomLabels is true AND currentZoom >= 18.2)
            if (room.priority === 4 && !isParentSelected && (!showRoomLabels || currentZoom < 18.2)) {
              return null;
            }
            if (room.priority === 2 && !isParentSelected && (!showFacilities || currentZoom < 17.0)) {
              return null;
            }
            if (room.priority === 1 && !showFacilities && !isParentSelected && currentZoom < 16.0) {
              return null;
            }

            let icon = '🏫';
            let badgeClass = isParentSelected
              ? 'bg-slate-900/95 border-emerald-400 text-emerald-200 shadow-md ring-1 ring-emerald-400/50'
              : 'bg-slate-900/90 border-slate-600/70 text-slate-100 shadow-sm';

            if (room.priority === 1) {
              if (room.name.includes('GATE')) icon = '🚪';
              else if (room.name.includes('GYM')) icon = '🏟️';
              else if (room.name.includes('CLINIC')) icon = '🏥';
              else if (room.name.includes('GROUND')) icon = '🛡️';
              badgeClass = 'bg-slate-900/95 border-cyan-400/80 text-cyan-200 font-bold shadow-md';
            } else if (room.priority === 2) {
              if (room.name.includes('LIBRARY')) icon = '📚';
              else if (room.name.includes('OFFICE')) icon = '🏛️';
              else if (room.name.includes('STAGE')) icon = '🎭';
              else if (room.name.includes('CANTEEN')) icon = '☕';
              badgeClass = 'bg-slate-900/90 border-blue-400/60 text-blue-100 font-semibold shadow-sm';
            }

            return (
              <Marker
                key={room.id}
                longitude={room.lng}
                latitude={room.lat}
                anchor="center"
              >
                <div
                  className={`px-1.5 py-0.5 rounded text-[9.5px] border flex items-center space-x-1 backdrop-blur-sm whitespace-nowrap z-20 transition-transform ${badgeClass}`}
                  style={{
                    transform: show3D ? 'translateY(-12px)' : 'none',
                  }}
                  title={room.name}
                >
                  <span className="text-[9.5px]">{icon}</span>
                  <span className="leading-tight font-medium">{room.name}</span>
                </div>
              </Marker>
            );
          })}



          {/* ── 8. CENTRAL EVACUATION ASSEMBLY AREA BADGE (POSITIONED DIRECTLY ON SCHOOL GROUND) ── */}
          <Marker
            longitude={SCHOOL_GROUND_CENTER.lng}
            latitude={SCHOOL_GROUND_CENTER.lat}
            anchor="center"
          >
            <div className="flex flex-col items-center pointer-events-none z-30">
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

          {/* ── 10. USER CURRENT LOCATION / SNAPPED PATHWAY PIN (Z-Index 25) ── */}
          {selectedNode && (
            <Marker longitude={selectedNode.lng} latitude={selectedNode.lat} anchor="center">
              <div className="flex flex-col items-center pointer-events-none z-25">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-10 h-10 rounded-full bg-cyan-400/40 animate-ping" />
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      background: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
                      borderRadius: '50%',
                      border: '2.5px solid white',
                      boxShadow: '0 0 16px rgba(6,182,212,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                    }}
                  >
                    📍
                  </div>
                </div>
                <span className="mt-1 px-2 py-0.5 bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-[9px] font-bold rounded-lg shadow-xl max-w-[160px] truncate">
                  {isGpsMode ? `Snapped (${selectedNode.name})` : `Your Location (${selectedNode.name})`}
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

          {/* ── 11B. REAL-TIME EMERGENCY BEACON MARKERS (SOS & INJURED) ── */}
          {showEmergencyMarkers &&
            emergencyMarkers.map((em) => (
              <Marker
                key={em.id}
                longitude={em.lng}
                latitude={em.lat}
                anchor="center"
              >
                <div
                  className="relative flex items-center justify-center cursor-pointer group z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEmergency(em);
                  }}
                  title={`${em.title}: ${em.name} (${em.role})`}
                >
                  {/* Animated Pulse Ring */}
                  <div
                    className={`absolute w-12 h-12 rounded-full animate-ping opacity-75 ${
                      em.type === 'sos' ? 'bg-rose-600' : 'bg-red-500'
                    }`}
                  />
                  {/* Beacon Core */}
                  <div
                    className={`w-9 h-9 rounded-full border-2 border-white shadow-2xl flex items-center justify-center text-base z-30 transition-transform hover:scale-125 ${
                      em.type === 'sos'
                        ? 'bg-gradient-to-tr from-rose-700 to-red-500 shadow-rose-500/80'
                        : 'bg-gradient-to-tr from-red-600 to-amber-500 shadow-red-500/80'
                    }`}
                  >
                    {em.type === 'sos' ? '🆘' : '🩹'}
                  </div>
                  {/* Floating Badge */}
                  <span
                    className={`absolute -bottom-5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-lg whitespace-nowrap border border-white/40 pointer-events-none ${
                      em.type === 'sos' ? 'bg-rose-950/95 text-rose-200' : 'bg-red-950/95 text-amber-200'
                    }`}
                  >
                    {em.type === 'sos' ? 'SOS' : 'INJURED'} • {em.name.split(' ')[0]}
                  </span>
                </div>
              </Marker>
            ))}

          {/* ── 11C. SELECTED EMERGENCY BEACON DETAIL POPUP (PRIVACY COMPLIANT) ── */}
          {selectedEmergency && (
            <Popup
              longitude={selectedEmergency.lng}
              latitude={selectedEmergency.lat}
              anchor="bottom"
              offset={[0, -20]}
              onClose={() => setSelectedEmergency(null)}
              closeButton={true}
              closeOnClick={false}
            >
              <div className="p-3 min-w-[240px] max-w-[300px] bg-slate-900/98 backdrop-blur-md text-slate-100 rounded-xl border border-rose-500/80 shadow-2xl space-y-2.5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base">{selectedEmergency.type === 'sos' ? '🆘' : '🩹'}</span>
                    <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                      {selectedEmergency.title}
                    </span>
                  </div>
                  {selectedEmergency.priority && (
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {selectedEmergency.priority}
                    </span>
                  )}
                </div>

                {/* Personnel Details (NO EMAIL ADDRESS FOR PRIVACY) */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Name</span>
                    <span className="text-white font-bold">{selectedEmergency.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Role</span>
                    <span className="text-cyan-300 font-semibold capitalize">{selectedEmergency.role}</span>
                  </div>
                  {selectedEmergency.department && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Department</span>
                      <span className="text-slate-200">{selectedEmergency.department}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Reported At</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {new Date(selectedEmergency.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-1">
                    <span className="text-slate-400 font-medium">GPS Location</span>
                    <span className="text-cyan-400 font-mono text-[11px] font-bold">
                      {selectedEmergency.lat.toFixed(6)}, {selectedEmergency.lng.toFixed(6)}
                    </span>
                  </div>
                </div>

                {/* Emergency Message */}
                {selectedEmergency.message && (
                  <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                      Message:
                    </span>
                    <p className="text-xs text-rose-200 font-medium italic">
                      "{selectedEmergency.message}"
                    </p>
                  </div>
                )}

                {/* Dismiss / Acknowledge Button */}
                <button
                  type="button"
                  onClick={() => handleAcknowledgeEmergency(selectedEmergency)}
                  className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-slate-700 flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>Acknowledge & Clear Marker</span>
                </button>
              </div>
            </Popup>
          )}

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

          {/* ── 13. SELECTED BUILDING COMPACT INFO POPUP ── */}
          {selectedBuildingId && selectedBuildingInfo && (
            <Popup
              longitude={selectedBuildingInfo.lng}
              latitude={selectedBuildingInfo.lat}
              anchor="bottom"
              onClose={() => setSelectedBuildingId(null)}
              closeButton={true}
              closeOnClick={false}
              offset={[0, -14]}
            >
              <div className="p-2.5 min-w-[210px] max-w-[270px] bg-slate-900/98 backdrop-blur-md text-slate-100 rounded-xl border border-emerald-500/60 shadow-2xl space-y-2">
                <div className="flex items-center space-x-1.5 border-b border-slate-800 pb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider truncate">
                    {selectedBuildingInfo.name}
                  </span>
                </div>
                {selectedBuildingInfo.rooms.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                      Rooms ({selectedBuildingInfo.rooms.length}):
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-0.5">
                      {selectedBuildingInfo.rooms.map((roomName) => (
                        <span
                          key={roomName}
                          className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-emerald-300 font-mono"
                        >
                          • {roomName}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Primary Campus Landmark</p>
                )}
                <div className="pt-1.5 border-t border-slate-800">
                  <button
                    onClick={() => {
                      const matchingNode = CAMPUS_NODES.find((n) => n.id === selectedBuildingId);
                      if (matchingNode) {
                        setSelectedLocation(selectedBuildingId);
                        if (isNavigating) {
                          calculateEvacuationRoute(selectedBuildingId, selectedDestination);
                        }
                      }
                    }}
                    className="w-full text-center text-[10px] font-bold py-1 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer"
                  >
                    📍 Set as Evacuation Origin
                  </button>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* ══════════════ RIGHT EVACUATION ROUTER & HAZARDS SIDEBAR ══════════════ */}
      {infoPanelOpen && (
        <div
          className="absolute lg:relative right-0 top-0 bottom-0 z-40 w-full sm:w-80 flex-shrink-0 bg-slate-950/95 backdrop-blur-md border-l border-slate-800 flex flex-col overflow-y-auto shadow-2xl transition-all"
          style={{ maxHeight: '100%' }}
        >
          {/* Evacuation Router Header */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-cyan-400">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Emergency Evacuation Router
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInfoPanelOpen(false)}
                className="lg:hidden px-2 py-0.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg text-xs font-semibold"
                title="Close Panel"
              >
                ✕ Close
              </button>
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

          {/* Active Distress Signals Section (Real-Time GPS SOS & Injured) */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm">🚨</span>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Live Distress Signals ({emergencyMarkers.length})
                </span>
              </div>
              <button
                type="button"
                onClick={fetchEmergencyMarkers}
                className="text-slate-400 hover:text-white text-[10px] flex items-center space-x-1 cursor-pointer"
                title="Refresh distress signals"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {emergencyMarkers.length === 0 ? (
              <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>No active distress signals</span>
              </div>
            ) : (
              <div className="space-y-2">
                {emergencyMarkers.map((em) => (
                  <button
                    key={em.id}
                    onClick={() => {
                      setSelectedEmergency(em);
                      mapRef.current?.flyTo({
                        center: [em.lng, em.lat],
                        zoom: 19,
                        duration: 1000,
                      });
                    }}
                    className={`w-full text-left bg-slate-900 border rounded-xl p-2.5 space-y-1 transition-all cursor-pointer ${
                      selectedEmergency?.id === em.id
                        ? 'border-rose-500 bg-rose-950/30'
                        : 'border-slate-800 hover:border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="text-xs">{em.type === 'sos' ? '🆘' : '🩹'}</span>
                        <span className="text-xs font-bold text-white truncate">{em.name}</span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0">
                        {em.type === 'sos' ? 'SOS' : 'INJURED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="capitalize">{em.role}</span>
                      <span className="font-mono text-cyan-400">
                        {em.lat.toFixed(5)}, {em.lng.toFixed(5)}
                      </span>
                    </div>
                    {em.message && (
                      <p className="text-[10px] text-rose-200 line-clamp-1 italic">
                        "{em.message}"
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
