import * as turf from '@turf/turf';
import { buildingsData, gatesData, pathwaysData } from './data/campusGeoData';

export type NodeType = 'building' | 'junction' | 'gate' | 'evacuation_area' | 'assembly_area';

export interface CampusNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: NodeType;
  category?: string;
  blocked?: boolean;
}

export interface CampusEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
  blocked?: boolean;
}

// ── EXTRACT ALL GRAPH NODES DIRECTLY FROM GEOMETRY ─────────────────────
export const CAMPUS_NODES: CampusNode[] = [
  // Assembly Center
  {
    id: 'oval',
    name: 'School Ground (Evacuation Oval)',
    lat: 6.2882333,
    lng: 124.9675614,
    type: 'evacuation_area',
    category: 'Designated Safe Zone'
  },
  // Extract Buildings
  ...(buildingsData.features as any[]).map((f) => ({
    id: f.properties.id,
    name: f.properties.name,
    lat: f.properties.lat,
    lng: f.properties.lng,
    type: 'building' as NodeType,
    category: f.properties.category
  })),
  // Extract Gates
  ...(gatesData.features as any[]).map((f) => ({
    id: f.properties.id,
    name: f.properties.name,
    lat: f.properties.lat,
    lng: f.properties.lng,
    type: 'gate' as NodeType,
    category: f.properties.type
  }))
];

// ── EXTRACT ALL GRAPH EDGES FROM PATHWAY GEOMETRIES ────────────────────
export const CAMPUS_EDGES: CampusEdge[] = [];

// Helper to find or add junction node
function getNodeNearPoint(coord: [number, number], nameHint?: string): CampusNode {
  const [lng, lat] = coord;
  const p1 = turf.point([lng, lat]);
  let nearest: CampusNode | null = null;
  let minDist = Infinity;

  for (const n of CAMPUS_NODES) {
    const d = turf.distance(p1, turf.point([n.lng, n.lat]), { units: 'meters' });
    if (d < minDist) {
      minDist = d;
      nearest = n;
    }
  }

  // If very close to an existing node (< 4m), link to it
  if (nearest && minDist < 4) {
    return nearest;
  }

  // Otherwise create a discrete junction node
  const junctionId = `jct_${lat.toFixed(6)}_${lng.toFixed(6)}`;
  const existingJct = CAMPUS_NODES.find(n => n.id === junctionId);
  if (existingJct) return existingJct;

  const newJunction: CampusNode = {
    id: junctionId,
    name: nameHint || 'Pathway Junction',
    lat,
    lng,
    type: 'junction'
  };
  CAMPUS_NODES.push(newJunction);
  return newJunction;
}

// Build edges from pathway features
(pathwaysData.features as any[]).forEach((f) => {
  const coords = f.geometry.coordinates;
  const pFrom = coords[0];
  const pTo = coords[1];

  const nodeFrom = getNodeNearPoint(pFrom);
  const nodeTo = getNodeNearPoint(pTo);

  const weight = turf.distance(turf.point(pFrom), turf.point(pTo), { units: 'meters' });

  CAMPUS_EDGES.push({
    id: f.properties.id,
    from: nodeFrom.id,
    to: nodeTo.id,
    weight,
    blocked: false
  });
});

// Also link buildings, gates, and the evacuation oval to nearest pathway junctions
const pathwayJunctions = CAMPUS_NODES.filter(n => n.type === 'junction' || n.type === 'gate');

CAMPUS_NODES.filter(n => n.type === 'building' || n.type === 'evacuation_area' || n.type === 'gate').forEach((entity) => {
  const entityPoint = turf.point([entity.lng, entity.lat]);
  let nearestJct: CampusNode | null = null;
  let minDist = Infinity;

  for (const jct of pathwayJunctions) {
    if (jct.id === entity.id) continue;
    const d = turf.distance(entityPoint, turf.point([jct.lng, jct.lat]), { units: 'meters' });
    if (d < minDist) {
      minDist = d;
      nearestJct = jct;
    }
  }

  if (nearestJct && minDist < 65) {
    CAMPUS_EDGES.push({
      id: `spur_${entity.id}_to_${nearestJct.id}`,
      from: entity.id,
      to: nearestJct.id,
      weight: minDist,
      blocked: false
    });
  }
});

// ── DYNAMIC HAZARD STATE MANAGEMENT ─────────────────────────────────────
const _blockedEdges = new Set<string>();
const _blockedNodes = new Set<string>();

export function blockEdge(edgeId: string): void {
  _blockedEdges.add(edgeId);
}

export function unblockEdge(edgeId: string): void {
  _blockedEdges.delete(edgeId);
}

export function blockNode(nodeId: string): void {
  _blockedNodes.add(nodeId);
}

export function unblockNode(nodeId: string): void {
  _blockedNodes.delete(nodeId);
}

export function clearAllBlocks(): void {
  _blockedEdges.clear();
  _blockedNodes.clear();
}

/**
 * Automatically block any pathway or junction within the hazard radius
 */
export function blockHazardZone(hazardLat: number, hazardLng: number, radiusMeters = 20): string[] {
  const hazardPoint = turf.point([hazardLng, hazardLat]);
  const blockedIds: string[] = [];

  // Block nearby nodes
  for (const n of CAMPUS_NODES) {
    const d = turf.distance(hazardPoint, turf.point([n.lng, n.lat]), { units: 'meters' });
    if (d <= radiusMeters) {
      _blockedNodes.add(n.id);
      blockedIds.push(n.id);
    }
  }

  // Block intersecting pathway edges
  for (const e of CAMPUS_EDGES) {
    const nFrom = CAMPUS_NODES.find(n => n.id === e.from);
    const nTo = CAMPUS_NODES.find(n => n.id === e.to);
    if (!nFrom || !nTo) continue;

    const line = turf.lineString([[nFrom.lng, nFrom.lat], [nTo.lng, nTo.lat]]);
    const distToLine = turf.pointToLineDistance(hazardPoint, line, { units: 'meters' });
    if (distToLine <= radiusMeters) {
      _blockedEdges.add(e.id);
      blockedIds.push(e.id);
    }
  }

  return blockedIds;
}

export interface RouteResult {
  found: boolean;
  path: CampusNode[];
  totalDistance: number;
  estimatedSeconds: number;
  hazardsAvoidedCount?: number;
  isHazardRerouted?: boolean;
}

// ── A* EVACUATION ROUTING ENGINE ────────────────────────────────────────
export function findEvacuationRoute(
  startNodeId: string,
  targetNodeId = 'oval'
): RouteResult {
  const nodeMap = new Map<string, CampusNode>();
  for (const n of CAMPUS_NODES) nodeMap.set(n.id, n);

  const start = nodeMap.get(startNodeId);
  const target = nodeMap.get(targetNodeId);
  if (!start || !target) {
    return {
      found: false,
      path: [],
      totalDistance: 0,
      estimatedSeconds: 0,
      hazardsAvoidedCount: 0,
      isHazardRerouted: false,
    };
  }

  // Internal A* runner
  const runAStar = (useBlocks: boolean) => {
    const adj = new Map<string, { neighbor: string; weight: number }[]>();
    for (const n of CAMPUS_NODES) adj.set(n.id, []);

    for (const e of CAMPUS_EDGES) {
      if (useBlocks) {
        if (_blockedEdges.has(e.id)) continue;
        if ((_blockedNodes.has(e.from) && e.from !== startNodeId) || (_blockedNodes.has(e.to) && e.to !== startNodeId)) continue;
      }
      adj.get(e.from)?.push({ neighbor: e.to, weight: e.weight });
      adj.get(e.to)?.push({ neighbor: e.from, weight: e.weight });
    }

    const h = (id: string) => {
      const n = nodeMap.get(id)!;
      return turf.distance(turf.point([n.lng, n.lat]), turf.point([target.lng, target.lat]), { units: 'meters' });
    };

    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const cameFrom = new Map<string, string>();
    const openSet = new Set<string>();

    for (const n of CAMPUS_NODES) {
      gScore.set(n.id, Infinity);
      fScore.set(n.id, Infinity);
    }
    gScore.set(startNodeId, 0);
    fScore.set(startNodeId, h(startNodeId));
    openSet.add(startNodeId);

    while (openSet.size > 0) {
      let current = '';
      let lowestF = Infinity;
      for (const id of openSet) {
        const f = fScore.get(id) ?? Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = id;
        }
      }

      if (current === targetNodeId) {
        const path: CampusNode[] = [];
        let c = current;
        while (c) {
          path.unshift(nodeMap.get(c)!);
          c = cameFrom.get(c) ?? '';
        }
        return { path, distance: gScore.get(targetNodeId) ?? 0 };
      }

      openSet.delete(current);
      const neighbors = adj.get(current) ?? [];

      for (const edge of neighbors) {
        const tentativeG = (gScore.get(current) ?? Infinity) + edge.weight;
        if (tentativeG < (gScore.get(edge.neighbor) ?? Infinity)) {
          cameFrom.set(edge.neighbor, current);
          gScore.set(edge.neighbor, tentativeG);
          fScore.set(edge.neighbor, tentativeG + h(edge.neighbor));
          openSet.add(edge.neighbor);
        }
      }
    }

    return null;
  };

  // 1. Run baseline (unblocked) A*
  const baseline = runAStar(false);

  // 2. Run safe (hazard-blocked) A*
  const safe = runAStar(true);

  if (!safe) {
    return {
      found: false,
      path: [],
      totalDistance: 0,
      estimatedSeconds: 0,
      hazardsAvoidedCount: 0,
      isHazardRerouted: false,
    };
  }

  // 3. Determine if baseline was affected by active hazard blocks
  let isHazardRerouted = false;
  let hazardsAvoidedCount = 0;

  if (baseline && (_blockedNodes.size > 0 || _blockedEdges.size > 0)) {
    let baselineBlocked = false;
    for (const node of baseline.path) {
      if (_blockedNodes.has(node.id) && node.id !== startNodeId) {
        baselineBlocked = true;
        break;
      }
    }
    if (!baselineBlocked) {
      for (let i = 0; i < baseline.path.length - 1; i++) {
        const from = baseline.path[i].id;
        const to = baseline.path[i + 1].id;
        const edge = CAMPUS_EDGES.find(e => (e.from === from && e.to === to) || (e.from === to && e.to === from));
        if (edge && _blockedEdges.has(edge.id)) {
          baselineBlocked = true;
          break;
        }
      }
    }

    if (baselineBlocked) {
      isHazardRerouted = true;
      hazardsAvoidedCount = 1;
    }
  }

  // Calculate actual physical walking distance along path nodes
  let physicalDistance = 0;
  for (let i = 0; i < safe.path.length - 1; i++) {
    const p1 = turf.point([safe.path[i].lng, safe.path[i].lat]);
    const p2 = turf.point([safe.path[i + 1].lng, safe.path[i + 1].lat]);
    physicalDistance += turf.distance(p1, p2, { units: 'meters' });
  }
  const totalDistance = Math.max(1, Math.round(physicalDistance));
  const estimatedSeconds = Math.round(totalDistance / 1.3);

  return {
    found: true,
    path: safe.path,
    totalDistance,
    estimatedSeconds,
    hazardsAvoidedCount,
    isHazardRerouted,
  };
}

/**
 * Snaps GPS coordinates strictly to the nearest walkable pathway junction or gate.
 * Never snaps directly to buildings.
 */
export function findNearestNodeToGps(lat: number, lng: number): CampusNode {
  const target = turf.point([lng, lat]);
  // Exclusively search walkable junctions and gates
  const walkableCandidates = CAMPUS_NODES.filter(n => n.type === 'junction' || n.type === 'gate');
  
  let nearest = walkableCandidates[0] || CAMPUS_NODES[0];
  let minDist = Infinity;
  for (const n of walkableCandidates) {
    const d = turf.distance(turf.point([n.lng, n.lat]), target, { units: 'meters' });
    if (d < minDist) {
      minDist = d;
      nearest = n;
    }
  }
  return nearest;
}
