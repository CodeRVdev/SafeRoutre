import fs from 'fs';

// ── POLONULING NATIONAL HIGH SCHOOL GIS CALIBRATION ─────────────────────
// Authoritative Reference Point: 6.2882333 N, 124.9675614 E
// Barangay Polonuling, Tupi, South Cotabato (Plus Code: 6QR67XQ9+43)
const ORIGIN_LAT = 6.2882333;
const ORIGIN_LNG = 124.9675614;

// Meters to degrees conversions at ~6.288 degrees North
const METERS_PER_DEGREE_LAT = 110570;
const METERS_PER_DEGREE_LNG = 110755; // cos(6.288°) * 111320

function offsetToGps(xMeters, yMeters) {
  const lat = ORIGIN_LAT + (yMeters / METERS_PER_DEGREE_LAT);
  const lng = ORIGIN_LNG + (xMeters / METERS_PER_DEGREE_LNG);
  return [lng, lat]; // GeoJSON coordinate order: [longitude, latitude]
}

function createPolygon(centerX, centerY, width, depth, rotationDeg = 0) {
  const halfW = width / 2;
  const halfD = depth / 2;
  const corners = [
    [-halfW, -halfD],
    [halfW, -halfD],
    [halfW, halfD],
    [-halfW, halfD],
    [-halfW, -halfD], // close ring
  ];

  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const coordinates = corners.map(([dx, dy]) => {
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    return offsetToGps(centerX + rx, centerY + ry);
  });

  return {
    type: "Polygon",
    coordinates: [coordinates]
  };
}

// ── 1. CAMPUS BOUNDARY & ROADS ──────────────────────────────────────────
const campusBoundary = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "campus_perimeter",
        name: "Polonuling National High School Campus Grounds",
        type: "boundary"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          offsetToGps(-105, 115),
          offsetToGps(145, 115),
          offsetToGps(165, 80),
          offsetToGps(105, -115),
          offsetToGps(-105, -115),
          offsetToGps(-105, 115)
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "north_road",
        name: "North Provincial Access Road",
        type: "road"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          offsetToGps(-130, 125),
          offsetToGps(160, 125)
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "south_road",
        name: "South Barangay Access Road",
        type: "road"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          offsetToGps(-130, -125),
          offsetToGps(130, -125)
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "east_diagonal_road",
        name: "East Highway Connector",
        type: "road"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          offsetToGps(165, 130),
          offsetToGps(95, -130)
        ]
      }
    }
  ]
};

// ── 2. CENTRAL SCHOOL GROUND & EVACUATION ASSEMBLY AREA ──────────────────
const schoolGround = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "school_ground",
        name: "School Ground (Central Open Field)",
        type: "ground",
        capacity: "3,000 Persons",
        status: "Primary Assembly Area"
      },
      geometry: createPolygon(0, 0, 110, 85)
    },
    {
      type: "Feature",
      properties: {
        id: "evacuation_assembly_oval",
        name: "Evacuation Assembly Area (Designated Safe Zone)",
        type: "assembly_area",
        capacity: "Designated Headcount Staging",
        status: "Safe"
      },
      geometry: createPolygon(0, 0, 75, 55)
    }
  ]
};

// ── 3. DETAILED VECTOR BUILDINGS (FOOTPRINTS & ATTRIBUTES) ───────────────
// Mapped 1-to-1 from the Official Polonuling NHS Evacuation Map
const campusBuildings = [
  // ── TOP ROW (NORTH) ──────────────────────────────────
  {
    id: "shs_north",
    name: "SHS Building (North-West)",
    category: "Senior High School",
    x: -60, y: 90, width: 34, depth: 16, height: 10,
    color: "#b91c1c", roofColor: "#dc2626", strokeColor: "#fca5a5",
    description: "Senior High School Academic Building (North Wing)"
  },
  {
    id: "jhs_north",
    name: "JHS Building (North-Center)",
    category: "Junior High School",
    x: 0, y: 90, width: 42, depth: 16, height: 10,
    color: "#b91c1c", roofColor: "#dc2626", strokeColor: "#fca5a5",
    description: "Junior High School Academic Classrooms"
  },
  {
    id: "school_gym",
    name: "School GYM (Covered Court)",
    category: "Sports & Assembly",
    x: 65, y: 90, width: 50, depth: 26, height: 14,
    color: "#0284c7", roofColor: "#38bdf8", strokeColor: "#bae6fd",
    description: "Campus Multi-Purpose Gymnasium & Evacuation Facility"
  },
  {
    id: "stage_gym",
    name: "Stage (Gymnasium)",
    category: "Gym Stage",
    x: 102, y: 90, width: 16, depth: 20, height: 7,
    color: "#0369a1", roofColor: "#0ea5e9", strokeColor: "#7dd3fc",
    description: "Gymnasium Performance Stage"
  },

  // ── WEST SIDE (LEFT WING) ────────────────────────────
  {
    id: "bcd_building",
    name: "BCD Building",
    category: "Academic & Tech-Voc",
    x: -85, y: 15, width: 16, depth: 68, height: 9,
    color: "#c2410c", roofColor: "#ea580c", strokeColor: "#fdba74",
    description: "BCD Multi-Classroom / Laboratory Wing"
  },
  {
    id: "jhs_west",
    name: "JHS Building (South-West)",
    category: "Junior High School",
    x: -85, y: -45, width: 16, depth: 24, height: 9,
    color: "#b91c1c", roofColor: "#dc2626", strokeColor: "#fca5a5",
    description: "Junior High School Grade Level Building"
  },
  {
    id: "school_clinic",
    name: "School Clinic",
    category: "Medical Services",
    x: -60, y: -80, width: 22, depth: 16, height: 6,
    color: "#059669", roofColor: "#10b981", strokeColor: "#6ee7b7",
    description: "First Aid & Health Emergency Clinic"
  },

  // ── INNER CAMPUS BUILDINGS (AROUND/IN SCHOOL GROUND) ─
  {
    id: "jhs_inner",
    name: "JHS Building (Inner North-West)",
    category: "Junior High School",
    x: -30, y: 50, width: 26, depth: 15, height: 9,
    color: "#b91c1c", roofColor: "#dc2626", strokeColor: "#fca5a5",
    description: "Inner Junior High Classrooms"
  },
  {
    id: "shs_inner",
    name: "SHS Building (Inner North-East)",
    category: "Senior High School",
    x: 30, y: 50, width: 28, depth: 15, height: 9,
    color: "#b91c1c", roofColor: "#dc2626", strokeColor: "#fca5a5",
    description: "Inner Senior High Classrooms"
  },
  {
    id: "kiosk_mortgage",
    name: "Faculty / Support Unit",
    category: "Facility",
    x: -45, y: 15, width: 9, depth: 9, height: 5,
    color: "#b91c1c", roofColor: "#ef4444", strokeColor: "#fca5a5",
    description: "Support Office / Station"
  },
  {
    id: "stationers",
    name: "Stationers",
    category: "Facility",
    x: -30, y: -15, width: 12, depth: 9, height: 5,
    color: "#b91c1c", roofColor: "#ef4444", strokeColor: "#fca5a5",
    description: "School Supply & Stationers"
  },
  {
    id: "treasurer",
    name: "Treasurer Office",
    category: "Administration",
    x: 0, y: -15, width: 16, depth: 10, height: 6,
    color: "#b91c1c", roofColor: "#ef4444", strokeColor: "#fca5a5",
    description: "Financial & Treasurer Department"
  },
  {
    id: "icip",
    name: "ICIP Facility",
    category: "Special Programs",
    x: 35, y: -10, width: 12, depth: 10, height: 6,
    color: "#b91c1c", roofColor: "#ef4444", strokeColor: "#fca5a5",
    description: "Indigenous Cultural Community Program Office"
  },
  {
    id: "water_tank",
    name: "Water Tank & Utility Staging",
    category: "Utility",
    x: 38, y: 15, width: 10, depth: 10, height: 7,
    color: "#475569", roofColor: "#64748b", strokeColor: "#cbd5e1",
    description: "Campus Water Reservoir & Emergency Water Staging"
  },

  // ── SOUTH SIDE (BOTTOM WING) ─────────────────────────
  {
    id: "stage_ground",
    name: "Stage (School Ground)",
    category: "Assembly Stage",
    x: 0, y: -35, width: 34, depth: 14, height: 6,
    color: "#0284c7", roofColor: "#38bdf8", strokeColor: "#bae6fd",
    description: "Open Field Main Stage & Podium"
  },
  {
    id: "shs_south",
    name: "SHS Building (South Wing)",
    category: "Senior High School",
    x: 0, y: -65, width: 46, depth: 16, height: 10,
    color: "#b91c1c", roofColor: "#dc2626", strokeColor: "#fca5a5",
    description: "Senior High School South Academic Classrooms"
  },

  // ── EAST SIDE (RIGHT WING) ───────────────────────────
  {
    id: "jhs_east_top",
    name: "JHS Building (East-Top)",
    category: "Junior High School",
    x: 68, y: 45, width: 16, depth: 25, height: 9,
    color: "#b91c1c", roofColor: "#dc2626", strokeColor: "#fca5a5",
    description: "Junior High School East Wing"
  },
  {
    id: "shs_east_top",
    name: "SHS Building (Far East-Top)",
    category: "Senior High School",
    x: 95, y: 35, width: 15, depth: 25, height: 9,
    color: "#b91c1c", roofColor: "#dc2626", strokeColor: "#fca5a5",
    description: "Senior High School Annex Wing"
  },
  {
    id: "jhs_east_mid",
    name: "JHS Building (East-Mid)",
    category: "Junior High School",
    x: 68, y: 10, width: 16, depth: 22, height: 9,
    color: "#b91c1c", roofColor: "#dc2626", strokeColor: "#fca5a5",
    description: "Junior High Classrooms"
  },
  {
    id: "admin_building",
    name: "ADMIN Building",
    category: "School Administration",
    x: 68, y: -30, width: 16, depth: 28, height: 10,
    color: "#b91c1c", roofColor: "#dc2626", strokeColor: "#fca5a5",
    description: "Principal Office, Registrar & Faculty Headquarters"
  },
  {
    id: "jhs_east_bottom_1",
    name: "JHS Building (East-Bottom 1)",
    category: "Junior High School",
    x: 68, y: -62, width: 15, depth: 12, height: 7,
    color: "#b91c1c", roofColor: "#dc2626", strokeColor: "#fca5a5",
    description: "Junior High Classroom Module"
  },
  {
    id: "jhs_east_bottom_2",
    name: "JHS Building (East-Bottom 2)",
    category: "Junior High School",
    x: 68, y: -80, width: 15, depth: 12, height: 7,
    color: "#b91c1c", roofColor: "#dc2626", strokeColor: "#fca5a5",
    description: "Junior High Classroom Module"
  }
];

const buildingsGeoJSON = {
  type: "FeatureCollection",
  features: campusBuildings.map(b => {
    const center = offsetToGps(b.x, b.y);
    return {
      type: "Feature",
      properties: {
        id: b.id,
        name: b.name,
        category: b.category,
        height: b.height,
        min_height: 0,
        color: b.color,
        roofColor: b.roofColor,
        strokeColor: b.strokeColor,
        description: b.description,
        lng: center[0],
        lat: center[1]
      },
      geometry: createPolygon(b.x, b.y, b.width, b.depth)
    };
  })
};

// ── 4. SCHOOL GATES (POINT & SYMBOL FEATURES) ───────────────────────────
const gates = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "gate_exit",
        name: "School Gate (Exit)",
        type: "gate_exit",
        status: "Open - Designated Exit",
        lng: offsetToGps(0, 115)[0],
        lat: offsetToGps(0, 115)[1]
      },
      geometry: {
        type: "Point",
        coordinates: offsetToGps(0, 115)
      }
    },
    {
      type: "Feature",
      properties: {
        id: "gate_entrance",
        name: "School Gate (Entrance)",
        type: "gate_entrance",
        status: "Open - Main Entrance",
        lng: offsetToGps(0, -115)[0],
        lat: offsetToGps(0, -115)[1]
      },
      geometry: {
        type: "Point",
        coordinates: offsetToGps(0, -115)
      }
    }
  ]
};

// ── 5. WALKABLE PATHWAY NETWORK (ROUTING GRAPH CORRIDORS) ────────────────
// Formed by the dark grey paved corridors on the reference map
const pathwaySegments = [
  // ── PERIMETER LOOP ────────────────────────────────────
  // North Corridor (Between top row and inner school ground)
  { id: "p_north_main", from: [-70, 72], to: [52, 72] },
  { id: "p_north_gym_ext", from: [52, 72], to: [95, 72] },

  // West Corridor (In front of BCD Building)
  { id: "p_west_main_1", from: [-70, 72], to: [-70, 15] },
  { id: "p_west_main_2", from: [-70, 15], to: [-70, -45] },
  { id: "p_west_main_3", from: [-70, -45], to: [-70, -75] },
  { id: "p_west_main_4", from: [-70, -75], to: [-70, -95] },

  // South Corridor (In front of Clinic, Stage, SHS South)
  { id: "p_south_main_1", from: [-70, -95], to: [0, -95] },
  { id: "p_south_main_2", from: [0, -95], to: [52, -95] },

  // East Corridor (In front of JHS & Admin Buildings)
  { id: "p_east_main_1", from: [52, 72], to: [52, 10] },
  { id: "p_east_main_2", from: [52, 10], to: [52, -30] },
  { id: "p_east_main_3", from: [52, -30], to: [52, -65] },
  { id: "p_east_main_4", from: [52, -65], to: [52, -95] },

  // ── GATE CONNECTORS ───────────────────────────────────
  // North Gate Exit link
  { id: "p_gate_exit_link", from: [0, 115], to: [0, 72] },

  // South Gate Entrance link
  { id: "p_gate_entrance_link", from: [0, -115], to: [0, -95] },

  // ── BUILDING CONNECTOR PATHWAYS (CORRIDORS) ───────────
  // BCD Building Exits (multiple doorway spurs)
  { id: "p_bcd_north_exit", from: [-77, 45], to: [-70, 45] },
  { id: "p_bcd_mid_exit", from: [-77, 15], to: [-70, 15] },
  { id: "p_bcd_south_exit", from: [-77, -15], to: [-70, -15] },

  // Top SHS & JHS Exits
  { id: "p_shs_north_exit", from: [-60, 82], to: [-60, 72] },
  { id: "p_jhs_north_exit", from: [0, 82], to: [0, 72] },
  { id: "p_gym_exit", from: [65, 77], to: [65, 72] },

  // Clinic Exit
  { id: "p_clinic_exit", from: [-60, -72], to: [-60, -95] },

  // South SHS Exit
  { id: "p_shs_south_exit", from: [0, -73], to: [0, -95] },

  // East Buildings Exits (JHS & Admin)
  { id: "p_jhs_east_top_exit", from: [60, 45], to: [52, 45] },
  { id: "p_jhs_east_mid_exit", from: [60, 10], to: [52, 10] },
  { id: "p_admin_exit", from: [60, -30], to: [52, -30] },
  { id: "p_jhs_east_bot_exit", from: [60, -70], to: [52, -70] },

  // ── DIRECT ENTRANCES INTO SCHOOL GROUND ASSEMBLY AREA ─
  // West entrances into Oval
  { id: "p_oval_west_north", from: [-70, 45], to: [-45, 45] },
  { id: "p_oval_west_mid", from: [-70, 15], to: [-45, 15] },
  { id: "p_oval_west_south", from: [-70, -15], to: [-45, -15] },

  // North entrance into Oval
  { id: "p_oval_north_mid", from: [0, 72], to: [0, 45] },

  // East entrances into Oval
  { id: "p_oval_east_top", from: [52, 45], to: [30, 45] },
  { id: "p_oval_east_mid", from: [52, 10], to: [30, 10] },
  { id: "p_oval_east_bot", from: [52, -30], to: [30, -30] },

  // South entrance into Oval (beside stage)
  { id: "p_oval_south_left", from: [-30, -95], to: [-30, -45] },
  { id: "p_oval_south_right", from: [30, -95], to: [30, -45] },

  // Internal Oval Convergence to Center Flag / Assembly Point
  { id: "p_oval_int_1", from: [-45, 15], to: [0, 0] },
  { id: "p_oval_int_2", from: [30, 10], to: [0, 0] },
  { id: "p_oval_int_3", from: [0, 45], to: [0, 0] },
  { id: "p_oval_int_4", from: [-30, -45], to: [0, 0] },
  { id: "p_oval_int_5", from: [30, -45], to: [0, 0] }
];

const pathwaysGeoJSON = {
  type: "FeatureCollection",
  features: pathwaySegments.map(p => ({
    type: "Feature",
    properties: {
      id: p.id,
      type: "pathway",
      walkable: true,
      status: "clear"
    },
    geometry: {
      type: "LineString",
      coordinates: [
        offsetToGps(p.from[0], p.from[1]),
        offsetToGps(p.to[0], p.to[1])
      ]
    }
  }))
};

// ── 6. EXPORT GEOJSON & TYPESCRIPT MODULES ──────────────────────────────
fs.writeFileSync('src/components/Map/data/buildings.json', JSON.stringify(buildingsGeoJSON, null, 2));
fs.writeFileSync('src/components/Map/data/gates.json', JSON.stringify(gates, null, 2));
fs.writeFileSync('src/components/Map/data/assembly-areas.json', JSON.stringify(schoolGround, null, 2));
fs.writeFileSync('src/components/Map/data/pathways.json', JSON.stringify(pathwaysGeoJSON, null, 2));
fs.writeFileSync('src/components/Map/data/boundary.json', JSON.stringify(campusBoundary, null, 2));

const fullCampusDataset = {
  type: "FeatureCollection",
  features: [
    ...campusBoundary.features,
    ...schoolGround.features,
    ...buildingsGeoJSON.features,
    ...gates.features,
    ...pathwaysGeoJSON.features
  ]
};

fs.writeFileSync('src/components/Map/data/campus.json', JSON.stringify(fullCampusDataset, null, 2));

const tsCode = `// Auto-generated GIS Dataset for Polonuling National High School
import type { FeatureCollection } from 'geojson';

export const campusBoundaryData: FeatureCollection = ${JSON.stringify(campusBoundary, null, 2)};
export const schoolGroundData: FeatureCollection = ${JSON.stringify(schoolGround, null, 2)};
export const buildingsData: FeatureCollection = ${JSON.stringify(buildingsGeoJSON, null, 2)};
export const gatesData: FeatureCollection = ${JSON.stringify(gates, null, 2)};
export const pathwaysData: FeatureCollection = ${JSON.stringify(pathwaysGeoJSON, null, 2)};
export const fullCampusData: FeatureCollection = ${JSON.stringify(fullCampusDataset, null, 2)};
`;

fs.writeFileSync('src/components/Map/data/campusGeoData.ts', tsCode);
console.log('Polonuling NHS Campus GeoJSON accurately reconstructed from evacuation map.');
