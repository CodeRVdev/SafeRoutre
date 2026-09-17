# SafeRoute — Emergency Map Regression Recovery Report

**Generated:** September 17, 2026  
**System:** SafeRoute Web Admin — Polonoling National High School Campus GIS  
**Status:** Completed & Successfully Verified  

---

## 1. Executive Summary

This report documents the emergency recovery and verification of the SafeRoute Web Admin **Campus Map** (`/map`). Following the previous experimental Hazard Details layout modifications, the map experienced viewport regression symptoms where the top toolbar controls and upper map canvas were displaced.

All experimental layout modifications have been completely rolled back. The Campus Map and its modal structures have been restored to their last known stable, fully-functional state. The recovery was verified via interactive browser testing with MapLibre GL tile rendering, GIS layer loading, basemap switching, and modal verification.

---

## 2. Root Cause of Map Failure

1. **Experimental Container Relocation**:
   - `<HazardDetailModal />` had been moved inside the relative map canvas container (`<div className="flex-1 relative" style={{ height: 'calc(100vh - 140px)', minHeight: 620 }}>`).
   - The card's experimental positioning and internal height caused viewport layout displacement, leading to window scroll offset that pushed the top-right toolbar (`Satellite`, `Dark`, `Streets`, `3D Mode`, and Zoom controls) off-screen.
2. **Viewport Scroll Side Effects**:
   - The scroll displacement hid the top 150px of the canvas under the browser viewport, making it appear as though the map controls were missing or broken.

---

## 3. Files Changed by the Failed Fix

The failed layout experiment had touched only two files:
- `web-admin/src/components/Map/HazardDetailModal.tsx`
- `web-admin/src/pages/MapPage.tsx`

*Note: `CampusMap.tsx`, GIS coordinate files, and backend routing services were NEVER modified during the overlap fix.*

---

## 4. Files Reverted / Restored

| File | Reversion / Restoration Applied |
|---|---|
| [`web-admin/src/components/Map/HazardDetailModal.tsx`](file:///c:/Users/USERPC/OneDrive/Desktop/SafeRoute/web-admin/src/components/Map/HazardDetailModal.tsx) | Restored to the previous working centered modal structure (`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm`). Reverted experimental `absolute` card positioning and custom dimensions. Preserved TypeScript-safe photo handling and CRUD action buttons. |
| [`web-admin/src/pages/MapPage.tsx`](file:///c:/Users/USERPC/OneDrive/Desktop/SafeRoute/web-admin/src/pages/MapPage.tsx) | Restored `<HazardDetailModal />` back outside the relative map container to the modals list section at the bottom of the page, restoring the original clean DOM tree. |

---

## 5. Files Intentionally Preserved

Strict guardrails were maintained throughout the recovery to protect system integrity:
- **GIS Geometry Source-of-Truth**: [`web-admin/generate-campus-gis.js`](file:///c:/Users/USERPC/OneDrive/Desktop/SafeRoute/web-admin/generate-campus-gis.js) was **100% PRESERVED**.
- **Web Campus GIS Data**: [`web-admin/src/components/Map/data/campusGeoData.ts`](file:///c:/Users/USERPC/OneDrive/Desktop/SafeRoute/web-admin/src/components/Map/data/campusGeoData.ts) was **100% PRESERVED**.
- **Backend Routing Services**: [`backend/src/services/routing.service.ts`](file:///c:/Users/USERPC/OneDrive/Desktop/SafeRoute/backend/src/services/routing.service.ts) and A* algorithm were **100% PRESERVED**.
- **Hazard CRUD APIs & Sidebar**: The previously verified Active Hazards Sidebar and Edit Modal were retained without interference.

---

## 6. Map Rendering Verification Checklist

Every item specified in the recovery criteria was visually inspected and verified live in the browser:

- [x] **Map canvas is visible**: MapLibre GL renders the full Polonoling NHS campus.
- [x] **Satellite basemap works**: Esri World Imagery tiles load crisply at zoom 17.5+.
- [x] **Dark map works**: Switches instantly to Carto Dark Matter raster tiles.
- [x] **Streets map works**: Switches instantly to Carto Voyager raster tiles.
- [x] **Map Layers works**: Toggle dropdown controls Hazards, Pathways, and Labels.
- [x] **3D Mode works**: Toggles 45° pitch and 3D extruded building models.
- [x] **Zoom In works**: `+` button zooms smoothly.
- [x] **Zoom Out works**: `-` button zooms smoothly.
- [x] **Reset View works**: Maximize button resets orientation to campus center.
- [x] **Campus boundary renders**: Dashed perimeter line renders accurately.
- [x] **Buildings render**: All 13 campus structures render with correct roof colors and outlines.
- [x] **Building labels render**: Labels for School GYM, BCD Building, ADMIN, Clinic, etc., render clearly.
- [x] **Gates render**: Main Entrance (South) and North Exit gates display badges.
- [x] **Pathways render**: Paved walkways with yellow escape dashes render completely.
- [x] **Hazard markers render**: Fire emoji (`🔥`) markers render with pulsing danger colors.
- [x] **Hazard buffers render**: Danger buffer circles (15m–30m) render with translucent red fill and dashed boundary.
- [x] **GPS marker works**: Blue pin and snapped pathway location marker render.
- [x] **Routing works**: Emergency Evacuation Router calculates shortest obstacle-free pathway.
- [x] **Existing hazard details can still open**: Clicking any hazard marker opens the Hazard Detail Modal.
- [x] **Close hazard details works**: Close button (`X` and `Close`) dismisses modal cleanly.
- [x] **Mark as Resolved still works**: Deactivates hazard in PostGIS backend and re-opens pathways.

---

## 7. GIS Verification

A strict coordinate integrity check confirmed:
- **`web-admin/src/components/Map/data/campusGeoData.ts`**: Coordinates match the authoritative Polonoling NHS datum center (`lat: 6.2882333, lng: 124.9675614`).
- **No unexpected coordinate modifications**: 0 geometry alterations were introduced.
- **No GIS regeneration or recalibration** was executed during this task.

---

## 8. Build Result

The production build was run in `web-admin` and succeeded with **0 errors**:

```bash
> web-admin@0.0.0 build
> tsc -b && vite build

vite v8.2.1 building client environment for production...
transforming...✓ 2995 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               0.92 kB │ gzip:   0.51 kB
dist/assets/index-2LkAy9c1.css              211.78 kB │ gzip:  30.10 kB
dist/assets/rolldown-runtime-B0Z9INg1.js      0.90 kB │ gzip:   0.51 kB
dist/assets/purify-DnsCxvm2.js               20.78 kB │ gzip:   8.67 kB
dist/assets/index.es-PAiOd1Yb.js            151.81 kB │ gzip:  49.13 kB
dist/assets/html2canvas-XpPErLxs.js         199.50 kB │ gzip:  46.77 kB
dist/assets/index-CtV6UybA.js             2,672.17 kB │ gzip: 712.16 kB
✓ built in 9.63s
```

---

## 9. Visual Evidence Artifacts

- **Restored Map Full View**: [`final_restored_map_verified_1789617083630.png`](file:///C:/Users/USERPC/.gemini/antigravity-ide/brain/4f8d9338-9c32-4539-962d-82f47bf977ff/final_restored_map_verified_1789617083630.png)
- **Centered Hazard Modal View**: [`hazard_modal_centered_1789616972259.png`](file:///C:/Users/USERPC/.gemini/antigravity-ide/brain/4f8d9338-9c32-4539-962d-82f47bf977ff/hazard_modal_centered_1789616972259.png)
- **Browser Interaction Recording**: [`map_regression_recovered_1789616599173.webp`](file:///C:/Users/USERPC/.gemini/antigravity-ide/brain/4f8d9338-9c32-4539-962d-82f47bf977ff/map_regression_recovered_1789616599173.webp)

---

## 10. Git Diff Summary

```
Changes restored relative to previous stable state:
- web-admin/src/pages/MapPage.tsx: Reverted <HazardDetailModal /> position back to root modal list.
- web-admin/src/components/Map/HazardDetailModal.tsx: Reverted from absolute positioning back to centered fixed modal.

Preserved without regression:
- 0 GIS modifications
- 0 backend modifications
- 0 routing modifications
- 0 mobile modifications
```
