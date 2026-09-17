# SafeRoute — Active Campus Hazard CRUD Implementation Report

**Authoritative Completion Report for Polonoling National High School (PNHS)**  
**Date:** September 17, 2026  
**System:** SafeRoute Web Admin, Backend API & Mobile Application  

---

## 1. Existing Hazard System Audit

Prior to implementation, a complete architectural audit of the SafeRoute repository was performed across backend, web-admin, and mobile-app layers.

| CRUD Operation | Backend Status (Pre-Task) | Web-Admin Status (Pre-Task) | Mobile Status (Pre-Task) | Final Verdict |
|:---|:---:|:---:|:---:|:---|
| **CREATE** | `POST /api/hazards` existed; saved Point to PostGIS; emitted `hazard:new` | `AddHazardModal.tsx` existed; supported map click & coordinate entry | `hazard:new` socket listener existed; triggered re-fetch & route recalculation | **Existing** (Audited & preserved) |
| **READ** | `GET /api/hazards/active` returned GeoJSON `FeatureCollection` | Hazards rendered on `CampusMap.tsx` as markers & buffers; `HazardDetailModal.tsx` existed; **active hazard list drawer was missing** | `MapApi.getActiveHazards` existed; rendered hazard markers & buffers on Flutter map | **Partially Existing** (`HazardsSidebar` created) |
| **UPDATE** | **MISSING** (No `PUT/PATCH /api/hazards/:id` route, controller method, or service query) | **MISSING** (No `EditHazardModal.tsx` or `updateHazardApi`) | `hazard:updated` socket listener was missing | **MISSING** (Fully implemented) |
| **DELETE / DEACTIVATE** | `PATCH /api/hazards/:id/resolve` existed; **no REST `DELETE /api/hazards/:id` endpoint** | `HazardDetailModal.tsx` only had "Mark as Resolved"; **no dedicated Delete action with confirmation modal** | `hazard:resolved` socket listener existed | **Partially Existing** (`DELETE /:id` endpoint & confirmation dialog implemented) |

---

## 2. Database & Data Model Architecture

### Existing Schema Reused
No new or redundant database columns were created. The existing PostgreSQL/PostGIS `hazards` table was 100% reused:

```sql
TABLE hazards (
  hazard_id SERIAL PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  location GEOMETRY(Point, 4326) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
  reported_by INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE
);
```

### Deactivation vs. Hard Deletion Architecture
Foreign keys in `alerts` (`hazard_id REFERENCES hazards(hazard_id)`) and audit logs in `activity_logs` depend on `hazard_id`. Consequently, pursuant to specification requirements, **status-based deactivation (`status = 'resolved'`, `resolved_at = NOW()`)** was implemented for DELETE operations. This ensures:
1. Historical records and emergency alert references remain unbroken.
2. The hazard is immediately excluded from `SELECT ... WHERE status = 'active'`.
3. The routing engine immediately stops treating it as an obstacle.
4. The Web Admin map and mobile clients immediately drop the marker and impact buffer.

---

## 3. End-to-End CRUD Implementation

### A. CREATE HAZARD
- **Backend Flow:** `POST /api/hazards` validates GeoJSON Point coordinates, type, severity, and photo. Saves to PostGIS using `ST_GeomFromGeoJSON`.
- **Real-Time Emission:** Emits `hazard:new` to Socket.IO `'campus'` room.
- **Audit Logging:** Logs `HAZARD_PINNED` into `activity_logs`.
- **FCM Notification:** Broadcasts informational advisory push notification to active mobile devices.
- **Routing Engine Impact:** Subsequent queries to `RoutingService.getSafePath` automatically identify the active hazard, compute the avoidance buffer (`critical` = 30m, `high` = 25m, `moderate` = 20m, `low` = 15m), block intersecting pathway nodes/edges, and compute an avoidance bypass route.

### B. READ HAZARD & ACTIVE HAZARD DRAWER
- **Backend API:** `GET /api/hazards/active` returns a GeoJSON `FeatureCollection` with all active hazards.
- **Web-Admin Drawer (`HazardsSidebar.tsx`):**
  - Toggle button in map toolbar displaying active hazard count (`Hazards (5)`).
  - Search input filtering by hazard type or notes.
  - Severity filter pills (`ALL`, `CRITICAL`, `HIGH`, `MODERATE`, `LOW`).
  - Active hazard cards displaying:
    - Category / Type & Severity badge (`CRITICAL` [rose], `HIGH` [orange], `MODERATE` [amber], `LOW` [slate])
    - Avoidance radius indicator (e.g., `25m Hazard Buffer`, `30m Hazard Buffer`)
    - Description & Field observations
    - Timestamp & Coordinates (`lng, lat`)
    - Action buttons: **Focus** (flies map to coordinates and opens details), **Edit** (opens edit modal), **Delete** (opens confirmation modal)

### C. UPDATE HAZARD
- **Backend API:** `PUT /api/hazards/:id` and `PATCH /api/hazards/:id` allow administrators and safety coordinators to update:
  - `type`
  - `description`
  - `location` (validates GeoJSON Point within [-180, 180], [-90, 90])
  - `severity` (`low`, `moderate`, `high`, `critical`)
  - `photo` (uploads replacement image file or keeps existing)
- **Real-Time Emission:** Emits `hazard:updated` to the `'campus'` room.
- **Web-Admin Modal (`EditHazardModal.tsx`):** Interactive form modal with type select, severity pills with avoidance radii, description textarea, coordinate inputs, and photo upload.
- **Map & Routing Reaction:** Map updates marker position and buffer circle in real-time; active evacuation paths immediately re-route if affected by the modified buffer.

### D. DELETE / DEACTIVATE HAZARD
- **Backend API:** `DELETE /api/hazards/:id` deactivates the hazard (`status = 'resolved'`).
- **Confirmation Dialog:** Web Admin displays mandatory confirmation dialog before deletion:
  > *"Are you sure you want to remove this active hazard?"*  
  > *"This will remove the obstacle from the campus map and re-open affected evacuation pathways."*
- **Real-Time Emission:** Emits `hazard:resolved` to the `'campus'` room.
- **Routing Reaction:** Pathway edges previously blocked by the hazard are restored. Active routes traversing through the restored area recalculate to shorter optimal evacuation paths.

---

## 4. Real-Time Socket.IO Synchronization

The real-time event pipeline was extended cleanly without duplicate event systems:

```
Admin creates hazard
        ↓
POST /api/hazards → PostGIS INSERT
        ↓
emitHazardNew → Socket.IO 'hazard:new'
        ↓
Web Admin map renders marker & buffer
Mobile clients receive update & recalculate route

──────────────────────────────────────────────

Admin updates hazard
        ↓
PUT /api/hazards/:id → PostGIS UPDATE
        ↓
emitHazardUpdated → Socket.IO 'hazard:updated'
        ↓
Web Admin updates marker, buffer & sidebar
Mobile clients refresh hazard state & recalculate route

──────────────────────────────────────────────

Admin deletes hazard (with confirmation)
        ↓
DELETE /api/hazards/:id → PostGIS UPDATE status='resolved'
        ↓
emitHazardResolved → Socket.IO 'hazard:resolved'
        ↓
Web Admin removes marker & buffer from map
Mobile clients remove hazard & restore blocked pathways
```

---

## 5. Security & Role-Based Access Control (RBAC)

- **Authentication Middleware:** `authenticateToken` validates JWT tokens on all hazard endpoints.
- **Authorization Middleware:** `requireRole('admin', 'coordinator')` enforces strict administrative privileges:
  - `POST /api/hazards` → Restricted to `admin` and `coordinator`.
  - `PUT /api/hazards/:id` → Restricted to `admin` and `coordinator`.
  - `PATCH /api/hazards/:id` → Restricted to `admin` and `coordinator`.
  - `DELETE /api/hazards/:id` → Restricted to `admin` and `coordinator`.
- **Public/Student Access:**
  - Students, teachers, and non-admin users have read-only access to `GET /api/hazards/active`.
  - Attempts by `student` role to mutate hazards receive `403 Forbidden` (verified in automated test suite).

---

## 6. Files Modified & Created

### Files Created
1. `web-admin/src/components/Map/HazardsSidebar.tsx` (Active Hazards management drawer)
2. `web-admin/src/components/Map/EditHazardModal.tsx` (Active Hazard update modal)

### Files Modified
1. `backend/src/services/hazard.service.ts` (Added `updateHazard` and `deleteHazard` service methods)
2. `backend/src/controllers/hazard.controller.ts` (Added `updateHazard` and `deleteHazard` handlers with activity logging)
3. `backend/src/routes/hazard.routes.ts` (Mounted `PUT /:id`, `PATCH /:id`, and `DELETE /:id`)
4. `backend/src/socket.ts` (Added `emitHazardUpdated` event dispatcher)
5. `backend/tests/hazards.test.ts` (Added integration tests for UPDATE and DELETE)
6. `backend/tests/routing.test.ts` (Aligned test coordinates to PNHS center)
7. `web-admin/src/api/hazards.ts` (Added `updateHazardApi` and `deleteHazardApi`)
8. `web-admin/src/components/Map/CampusMap.tsx` (Added toolbar button, sidebar toggle, and `hazard:updated` socket listener)
9. `web-admin/src/components/Map/HazardDetailModal.tsx` (Added Edit and Delete trigger buttons, dynamic photo URL)
10. `web-admin/src/pages/MapPage.tsx` (Wired state for `HazardsSidebar`, `EditHazardModal`, and delete confirmation dialog)
11. `mobile-app/lib/services/socket_service.dart` (Added `hazard:updated` event listener)

---

## 7. Verification & Build Results

### A. Backend Build
```bash
$ npm run build (in backend/)
> saferoute-backend@1.0.0 build
> tsc
Result: Exited with code 0 (0 TypeScript errors)
```

### B. Web-Admin Build
```bash
$ npm run build (in web-admin/)
> web-admin@0.0.0 build
> tsc -b && vite build
Result: Exited with code 0 (0 TypeScript errors)
```

### C. Mobile Static Analysis
```bash
$ flutter analyze (in mobile-app/)
Analyzing mobile-app...
Result: No issues found! (ran in 35.3s)
```

### D. Automated Integration Tests
- **`backend/tests/hazards.test.ts`**: 11/11 tests passed (GET active, POST create, validation, 403 checks, PATCH resolve, PUT update, DELETE deactivation).
- **`backend/tests/routing.test.ts`**: 2/2 tests passed.
- **`backend/tests/zones.test.ts`**: 8/8 tests passed.
- **`backend/tests/socket.test.ts`**: 8/8 tests passed.

### E. Browser Subagent Visual & Functional Verification
- Navigated to `http://localhost:5173` and authenticated as System Admin.
- Opened `HazardsSidebar` using the map toolbar `Hazards (5)` button.
- Verified active hazards list, search filter, severity pills, buffer radius indicators, and coordinates.
- Opened `EditHazardModal` and verified form fields.
- Triggered Delete action and verified exact confirmation dialog text.
- Saved browser recording: `hazard_crud_demo_1789612402103.webp`
- Saved screenshot: `map_hazards_sidebar_1789612659219.png`

---

## 8. Preserved Architectural Invariants

- **GIS Geometry Unmodified:** Building polygons, gate anchors, campus boundary, and pathway networks in `generate-campus-gis.js` were completely preserved.
- **A* Routing Algorithm Unmodified:** The A* algorithm, Haversine distance, pathway snapping, and 65m spur threshold in `routing.service.ts` remain authoritative and untouched.
- **Real-Time Broadcasts Preserved:** Emergency alert broadcasting, GPS tracking, emergency check-ins, and mobile listeners continue operating without disruption.
