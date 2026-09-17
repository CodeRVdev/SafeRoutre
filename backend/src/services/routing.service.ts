import pool from '../config/db';
import {
  buildingsData,
  gatesData,
  schoolGroundData,
  pathwaysData,
} from '../data/campusGeoData';

// Authoritative School Center
export const POLONULING_CAMPUS_CENTER = {
  lat: 6.2882333,
  lng: 124.9675614,
  name: 'Polonuling National High School',
};

// Standardized Hazard Radius Definition
export const HAZARD_RADII: Record<string, number> = {
  critical: 30, // 30 meters
  high: 25,     // 25 meters
  moderate: 20, // 20 meters
  low: 15,      // 15 meters
  default: 20,
};

export function getHazardRadius(severity?: string): number {
  if (!severity) return HAZARD_RADII.default;
  const s = severity.toLowerCase();
  return HAZARD_RADII[s] || HAZARD_RADII.default;
}

// Great-circle Haversine Distance in meters
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Minimum distance from point P to line segment AB in meters
export function distanceToSegmentMeters(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const l2 = (bLat - aLat) * (bLat - aLat) + (bLng - aLng) * (bLng - aLng);
  if (l2 === 0) return haversineMeters(pLat, pLng, aLat, aLng);
  let t = ((pLat - aLat) * (bLat - aLat) + (pLng - aLng) * (bLng - aLng)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projLat = aLat + t * (bLat - aLat);
  const projLng = aLng + t * (bLng - aLng);
  return haversineMeters(pLat, pLng, projLat, projLng);
}

export interface CampusNode {
  id: string;
  name: string;
  type: 'building' | 'gate' | 'oval' | 'junction';
  lat: number;
  lng: number;
}

export interface CampusEdge {
  from: string;
  to: string;
  distance: number; // in meters
}

export interface ActiveHazardItem {
  hazard_id: number;
  type: string;
  severity: string;
  radius_meters: number;
  lat: number;
  lng: number;
}

export interface SafePathResponse {
  success: boolean;
  route: {
    geometry: {
      type: 'LineString';
      coordinates: [number, number][]; // GeoJSON [lng, lat]
    };
    distanceMeters: number;
    estimatedWalkingMinutes: number;
    estimatedSeconds: number;
    origin: {
      id: string;
      name: string;
      type: string;
      coordinates: [number, number]; // [lng, lat]
    };
    destination: {
      id: string;
      name: string;
      type: string;
      center: [number, number]; // [lng, lat]
    };
    isHazardRerouted: boolean;
    hazardsAvoided: ActiveHazardItem[];
    hazardsAvoidedCount: number;
    pathNodes: {
      id: string;
      name: string;
      type: string;
      lat: number;
      lng: number;
    }[];
    status: 'recommended' | 'safest_hazard_aware' | 'no_route_available';
  } | null;
  // Backwards compatibility fields for mobile app
  destination_zone?: {
    zone_id: number;
    name: string;
    type: string;
    center: [number, number]; // [lat, lng]
  };
  distance_meters?: number;
  estimated_duration_minutes?: number;
  route_waypoints?: [number, number][]; // [lat, lng]
  hazards_to_avoid?: {
    hazard_id: number;
    type: string;
    severity: string;
    radius_meters: number;
    center: [number, number]; // [lat, lng]
  }[];
  message?: string;
}

// ── BUILD AUTHORITATIVE CAMPUS GRAPH ONCE ──
class CampusGraphManager {
  private nodes: Map<string, CampusNode> = new Map();
  private edges: CampusEdge[] = [];
  private adjacency: Map<string, { to: string; distance: number }[]> = new Map();

  constructor() {
    this.initializeGraph();
  }

  private initializeGraph() {
    this.nodes.clear();
    this.edges = [];
    this.adjacency.clear();

    // 1. Add Building Centroid Nodes
    buildingsData.features.forEach((f: any) => {
      this.nodes.set(f.properties.id, {
        id: f.properties.id,
        name: f.properties.name,
        type: 'building',
        lat: f.properties.lat,
        lng: f.properties.lng,
      });
    });

    // 2. Add Gate Nodes
    gatesData.features.forEach((f: any) => {
      this.nodes.set(f.properties.id, {
        id: f.properties.id,
        name: f.properties.name,
        type: 'gate',
        lat: f.properties.lat,
        lng: f.properties.lng,
      });
    });

    // 3. Add Central Assembly Oval Node
    this.nodes.set('oval', {
      id: 'oval',
      name: 'School Ground (Central Evacuation Oval)',
      type: 'oval',
      lat: POLONULING_CAMPUS_CENTER.lat,
      lng: POLONULING_CAMPUS_CENTER.lng,
    });

    // 4. Add Pathway Nodes and Edges
    const junctionCoordMap = new Map<string, string>(); // 'lng,lat' -> nodeId
    let juncCounter = 1;

    pathwaysData.features.forEach((f: any) => {
      const coords = f.geometry.coordinates;
      let prevNodeId: string | null = null;

      for (let i = 0; i < coords.length; i++) {
        const pt = coords[i];
        const key = `${pt[0].toFixed(5)},${pt[1].toFixed(5)}`;
        let nodeId = junctionCoordMap.get(key);

        if (!nodeId) {
          nodeId = `junc_${juncCounter++}`;
          junctionCoordMap.set(key, nodeId);
          this.nodes.set(nodeId, {
            id: nodeId,
            name: `Pathway Junction ${nodeId.replace('junc_', '')}`,
            type: 'junction',
            lat: pt[1],
            lng: pt[0],
          });
        }

        if (prevNodeId && prevNodeId !== nodeId) {
          const prevNode = this.nodes.get(prevNodeId)!;
          const currNode = this.nodes.get(nodeId)!;
          const dist = haversineMeters(prevNode.lat, prevNode.lng, currNode.lat, currNode.lng);

          this.addEdge(prevNodeId, nodeId, dist);
          this.addEdge(nodeId, prevNodeId, dist);
        }

        prevNodeId = nodeId;
      }
    });

    // 5. Connect Buildings, Gates, and Oval to Walkable Pathway Junctions via Spur Edges
    const walkableJunctions = Array.from(this.nodes.values()).filter(
      (n) => n.type === 'junction' || n.type === 'gate'
    );

    // Connect each building to nearest walkable junction
    Array.from(this.nodes.values())
      .filter((n) => n.type === 'building' || n.type === 'gate' || n.type === 'oval')
      .forEach((facility) => {
        let nearestJunc: CampusNode | null = null;
        let minDist = Infinity;

        for (const junc of walkableJunctions) {
          if (junc.id === facility.id) continue;
          const d = haversineMeters(facility.lat, facility.lng, junc.lat, junc.lng);
          if (d < minDist) {
            minDist = d;
            nearestJunc = junc;
          }
        }

        if (nearestJunc && minDist < 65) {
          this.addEdge(facility.id, nearestJunc.id, minDist);
          this.addEdge(nearestJunc.id, facility.id, minDist);
        }
      });
  }

  private addEdge(from: string, to: string, distance: number) {
    this.edges.push({ from, to, distance });
    if (!this.adjacency.has(from)) {
      this.adjacency.set(from, []);
    }
    this.adjacency.get(from)!.push({ to, distance });
  }

  public getNodes(): Map<string, CampusNode> {
    return this.nodes;
  }

  public getEdges(): CampusEdge[] {
    return this.edges;
  }

  public getAdjacency(): Map<string, { to: string; distance: number }[]> {
    return this.adjacency;
  }

  /**
   * Snaps a GPS coordinate to the nearest valid walkable pathway node (junction or gate).
   * Never snaps to building centroids.
   */
  public snapGpsToPathway(lat: number, lng: number): CampusNode {
    // Check if within campus bounds (within ~350m of campus anchor)
    const distFromCenter = haversineMeters(lat, lng, POLONULING_CAMPUS_CENTER.lat, POLONULING_CAMPUS_CENTER.lng);
    const gates = Array.from(this.nodes.values()).filter((n) => n.type === 'gate');

    // If outside campus vicinity, snap to the nearest entrance gate
    if (distFromCenter > 350) {
      if (gates.length > 0) {
        let closestGate = gates[0];
        let minDist = haversineMeters(lat, lng, closestGate.lat, closestGate.lng);
        for (let i = 1; i < gates.length; i++) {
          const d = haversineMeters(lat, lng, gates[i].lat, gates[i].lng);
          if (d < minDist) {
            minDist = d;
            closestGate = gates[i];
          }
        }
        return closestGate;
      }
      return this.nodes.get('oval')!;
    }

    // Otherwise, find the nearest walkable pathway junction or gate
    let nearest: CampusNode | null = null;
    let minDistance = Infinity;

    for (const node of this.nodes.values()) {
      if (node.type !== 'junction' && node.type !== 'gate') continue;
      const d = haversineMeters(lat, lng, node.lat, node.lng);
      if (d < minDistance) {
        minDistance = d;
        nearest = node;
      }
    }

    return nearest || (gates.length > 0 ? gates[0] : this.nodes.get('oval')!);
  }

  /**
   * Standard A* Pathfinding Algorithm.
   * If allowHazardEscapePenalty is false: strictly skips blocked nodes and edges.
   * If allowHazardEscapePenalty is true (e.g. user trapped in hazard area): applies a heavy penalty
   * to find the fastest trajectory OUT of danger into safe zones.
   */
  public findAStarPath(
    startNodeId: string,
    targetNodeId: string,
    blockedNodes: Set<string> = new Set(),
    blockedEdges: Set<string> = new Set(),
    allowHazardEscapePenalty: boolean = false
  ): { path: CampusNode[]; totalDistanceMeters: number } | null {
    const targetNode = this.nodes.get(targetNodeId);
    if (!targetNode) return null;

    // Target destination node cannot be blocked (must be safe)
    if (blockedNodes.has(targetNodeId)) {
      return null;
    }

    const openSet = new Set<string>([startNodeId]);
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    for (const id of this.nodes.keys()) {
      gScore.set(id, Infinity);
      fScore.set(id, Infinity);
    }

    gScore.set(startNodeId, 0);
    const startNode = this.nodes.get(startNodeId)!;
    fScore.set(startNodeId, haversineMeters(startNode.lat, startNode.lng, targetNode.lat, targetNode.lng));

    while (openSet.size > 0) {
      // Find node in openSet with lowest fScore
      let currentId: string | null = null;
      let lowestF = Infinity;
      for (const id of openSet) {
        const score = fScore.get(id) ?? Infinity;
        if (score < lowestF) {
          lowestF = score;
          currentId = id;
        }
      }

      if (!currentId) break;

      if (currentId === targetNodeId) {
        // Reconstruct path
        const path: CampusNode[] = [];
        let curr: string | undefined = currentId;
        while (curr) {
          path.unshift(this.nodes.get(curr)!);
          curr = cameFrom.get(curr);
        }
        return {
          path,
          totalDistanceMeters: gScore.get(targetNodeId) || 0,
        };
      }

      openSet.delete(currentId);
      const currentNode = this.nodes.get(currentId)!;
      const neighbors = this.adjacency.get(currentId) || [];

      for (const edge of neighbors) {
        const neighborId = edge.to;
        const edgeKey = `${currentId}->${neighborId}`;
        const reverseEdgeKey = `${neighborId}->${currentId}`;

        const isNeighborBlocked = blockedNodes.has(neighborId);
        const isEdgeBlocked = blockedEdges.has(edgeKey) || blockedEdges.has(reverseEdgeKey);

        if (isNeighborBlocked || isEdgeBlocked) {
          if (!allowHazardEscapePenalty) {
            continue;
          }
        }

        const neighborNode = this.nodes.get(neighborId);
        if (!neighborNode) continue;

        const hazardPenalty = (isNeighborBlocked || isEdgeBlocked) ? 1000 : 0;
        const tentativeG = (gScore.get(currentId) ?? Infinity) + edge.distance + hazardPenalty;

        if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
          cameFrom.set(neighborId, currentId);
          gScore.set(neighborId, tentativeG);
          const h = haversineMeters(neighborNode.lat, neighborNode.lng, targetNode.lat, targetNode.lng);
          fScore.set(neighborId, tentativeG + h);
          openSet.add(neighborId);
        }
      }
    }

    return null;
  }
}

// Global Singleton Campus Graph
const campusGraph = new CampusGraphManager();

export class RoutingService {
  static getGraphNode(nodeId: string): CampusNode | undefined {
    return campusGraph.getNodes().get(nodeId);
  }

  /**
   * Authoritative Safe Evacuation Path Calculation
   */
  static async getSafePath(
    fromLat: number,
    fromLng: number,
    toLat?: number,
    toLng?: number,
    destinationId?: string,
    startNodeId?: string
  ): Promise<SafePathResponse> {
    const nodes = campusGraph.getNodes();

    // 1. Determine Start Node
    let originNode: CampusNode;
    if (startNodeId && nodes.has(startNodeId)) {
      originNode = nodes.get(startNodeId)!;
    } else {
      originNode = campusGraph.snapGpsToPathway(fromLat, fromLng);
    }

    // 2. Fetch Active Hazards from Database
    const hazardResult = await pool.query(`
      SELECT 
        hazard_id,
        type,
        severity,
        ST_Y(location) AS lat,
        ST_X(location) AS lng
      FROM hazards
      WHERE status = 'active';
    `);

    const activeHazards: ActiveHazardItem[] = hazardResult.rows.map((h) => {
      const lat = parseFloat(h.lat);
      const lng = parseFloat(h.lng);
      const radius_meters = getHazardRadius(h.severity);
      return {
        hazard_id: h.hazard_id,
        type: h.type,
        severity: h.severity,
        radius_meters,
        lat,
        lng,
      };
    });

    // 3. Compute Blocked Nodes and Blocked Edges
    const blockedNodes = new Set<string>();
    const blockedEdges = new Set<string>();

    for (const h of activeHazards) {
      // Block nodes within hazard radius
      for (const [nodeId, node] of nodes.entries()) {
        const dist = haversineMeters(h.lat, h.lng, node.lat, node.lng);
        if (dist <= h.radius_meters) {
          blockedNodes.add(nodeId);
        }
      }

      // Block edges intersecting hazard buffer
      for (const edge of campusGraph.getEdges()) {
        const nodeA = nodes.get(edge.from);
        const nodeB = nodes.get(edge.to);
        if (!nodeA || !nodeB) continue;

        const distToSegment = distanceToSegmentMeters(
          h.lat,
          h.lng,
          nodeA.lat,
          nodeA.lng,
          nodeB.lat,
          nodeB.lng
        );

        if (distToSegment <= h.radius_meters) {
          blockedEdges.add(`${edge.from}->${edge.to}`);
          blockedEdges.add(`${edge.to}->${edge.from}`);
        }
      }
    }

    // 4. Candidate Evacuation Destinations (in priority order)
    let candidateDestIds: string[] = [];

    if (destinationId && nodes.has(destinationId)) {
      candidateDestIds = [destinationId];
    } else if (toLat && toLng) {
      // Find closest gate or oval to toLat, toLng
      let closestId = 'oval';
      let minDist = Infinity;
      ['oval', 'gate_entrance', 'gate_exit'].forEach((id) => {
        const n = nodes.get(id);
        if (n) {
          const d = haversineMeters(toLat, toLng, n.lat, n.lng);
          if (d < minDist) {
            minDist = d;
            closestId = id;
          }
        }
      });
      const availableGateIds = Array.from(nodes.values()).filter((n) => n.type === 'gate').map((n) => n.id);
      candidateDestIds = [closestId, 'oval', ...availableGateIds].filter(
        (v, i, a) => a.indexOf(v) === i && nodes.has(v)
      );
    } else {
      // Default prioritization: Central Oval first, then available Gates
      const availableGateIds = Array.from(nodes.values()).filter((n) => n.type === 'gate').map((n) => n.id);
      candidateDestIds = ['oval', ...availableGateIds].filter(
        (v, i, a) => a.indexOf(v) === i && nodes.has(v)
      );
    }

    // 5. Calculate Baseline Shortest Route (WITHOUT hazard blocking)
    // to determine true isHazardRerouted semantics
    let baselineRoute: { path: CampusNode[]; totalDistanceMeters: number } | null = null;
    let chosenDestNode: CampusNode | null = null;

    for (const destId of candidateDestIds) {
      baselineRoute = campusGraph.findAStarPath(originNode.id, destId, new Set(), new Set());
      if (baselineRoute) {
        chosenDestNode = nodes.get(destId)!;
        break;
      }
    }

    // 6. Calculate Hazard-Aware Route (WITH hazard blocking)
    let safeRoute: { path: CampusNode[]; totalDistanceMeters: number } | null = null;
    let safeDestNode: CampusNode | null = null;

    // First attempt: Strictly avoid all blocked nodes and edges
    for (const destId of candidateDestIds) {
      // If destination itself is blocked, skip to next safe zone
      if (blockedNodes.has(destId)) continue;

      safeRoute = campusGraph.findAStarPath(originNode.id, destId, blockedNodes, blockedEdges, false);
      if (safeRoute) {
        safeDestNode = nodes.get(destId)!;
        break;
      }
    }

    // Second attempt: If user started inside hazard danger zone, find the fastest escape path out
    if (!safeRoute) {
      for (const destId of candidateDestIds) {
        if (blockedNodes.has(destId)) continue;

        safeRoute = campusGraph.findAStarPath(originNode.id, destId, blockedNodes, blockedEdges, true);
        if (safeRoute) {
          safeDestNode = nodes.get(destId)!;
          break;
        }
      }
    }

    // 7. Evaluate if no route exists
    if (!safeRoute || !safeDestNode) {
      return {
        success: false,
        route: null,
        message: 'No safe evacuation route currently available. All accessible pathways to designated evacuation zones are blocked by active hazards.',
      };
    }

    // 8. Determine true isHazardRerouted and hazardsAvoided
    // True isHazardRerouted means: the baseline shortest route was compromised by an active hazard
    const hazardsAvoided: ActiveHazardItem[] = [];
    let isHazardRerouted = false;

    if (baselineRoute && activeHazards.length > 0) {
      for (const h of activeHazards) {
        let intersectsBaseline = false;

        for (let i = 0; i < baselineRoute.path.length; i++) {
          const pt = baselineRoute.path[i];
          if (haversineMeters(h.lat, h.lng, pt.lat, pt.lng) <= h.radius_meters) {
            intersectsBaseline = true;
            break;
          }
          if (i < baselineRoute.path.length - 1) {
            const nextPt = baselineRoute.path[i + 1];
            if (
              distanceToSegmentMeters(h.lat, h.lng, pt.lat, pt.lng, nextPt.lat, nextPt.lng) <=
              h.radius_meters
            ) {
              intersectsBaseline = true;
              break;
            }
          }
        }

        if (intersectsBaseline) {
          hazardsAvoided.push(h);
        }
      }

      // Rerouted if hazards touched baseline path or destination was forced to change
      if (hazardsAvoided.length > 0 || (chosenDestNode && chosenDestNode.id !== safeDestNode.id)) {
        isHazardRerouted = true;
      }
    }

    // 9. Format Route Geometry in GeoJSON [lng, lat]
    const coordinates: [number, number][] = safeRoute.path.map((n) => [n.lng, n.lat]);
    // Prepend user exact GPS if it differs from snapped node and no explicit start node was chosen
    if (!startNodeId && haversineMeters(fromLat, fromLng, originNode.lat, originNode.lng) > 3) {
      coordinates.unshift([fromLng, fromLat]);
    }

    // Calculate actual physical walking distance along path nodes (without penalty weights)
    let actualDistanceMeters = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const ptA = coordinates[i];
      const ptB = coordinates[i + 1];
      actualDistanceMeters += haversineMeters(ptA[1], ptA[0], ptB[1], ptB[0]);
    }

    const roundedDistanceMeters = Math.max(1, Math.round(actualDistanceMeters));
    // Walking speed: ~1.2 m/s (~72 m/min)
    const estimatedSeconds = Math.round(roundedDistanceMeters / 1.2);
    const estimatedWalkingMinutes = Math.max(1, Math.ceil(roundedDistanceMeters / 72));

    const status = isHazardRerouted ? 'safest_hazard_aware' : 'recommended';

    // 10. Construct Standardized + Backwards Compatible Response
    const legacyWaypoints: [number, number][] = coordinates.map((pt) => [pt[1], pt[0]]); // [lat, lng]

    return {
      success: true,
      route: {
        geometry: {
          type: 'LineString',
          coordinates, // [lng, lat]
        },
        distanceMeters: roundedDistanceMeters,
        estimatedWalkingMinutes,
        estimatedSeconds,
        origin: {
          id: originNode.id,
          name: originNode.name,
          type: originNode.type,
          coordinates: [originNode.lng, originNode.lat],
        },
        destination: {
          id: safeDestNode.id,
          name: safeDestNode.name,
          type: safeDestNode.type,
          center: [safeDestNode.lng, safeDestNode.lat],
        },
        isHazardRerouted,
        hazardsAvoided,
        hazardsAvoidedCount: hazardsAvoided.length,
        pathNodes: safeRoute.path.map((n) => ({
          id: n.id,
          name: n.name,
          type: n.type,
          lat: n.lat,
          lng: n.lng,
        })),
        status,
      },
      // Backwards compatible fields for mobile
      destination_zone: {
        zone_id: safeDestNode.id === 'oval' ? 1 : 2,
        name: safeDestNode.name,
        type: 'evacuation_point',
        center: [safeDestNode.lat, safeDestNode.lng],
      },
      distance_meters: roundedDistanceMeters,
      estimated_duration_minutes: estimatedWalkingMinutes,
      route_waypoints: legacyWaypoints,
      hazards_to_avoid: activeHazards.map((h) => ({
        hazard_id: h.hazard_id,
        type: h.type,
        severity: h.severity,
        radius_meters: h.radius_meters,
        center: [h.lat, h.lng],
      })),
    };
  }
}
