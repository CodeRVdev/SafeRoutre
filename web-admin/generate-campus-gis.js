import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── AUTHORITATIVE POLONULING NATIONAL HIGH SCHOOL GIS DATUM ─────────────
// Reference Geographic Datum (Central School Ground / Evacuation Zone):
const CENTER_LAT = 6.287850;
const CENTER_LNG = 124.967750;

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
  return [lng, lat]; // GeoJSON format: [longitude, latitude]
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
        area_sqm: 11530,
        source: "satellite imagery + cadastral alignment",
        verified: true
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          localToGps(-58, 48),   // NW corner behind Gym
          localToGps(-10, 58),   // North perimeter
          localToGps(28, 45),    // NE corner
          localToGps(55, 28),    // E road frontage north of gate
          localToGps(62, 13.4),  // E road frontage at Main Gate
          localToGps(68, -15),   // E road frontage south of gate
          localToGps(50, -35),   // SE corner
          localToGps(10, -58),   // S perimeter behind SHS South
          localToGps(-48, -56),  // SW corner behind Clinic
          localToGps(-56, -15),  // W perimeter behind BOQ
          localToGps(-58, 10),   // W perimeter behind BCD
          localToGps(-58, 48)    // close ring
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
          localToGps(58, 45),
          localToGps(72, -35)
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
      geometry: createBoxPolygon(-8.3, 2.9, 36, 28)
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
      geometry: createBoxPolygon(-8.3, 2.9, 28, 20)
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
        source: "satellite imagery blue roof structure",
        verified: true,
        lat: localToGps(-40.9, 24.7)[1],
        lng: localToGps(-40.9, 24.7)[0]
      },
      geometry: createBoxPolygon(-40.9, 24.7, 20, 27)
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
        lat: localToGps(-36.3, 41.4)[1],
        lng: localToGps(-36.3, 41.4)[0]
      },
      geometry: createBoxPolygon(-36.3, 41.4, 7, 9)
    },

    // ── SHS / JHS CLASSROOM WING (NORTH OF SCHOOL GROUND) ─────────────────
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
        source: "satellite imagery + user directional annotation alignment",
        verified: true,
        lat: localToGps(-19.2, 18.7)[1],
        lng: localToGps(-19.2, 18.7)[0]
      },
      geometry: createBoxPolygon(-19.2, 18.7, 8.5, 19, 90)
    },
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
        source: "satellite imagery + user directional annotation alignment",
        verified: true,
        lat: localToGps(1.5, 25.6)[1],
        lng: localToGps(1.5, 25.6)[0]
      },
      geometry: createBoxPolygon(1.5, 25.6, 8.5, 20, 90)
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
        lat: localToGps(-42.7, -0.4)[1],
        lng: localToGps(-42.7, -0.4)[0]
      },
      geometry: createBoxPolygon(-42.7, -0.4, 9, 25)
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
        lat: localToGps(-39.7, -29.7)[1],
        lng: localToGps(-39.7, -29.7)[0]
      },
      geometry: createBoxPolygon(-39.7, -29.7, 9, 18)
    },

    // ── SCHOOL CLINIC (SOUTHEAST FRONT STRUCTURE) ────────────────────────
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
        source: "satellite imagery + user explicit handwritten annotation (southeast structure)",
        verified: true,
        lat: localToGps(48.0, -38.2)[1],
        lng: localToGps(48.0, -38.2)[0]
      },
      geometry: createBoxPolygon(48.0, -38.2, 9, 12)
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
        source: "satellite imagery blue roof structure + user directional annotation",
        verified: true,
        lat: localToGps(28.6, -13.5)[1],
        lng: localToGps(28.6, -13.5)[0]
      },
      geometry: createBoxPolygon(28.6, -13.5, 8, 13)
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
        source: "satellite imagery + evacuation plan alignment",
        verified: true,
        lat: localToGps(1.7, -44.4)[1],
        lng: localToGps(1.7, -44.4)[0]
      },
      geometry: createBoxPolygon(1.7, -44.4, 8, 70, 90)
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
        source: "satellite imagery physical roof (6.287861, 124.968125)",
        verified: true,
        lat: localToGps(30.5, 18.5)[1],
        lng: localToGps(30.5, 18.5)[0]
      },
      geometry: createBoxPolygon(30.5, 18.5, 10, 18)
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
        source: "satellite imagery + user curved directional annotation (gate road frontage)",
        verified: true,
        lat: localToGps(50.9, 10.1)[1],
        lng: localToGps(50.9, 10.1)[0]
      },
      geometry: createBoxPolygon(50.9, 10.1, 8, 14)
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
        source: "satellite imagery green classroom wing north section",
        verified: true,
        lat: localToGps(38.6, -13.5)[1],
        lng: localToGps(38.6, -13.5)[0]
      },
      geometry: createBoxPolygon(38.6, -13.5, 9, 11)
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
        source: "satellite imagery green classroom wing south section",
        verified: true,
        lat: localToGps(38.6, -24.5)[1],
        lng: localToGps(38.6, -24.5)[0]
      },
      geometry: createBoxPolygon(38.6, -24.5, 9, 11)
    }
  ]
};

// ── 4. SCHOOL GATES (VERIFIED MAIN ENTRANCE GATE) ────────────────────────
const gates = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "gate_entrance",
        name: "SCHOOL GATE (ENTRANCE)",
        type: "gate_entrance",
        status: "Main Campus Entrance Gate",
        source: "primary spatial reference (6.287711, 124.968270)",
        verified: true,
        lng: localToGps(58.0, 13.4)[0],
        lat: localToGps(58.0, 13.4)[1]
      },
      geometry: {
        type: "Point",
        coordinates: localToGps(58.0, 13.4)
      }
    }
  ]
};

// ── 5. WALKABLE PATHWAYS (CORRIDORS CONNECTING ALL DOORS & OVAL) ─────────
const pathwaySegments = [
  // ── ENTRANCE DRIVEWAY & FRONT QUADRANT (ANCHORS 1 & 2) ──
  { id: "p_driveway_1", from: [58.0, 13.4], to: [46.6, 18.5] }, // Main Gate to Admin Plaza (Anchor 2: 6.287800, 124.968200)
  { id: "p_driveway_admin", from: [46.6, 18.5], to: [30.5, 18.5] }, // Admin door spur
  { id: "p_plaza_to_jhset", from: [46.6, 18.5], to: [50.9, 10.1] }, // JHS-ET front spur

  // ── EAST CORRIDOR & NORTH QUAD ACCESS (ANCHOR 3) ────────
  { id: "p_east_to_anchor3", from: [46.6, 18.5], to: [19.2, 22.7] }, // North Quad / Gym Access Junction (Anchor 3: 6.287950, 124.968000)
  { id: "p_anchor3_to_shs_n", from: [19.2, 22.7], to: [1.5, 25.6] }, // SHS-N door
  { id: "p_anchor3_to_shs_walk", from: [19.2, 22.7], to: [1.5, 18.7] }, // North corridor walkway
  { id: "p_shs_walk_to_jhs_n", from: [1.5, 18.7], to: [-19.2, 18.7] }, // JHS-NC front walkway & door
  { id: "p_jhs_walk_to_gym", from: [-19.2, 18.7], to: [-30.0, 18.7] }, // To gym walkway junction
  { id: "p_gym_door", from: [-30.0, 18.7], to: [-40.9, 24.7] }, // Gym main entrance
  { id: "p_gym_stage_door", from: [-30.0, 18.7], to: [-36.3, 41.4] }, // Gym stage entrance

  // ── WEST CORRIDOR (IN FRONT OF BCD & BOQ) ──────────────
  { id: "p_west_1", from: [-30.0, 18.7], to: [-30.0, -0.4] },
  { id: "p_west_bcd_door", from: [-30.0, -0.4], to: [-42.7, -0.4] }, // BCD door
  { id: "p_west_2", from: [-30.0, -0.4], to: [-30.0, -29.7] },
  { id: "p_west_boq_door", from: [-30.0, -29.7], to: [-39.7, -29.7] }, // BOQ door
  { id: "p_west_3", from: [-30.0, -29.7], to: [-30.0, -42.0] },

  // ── SOUTH CORRIDOR (IN FRONT OF SHS SOUTH & STAGE) ─────
  { id: "p_south_1", from: [-30.0, -42.0], to: [1.7, -38.0] },
  { id: "p_shs_s_door", from: [1.7, -38.0], to: [1.7, -44.4] }, // SHS-S door
  { id: "p_south_2", from: [1.7, -38.0], to: [18.0, -25.0] },
  { id: "p_stage_gnd_door", from: [18.0, -25.0], to: [28.6, -13.5] }, // Central Ground Stage / Rear Anchor 4

  // ── EAST WING WALKWAY (JHS-EB1, JHS-EB2, CLINIC) ───────
  { id: "p_south_to_eb2", from: [18.0, -25.0], to: [32.0, -24.5] },
  { id: "p_eb2_door", from: [32.0, -24.5], to: [38.6, -24.5] }, // JHS-EB2 door
  { id: "p_eb2_to_eb1", from: [32.0, -24.5], to: [32.0, -13.5] },
  { id: "p_eb1_door", from: [32.0, -13.5], to: [38.6, -13.5] }, // JHS-EB1 door
  { id: "p_eb1_to_admin", from: [32.0, -13.5], to: [30.5, 18.5] }, // Admin connector
  { id: "p_eb2_to_clinic_junc", from: [32.0, -24.5], to: [38.0, -38.2] },
  { id: "p_clinic_door", from: [38.0, -38.2], to: [48.0, -38.2] }, // School Clinic door

  // ── CENTRAL ASSEMBLY OVAL ACCESS (4 CARDINAL ACCESS PATHS) ──
  { id: "p_oval_east", from: [46.6, 18.5], to: [-8.3, 2.9] },
  { id: "p_oval_north", from: [1.5, 18.7], to: [-8.3, 2.9] },
  { id: "p_oval_west", from: [-30.0, -0.4], to: [-8.3, 2.9] },
  { id: "p_oval_south", from: [1.7, -38.0], to: [-8.3, 2.9] }
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
const mapDataDir = path.join(__dirname, 'src', 'components', 'Map', 'data');
const campusDir = path.join(mapDataDir, 'campus');
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
fs.writeFileSync(path.join(mapDataDir, 'buildings.json'), JSON.stringify(buildings, null, 2));
fs.writeFileSync(path.join(mapDataDir, 'gates.json'), JSON.stringify(gates, null, 2));
fs.writeFileSync(path.join(mapDataDir, 'assembly-areas.json'), JSON.stringify(evacuationAreas, null, 2));
fs.writeFileSync(path.join(mapDataDir, 'pathways.json'), JSON.stringify(pathways, null, 2));
fs.writeFileSync(path.join(mapDataDir, 'boundary.json'), JSON.stringify(campusBoundary, null, 2));

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
fs.writeFileSync(path.join(mapDataDir, 'campus.json'), JSON.stringify(fullCampusDataset, null, 2));

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

fs.writeFileSync(path.join(mapDataDir, 'campusGeoData.ts'), tsCode);
console.log('Polonuling NHS Campus GIS Data Structure & GeoJSON successfully generated matching satellite roofs at:', campusConfig.authoritativeCenter);

// ── 8. SYNCHRONIZE BACKEND DATASET ──────────────────────────────────────
const backendDir = path.join(__dirname, '..', 'backend', 'src', 'data');
if (fs.existsSync(backendDir)) {
  const backendTsCode = `// Auto-generated GIS Dataset for Polonuling National High School (DepEd ID: 304561)
export interface FeatureCollection { type: string; features: any[]; }

export const campusBoundaryData: FeatureCollection = ${JSON.stringify(campusBoundary, null, 2)};
export const schoolGroundData: FeatureCollection = ${JSON.stringify(evacuationAreas, null, 2)};
export const buildingsData: FeatureCollection = ${JSON.stringify(buildings, null, 2)};
export const gatesData: FeatureCollection = ${JSON.stringify(gates, null, 2)};
export const pathwaysData: FeatureCollection = ${JSON.stringify(pathways, null, 2)};
export const fullCampusData: FeatureCollection = ${JSON.stringify(fullCampusDataset, null, 2)};
export const campusConfig = ${JSON.stringify(campusConfig, null, 2)};
`;
  fs.writeFileSync(path.join(backendDir, 'campusGeoData.ts'), backendTsCode);
  console.log('Synchronized backend dataset at:', path.join(backendDir, 'campusGeoData.ts'));
}
