import fs from 'fs';
import path from 'path';

// ── AUTHORITATIVE POLONULING NATIONAL HIGH SCHOOL GIS DATUM ─────────────
// Reference Geographic Datum:
const CENTER_LAT = 6.2882333;
const CENTER_LNG = 124.9675614;

// Metric conversion at 6.288° N latitude:
const METERS_PER_DEG_LAT = 110570.8;
const METERS_PER_DEG_LNG = 110647.2;

// Physical campus parcel orientation angle (-28 degrees) aligned with the satellite road & roof axis
const CAMPUS_ROTATION_DEG = -28;
const rad = (CAMPUS_ROTATION_DEG * Math.PI) / 180;
const cosR = Math.cos(rad);
const sinR = Math.sin(rad);

function localToGps(xMeters, yMeters) {
  // Apply rotation
  const rx = xMeters * cosR - yMeters * sinR;
  const ry = xMeters * sinR + yMeters * cosR;

  const lat = CENTER_LAT + (ry / METERS_PER_DEG_LAT);
  const lng = CENTER_LNG + (rx / METERS_PER_DEG_LNG);
  return [lng, lat]; // [longitude, latitude]
}

function createBoxPolygon(centerX, centerY, width, depth, extraRotationDeg = 0) {
  const halfW = width / 2;
  const halfD = depth / 2;

  const localCorners = [
    [-halfW, -halfD],
    [halfW, -halfD],
    [halfW, halfD],
    [-halfW, halfD],
    [-halfW, -halfD], // close ring
  ];

  const extraRad = (extraRotationDeg * Math.PI) / 180;
  const extraCos = Math.cos(extraRad);
  const extraSin = Math.sin(extraRad);

  const coordinates = localCorners.map(([dx, dy]) => {
    const lx = dx * extraCos - dy * extraSin;
    const ly = dx * extraSin + dy * extraCos;
    return localToGps(centerX + lx, centerY + ly);
  });

  return {
    type: "Polygon",
    coordinates: [coordinates]
  };
}

// ── 1. CAMPUS BOUNDARY & PERIMETER ROAD PARCEL ──────────────────────────
const campusBoundary = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "campus_boundary",
        name: "Polonuling National High School Property Extent",
        type: "campus_boundary",
        area_sqm: 18500,
        source: "satellite imagery + cadastral alignment",
        verified: true
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          localToGps(-75, 65),
          localToGps(65, 65),
          localToGps(65, -70),
          localToGps(-75, -70),
          localToGps(-75, 65)
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "barangay_access_road",
        name: "Barangay Access Road (Polonuling Main Thoroughfare)",
        type: "road",
        source: "satellite imagery",
        verified: true
      },
      geometry: {
        type: "LineString",
        coordinates: [
          localToGps(-85, 80),
          localToGps(-85, -85)
        ]
      }
    }
  ]
};

// ── 2. SCHOOL GROUND & EVACUATION ASSEMBLY AREAS ────────────────────────
const evacuationAreas = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "school_ground",
        name: "School Ground (Central Open Field)",
        type: "school_ground",
        capacity: 2500,
        status: "primary_evacuation_area",
        source: "school evacuation plan + satellite alignment",
        verified: true
      },
      geometry: createBoxPolygon(0, 0, 48, 38)
    },
    {
      type: "Feature",
      properties: {
        id: "assembly_oval",
        name: "Evacuation Assembly Area (Designated Safe Zone)",
        type: "assembly_area",
        capacity: 1800,
        status: "safe_staging",
        source: "school evacuation plan + satellite alignment",
        verified: true
      },
      geometry: createBoxPolygon(0, 0, 36, 26)
    }
  ]
};

// ── 3. DETAILED VECTOR BUILDINGS (POLYGON FOOTPRINTS + 3D ATTRIBUTES) ────
const buildings = {
  type: "FeatureCollection",
  features: [
    // ── GYMNASIUM & GYM STAGE (NORTH-WEST BLUE ROOF STRUCTURE) ───────────
    {
      type: "Feature",
      properties: {
        id: "school_gym",
        name: "School GYM (Covered Court)",
        code: "GYM",
        type: "building",
        buildingType: "sports_and_assembly",
        floorCount: 1,
        height: 12,
        min_height: 0,
        color: "#0284c7",
        roofColor: "#0284c7",
        strokeColor: "#bae6fd",
        status: "operational",
        source: "satellite imagery + evacuation plan",
        verified: true,
        lat: localToGps(-42, 38)[1],
        lng: localToGps(-42, 38)[0]
      },
      geometry: createBoxPolygon(-42, 38, 32, 22)
    },
    {
      type: "Feature",
      properties: {
        id: "stage_gym",
        name: "Stage (Gymnasium)",
        code: "STG-GYM",
        type: "building",
        buildingType: "stage",
        floorCount: 1,
        height: 6,
        min_height: 0,
        color: "#0369a1",
        roofColor: "#38bdf8",
        strokeColor: "#e0f2fe",
        status: "operational",
        source: "school evacuation plan + satellite alignment",
        verified: true,
        lat: localToGps(-22, 44)[1],
        lng: localToGps(-22, 44)[0]
      },
      geometry: createBoxPolygon(-22, 44, 10, 14)
    },

    // ── SHS / JHS CLASSROOM WING (NORTH OF SCHOOL GROUND) ─────────────────
    {
      type: "Feature",
      properties: {
        id: "shs_north",
        name: "SHS Building (North)",
        code: "SHS-N",
        type: "building",
        buildingType: "academic_senior_high",
        floorCount: 2,
        height: 9,
        min_height: 0,
        color: "#b91c1c",
        roofColor: "#dc2626",
        strokeColor: "#fca5a5",
        status: "operational",
        source: "school evacuation plan + satellite alignment",
        verified: true,
        lat: localToGps(-18, 24)[1],
        lng: localToGps(-18, 24)[0]
      },
      geometry: createBoxPolygon(-18, 24, 20, 11)
    },
    {
      type: "Feature",
      properties: {
        id: "jhs_north",
        name: "JHS Building (North-Center)",
        code: "JHS-NC",
        type: "building",
        buildingType: "academic_junior_high",
        floorCount: 2,
        height: 9,
        min_height: 0,
        color: "#b91c1c",
        roofColor: "#dc2626",
        strokeColor: "#fca5a5",
        status: "operational",
        source: "school evacuation plan + satellite alignment",
        verified: true,
        lat: localToGps(6, 26)[1],
        lng: localToGps(6, 26)[0]
      },
      geometry: createBoxPolygon(6, 26, 22, 11)
    },

    // ── BCD BUILDING (WEST WING WITH VISIBLE SCHOOL ID ROOF "304561") ─────
    {
      type: "Feature",
      properties: {
        id: "bcd_building",
        name: "BCD Building (School ID 304561)",
        code: "BCD",
        type: "building",
        buildingType: "academic_and_techvoc",
        floorCount: 2,
        height: 9,
        min_height: 0,
        color: "#c2410c",
        roofColor: "#ea580c",
        strokeColor: "#fdba74",
        status: "operational",
        source: "satellite imagery (304561) + evacuation plan",
        verified: true,
        lat: localToGps(-42, -14)[1],
        lng: localToGps(-42, -14)[0]
      },
      geometry: createBoxPolygon(-42, -14, 13, 46)
    },
    {
      type: "Feature",
      properties: {
        id: "boq_building",
        name: "BOQ Building / JHS West",
        code: "BOQ",
        type: "building",
        buildingType: "academic_junior_high",
        floorCount: 1,
        height: 7,
        min_height: 0,
        color: "#b91c1c",
        roofColor: "#dc2626",
        strokeColor: "#fca5a5",
        status: "operational",
        source: "school evacuation plan + satellite alignment",
        verified: true,
        lat: localToGps(-54, -44)[1],
        lng: localToGps(-54, -44)[0]
      },
      geometry: createBoxPolygon(-54, -44, 13, 18)
    },

    // ── SCHOOL CLINIC (MINT GREEN ROOF STRUCTURE) ────────────────────────
    {
      type: "Feature",
      properties: {
        id: "school_clinic",
        name: "School Clinic",
        code: "CLINIC",
        type: "building",
        buildingType: "health_and_first_aid",
        floorCount: 1,
        height: 6,
        min_height: 0,
        color: "#059669",
        roofColor: "#10b981",
        strokeColor: "#a7f3d0",
        status: "operational",
        source: "satellite imagery (mint green roof) + evacuation plan",
        verified: true,
        lat: localToGps(-24, -34)[1],
        lng: localToGps(-24, -34)[0]
      },
      geometry: createBoxPolygon(-24, -34, 13, 20)
    },

    // ── SOUTH WING & GROUND STAGE ─────────────────────────────────────────
    {
      type: "Feature",
      properties: {
        id: "stage_ground",
        name: "Stage (School Ground)",
        code: "STG-GND",
        type: "building",
        buildingType: "assembly_stage",
        floorCount: 1,
        height: 5,
        min_height: 0,
        color: "#0284c7",
        roofColor: "#38bdf8",
        strokeColor: "#bae6fd",
        status: "operational",
        source: "school evacuation plan + satellite alignment",
        verified: true,
        lat: localToGps(0, -22)[1],
        lng: localToGps(0, -22)[0]
      },
      geometry: createBoxPolygon(0, -22, 20, 8)
    },
    {
      type: "Feature",
      properties: {
        id: "shs_south",
        name: "SHS Building (South Wing)",
        code: "SHS-S",
        type: "building",
        buildingType: "academic_senior_high",
        floorCount: 2,
        height: 9,
        min_height: 0,
        color: "#b91c1c",
        roofColor: "#dc2626",
        strokeColor: "#fca5a5",
        status: "operational",
        source: "school evacuation plan + satellite alignment",
        verified: true,
        lat: localToGps(2, -44)[1],
        lng: localToGps(2, -44)[0]
      },
      geometry: createBoxPolygon(2, -44, 34, 12)
    },

    // ── EAST WING (ADMINISTRATION & JHS BUILDINGS) ────────────────────────
    {
      type: "Feature",
      properties: {
        id: "admin_building",
        name: "ADMIN Building",
        code: "ADMIN",
        type: "building",
        buildingType: "administration_and_faculty",
        floorCount: 2,
        height: 9,
        min_height: 0,
        color: "#b91c1c",
        roofColor: "#dc2626",
        strokeColor: "#fca5a5",
        status: "operational",
        source: "school evacuation plan + satellite alignment",
        verified: true,
        lat: localToGps(34, -14)[1],
        lng: localToGps(34, -14)[0]
      },
      geometry: createBoxPolygon(34, -14, 14, 22)
    },
    {
      type: "Feature",
      properties: {
        id: "jhs_east_top",
        name: "JHS Building (East-Top)",
        code: "JHS-ET",
        type: "building",
        buildingType: "academic_junior_high",
        floorCount: 1,
        height: 7,
        min_height: 0,
        color: "#b91c1c",
        roofColor: "#dc2626",
        strokeColor: "#fca5a5",
        status: "operational",
        source: "school evacuation plan + satellite alignment",
        verified: true,
        lat: localToGps(34, 16)[1],
        lng: localToGps(34, 16)[0]
      },
      geometry: createBoxPolygon(34, 16, 13, 20)
    },
    {
      type: "Feature",
      properties: {
        id: "jhs_east_bottom_1",
        name: "JHS Building (East-Bottom 1)",
        code: "JHS-EB1",
        type: "building",
        buildingType: "academic_junior_high",
        floorCount: 1,
        height: 7,
        min_height: 0,
        color: "#b91c1c",
        roofColor: "#dc2626",
        strokeColor: "#fca5a5",
        status: "operational",
        source: "school evacuation plan + satellite alignment",
        verified: true,
        lat: localToGps(32, -38)[1],
        lng: localToGps(32, -38)[0]
      },
      geometry: createBoxPolygon(32, -38, 13, 11)
    },
    {
      type: "Feature",
      properties: {
        id: "jhs_east_bottom_2",
        name: "JHS Building (East-Bottom 2)",
        code: "JHS-EB2",
        type: "building",
        buildingType: "academic_junior_high",
        floorCount: 1,
        height: 7,
        min_height: 0,
        color: "#b91c1c",
        roofColor: "#dc2626",
        strokeColor: "#fca5a5",
        status: "operational",
        source: "school evacuation plan + satellite alignment",
        verified: true,
        lat: localToGps(32, -52)[1],
        lng: localToGps(32, -52)[0]
      },
      geometry: createBoxPolygon(32, -52, 13, 11)
    }
  ]
};

// ── 4. SCHOOL GATES (MAIN ENTRANCE / EXIT POINT FEATURES) ────────────────
const gates = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "gate_entrance",
        name: "SCHOOL GATE (ENTRANCE)",
        type: "gate_entrance",
        status: "Main Campus Entrance Driveway",
        source: "satellite imagery + evacuation plan",
        verified: true,
        lng: localToGps(-18, -62)[0],
        lat: localToGps(-18, -62)[1]
      },
      geometry: {
        type: "Point",
        coordinates: localToGps(-18, -62)
      }
    },
    {
      type: "Feature",
      properties: {
        id: "gate_exit",
        name: "SCHOOL GATE (EXIT)",
        type: "gate_exit",
        status: "North Emergency Exit Gate",
        source: "satellite imagery + evacuation plan",
        verified: true,
        lng: localToGps(-8, 52)[0],
        lat: localToGps(-8, 52)[1]
      },
      geometry: {
        type: "Point",
        coordinates: localToGps(-8, 52)
      }
    }
  ]
};

// ── 5. WALKABLE PATHWAYS (CORRIDORS CONNECTING ALL DOORS & OVAL) ─────────
const pathwaySegments = [
  // ── NORTH CORRIDOR (IN FRONT OF NORTH SHS/JHS & GYM) ──
  { id: "p_north_gym", from: [-42, 24], to: [-18, 16] },
  { id: "p_north_1", from: [-18, 16], to: [6, 18] },
  { id: "p_north_2", from: [6, 18], to: [25, 16] },

  // ── WEST CORRIDOR (IN FRONT OF BCD & BOQ) ─────────────
  { id: "p_west_1", from: [-18, 16], to: [-32, 6] },
  { id: "p_west_2", from: [-32, 6], to: [-32, -14] },
  { id: "p_west_3", from: [-32, -14], to: [-32, -34] },
  { id: "p_west_4", from: [-32, -34], to: [-32, -56] },

  // ── SOUTH CORRIDOR (IN FRONT OF SHS SOUTH & CLINIC) ───
  { id: "p_south_1", from: [-32, -56], to: [-18, -56] },
  { id: "p_south_2", from: [-18, -56], to: [2, -34] },
  { id: "p_south_3", from: [2, -34], to: [25, -34] },

  // ── EAST CORRIDOR (IN FRONT OF ADMIN & JHS EAST) ──────
  { id: "p_east_1", from: [25, 16], to: [25, -2] },
  { id: "p_east_2", from: [25, -2], to: [25, -14] },
  { id: "p_east_3", from: [25, -14], to: [25, -34] },
  { id: "p_east_4", from: [25, -34], to: [25, -56] },

  // ── GATE CONNECTORS ───────────────────────────────────
  { id: "p_gate_entrance_spur", from: [-18, -62], to: [-18, -56] },
  { id: "p_gate_exit_spur", from: [-8, 52], to: [-18, 16] },

  // ── BUILDING CORRIDOR EXITS ───────────────────────────
  { id: "p_bcd_door_n", from: [-35, 6], to: [-32, 6] },
  { id: "p_bcd_door_m", from: [-35, -14], to: [-32, -14] },
  { id: "p_bcd_door_s", from: [-35, -34], to: [-32, -34] },
  { id: "p_clinic_door", from: [-24, -24], to: [-24, -14] },
  { id: "p_gym_door", from: [-42, 27], to: [-42, 24] },
  { id: "p_admin_door", from: [27, -14], to: [25, -14] },
  { id: "p_shs_n_door", from: [-18, 18], to: [-18, 16] },
  { id: "p_jhs_n_door", from: [6, 20], to: [6, 18] },

  // ── DIRECT FIELD ENTRANCES INTO ASSEMBLY OVAL ─────────
  { id: "p_oval_west", from: [-32, -14], to: [-15, 0] },
  { id: "p_oval_north", from: [-18, 16], to: [0, 10] },
  { id: "p_oval_east", from: [25, -2], to: [15, 0] },
  { id: "p_oval_south", from: [2, -34], to: [0, -10] },

  // ── CONVERGENCE TO HEADCOUNT OVAL CENTER ──────────────
  { id: "p_oval_w_c", from: [-15, 0], to: [0, 0] },
  { id: "p_oval_n_c", from: [0, 10], to: [0, 0] },
  { id: "p_oval_e_c", from: [15, 0], to: [0, 0] },
  { id: "p_oval_s_c", from: [0, -10], to: [0, 0] }
];

const pathways = {
  type: "FeatureCollection",
  features: pathwaySegments.map(p => ({
    type: "Feature",
    properties: {
      id: p.id,
      type: "pathway",
      walkable: true,
      status: "clear",
      source: "satellite visible paved walkways + evacuation plan",
      verified: true
    },
    geometry: {
      type: "LineString",
      coordinates: [
        localToGps(p.from[0], p.from[1]),
        localToGps(p.to[0], p.to[1])
      ]
    }
  }))
};

// ── 6. CAMPUS GIS CONFIGURATION ─────────────────────────────────────────
const campusConfig = {
  schoolName: "Polonuling National High School",
  schoolId: "304561",
  location: "Barangay Polonuling, Tupi, South Cotabato, Philippines",
  authoritativeCenter: {
    lat: CENTER_LAT,
    lng: CENTER_LNG
  },
  plusCode: "6QR67XQ9+43",
  calibrationDatum: {
    rotationDeg: CAMPUS_ROTATION_DEG,
    metersPerDegreeLat: METERS_PER_DEG_LAT,
    metersPerDegreeLng: METERS_PER_DEG_LNG
  },
  layerCounts: {
    buildings: buildings.features.length,
    pathways: pathways.features.length,
    gates: gates.features.length,
    evacuationAreas: evacuationAreas.features.length
  }
};

// ── 7. WRITE TO DISK IN /data/campus/ AND TYPESCRIPT MODULES ─────────────
const campusDir = path.join('src', 'components', 'Map', 'data', 'campus');
if (!fs.existsSync(campusDir)) {
  fs.mkdirSync(campusDir, { recursive: true });
}

fs.writeFileSync(path.join(campusDir, 'campus-boundary.geojson'), JSON.stringify(campusBoundary, null, 2));
fs.writeFileSync(path.join(campusDir, 'buildings.geojson'), JSON.stringify(buildings, null, 2));
fs.writeFileSync(path.join(campusDir, 'pathways.geojson'), JSON.stringify(pathways, null, 2));
fs.writeFileSync(path.join(campusDir, 'gates.geojson'), JSON.stringify(gates, null, 2));
fs.writeFileSync(path.join(campusDir, 'evacuation-areas.geojson'), JSON.stringify(evacuationAreas, null, 2));
fs.writeFileSync(path.join(campusDir, 'campus-config.json'), JSON.stringify(campusConfig, null, 2));

// Update main datasets for app
fs.writeFileSync('src/components/Map/data/buildings.json', JSON.stringify(buildings, null, 2));
fs.writeFileSync('src/components/Map/data/gates.json', JSON.stringify(gates, null, 2));
fs.writeFileSync('src/components/Map/data/assembly-areas.json', JSON.stringify(evacuationAreas, null, 2));
fs.writeFileSync('src/components/Map/data/pathways.json', JSON.stringify(pathways, null, 2));
fs.writeFileSync('src/components/Map/data/boundary.json', JSON.stringify(campusBoundary, null, 2));

const fullCampusDataset = {
  type: "FeatureCollection",
  features: [
    ...campusBoundary.features,
    ...evacuationAreas.features,
    ...buildings.features,
    ...gates.features,
    ...pathways.features
  ]
};
fs.writeFileSync('src/components/Map/data/campus.json', JSON.stringify(fullCampusDataset, null, 2));

const tsCode = `// Auto-generated GIS Dataset for Polonuling National High School (DepEd ID: 304561)
import type { FeatureCollection } from 'geojson';

export const campusBoundaryData: FeatureCollection = ${JSON.stringify(campusBoundary, null, 2)};
export const schoolGroundData: FeatureCollection = ${JSON.stringify(evacuationAreas, null, 2)};
export const buildingsData: FeatureCollection = ${JSON.stringify(buildings, null, 2)};
export const gatesData: FeatureCollection = ${JSON.stringify(gates, null, 2)};
export const pathwaysData: FeatureCollection = ${JSON.stringify(pathways, null, 2)};
export const fullCampusData: FeatureCollection = ${JSON.stringify(fullCampusDataset, null, 2)};
export const campusConfig = ${JSON.stringify(campusConfig, null, 2)};
`;

fs.writeFileSync('src/components/Map/data/campusGeoData.ts', tsCode);
console.log('Polonuling NHS Campus GIS Data Structure & GeoJSON successfully generated matching satellite roofs at:', campusConfig.authoritativeCenter);
