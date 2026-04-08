# RackVision

Warehouse Racking Inspection Platform — a web application for conducting, managing, and documenting warehouse pallet racking inspections.

## Tech Stack

- **React 19** with Vite 8
- **Tailwind CSS 4** for styling
- **Zustand** for state management (persisted to localStorage)
- **React Router v7** for navigation
- **Konva / React-Konva** for 2D canvas layout editing
- **Lucide React** for icons

## Current Features (Built)

### Inspection Management

- Create new inspections with client details (reseller, end customer, site address, contact info)
- View recent inspections on the home page with status badges (draft / completed)
- Renewal inspections workflow

### Working Areas

- Organize inspections into multiple working areas
- Add/remove working areas per inspection

### Rack Management

- Create racks with detailed configuration: manufacturer, number of bays, bay length, beam type, levels, elevations, frame height/depth, and upright width
- Auto-generates bays and frames based on the number of bays (frames = bays + 1)
- Duplicate and delete racks
- Rack wizard for guided rack creation

### 2D Layout Editor (Konva Canvas)

- Visual bird's-eye view of rack positions within a working area
- Drag-and-drop rack positioning (edit mode with lock/unlock toggle)
- Zoom in/out controls with percentage display
- Click on bays or frames in the layout to navigate to their inspection editors

### Bay Inspection

- Bay front view SVG visualization with uprights, beams, base plates
- Bay configuration editor with per-level beam selection (grouped by type)
- Record non-conformities per bay via multi-step form (element type → element → NC type → severity → notes)

### Frame Inspection

- Frame side-elevation SVG view with uprights, diagonal/horizontal braces, base plates
- Frame configuration display (read-only specs + connected bays)
- Record non-conformities per frame via multi-step form

### Non-Conformity (NC) Tracking — Doc 2 Aligned

- **22 element categories** with 89 NC types matching Doc 2's exact names:
  - **Bay per-level** (5): Beam (7 NCs), Pallet Support Bar (3), Rear Pallet Stop Beam (4), Decking Panels (3), Pallet (7)
  - **Bay/rack-level** (7): Rear Safety Mesh (5), Underpass Protection (2), Horizontal Bracing (2), Vertical Bracing (2), Bay (5), Aisle (2), Entire Racking System (6)
  - **Frame elements** (6): Upright (6), Frame (2), Brace (2), Base Plate (6), Front Impact Guard (5), Corner Impact Guard (5)
  - **Other frame** (4): Guardrail (6), Load Sign (4), Top Tie Beam (5), Footplate (4)
- **Pie-chart severity markers** — multiple NCs on the same element render as a single pie-chart marker (both on 2D canvas and SVG views)
- **Marker placement engine** — 18 element-type position rules for auto-placing NC markers on the 2D layout
- **NC grouping** — NCs grouped by element for consolidated marker display
- **Inspection mode toggle** — Bay inspection splits into "Per Level" (beam, pallet support bar, etc.) and "Bay/Rack Level" (aisle, entire racking system, etc.)
- **Store migration** — Old NC IDs and element types auto-migrate on app load via `onRehydrateStorage`
- Traffic-light severity system (green / yellow / red) per NC type
- Notes, photos (up to 3), quantity, and FRONT/REAR face per NC

### NC Export & Summary

- **Export NCs to CSV** — RFC 4180 compliant CSV with 12 columns (Area, Rack, Bay/Frame, Level, Element, Position, Quantity, NC Type, Severity, Notes, Photos, Date)
- **Export buttons** — "Export NCs" on 2D layout toolbar (per area), "Export All NCs" on Working Areas page (all areas)
- **NC Summary Badge** — compact severity breakdown (red/yellow/green counts + proportional bar) shown on:
  - Rack list (per rack row)
  - Bay editor (top bar, replaces simple count)
  - Working Areas (per area card)
- **NC Summary Panel** — detailed collapsible panel in Bay editor with severity bar, percentages, and top 5 element types by NC count

### Reference Data

- 10 pre-loaded racking manufacturers (Mecalux, AR Racking, Dexion, SSI Schaefer, etc.) with ability to add custom manufacturers
- Standard frame sizes (3000mm to 12000mm height)
- Standard beam sizes (box beams, step beams, structural beams from 1800mm to 3600mm) with capacity ratings

---

## Latest Changes

### NC Export & Summary Views (Week 2)

- **CSV Export** — Full NC data export with 12 columns (Area, Rack, Bay/Frame, Level, Element, Position, Quantity, NC Type, Severity, Notes, Photos, Date). RFC 4180 compliant with proper field escaping
- **Export NCs button** on 2D layout toolbar — exports NCs for the current area
- **Export All NCs button** on Working Areas page — exports NCs across all areas in one CSV
- **NC Summary Badge** — compact inline component (full + compact modes) showing severity breakdown with colored dots and proportional bar. Integrated into Rack list, Bay editor, and Working Areas
- **NC Summary Panel** — collapsible detailed panel in Bay editor showing severity percentages and top 5 element types by NC count

### NC Alignment — Doc 2 Implementation (Week 1)

Complete rewrite of the NC system to match Doc 2's exact specifications:

- **22 element categories, 89 NC types** — all NC names match Doc 2 exactly
- **Bay inspection mode toggle** — "Per Level" (beam, pallet support bar, rear pallet stop beam, decking panels, pallet) vs "Bay/Rack Level" (rear safety mesh, underpass protection, horizontal/vertical bracing, bay, aisle, entire racking system)
- **Pie-chart severity markers** — multiple NCs on the same element show as a single pie chart with colored arcs (Konva Arc on canvas, SVG path in views)
- **Marker placement engine** — 18 element-type rules for default NC marker positions (inside bay, center, rear, frame, guards, edge, aisle)
- **NC grouping** — NCs grouped by element key for consolidated display
- **Store migration** — old NC IDs and element types (e.g. `frontGuard` → `frontImpactGuard`) auto-migrate on app load
- **Shared helpers** — `getNCTypeName()`, `resolveNcTypeId()`, `resolveElementType()` in `src/utils/ncHelpers.js`
- **Guard renaming** — `frontGuard` → `frontImpactGuard`, `cornerGuard` → `cornerImpactGuard` everywhere
- **FRONT/REAR only for beam & upright** — other elements skip the face selection step

### Canva-Like Layout Editor (Canvas Upgrade)

The 2D layout editor has been upgraded to a full interactive canvas editor with the following features:

- **Selection system** — Click to select rack, Shift+click for multi-select, drag on empty area to draw selection box
- **Transform handles** — Konva Transformer with rotation, resize (corner handles), and move on selected racks
- **Snap-to-grid** — Configurable grid snap (Off / 10px / 25px / 50px) during rack dragging
- **Alignment guides** — Cyan (vertical) and green (horizontal) guide lines when racks align edges/centers with other racks
- **Keyboard shortcuts**:
  - `Delete` / `Backspace` — delete selected racks (with confirmation)
  - `Ctrl+D` — duplicate selected racks (offset +50, +50)
  - `Ctrl+Z` — undo, `Ctrl+Shift+Z` / `Ctrl+Y` — redo
  - `Ctrl+A` — select all, `Escape` — deselect all
  - Arrow keys — nudge 1px (Shift+Arrow = 10px)
  - `R` — rotate 90deg, `V` — flip vertical, `H` — flip horizontal
- **Right-click context menu** — Edit Properties, Duplicate, Rotate 90deg, Delete
- **Properties panel** — Side panel for editing selected rack name, X/Y position, rotation; multi-select shows alignment and distribute buttons
- **Undo/Redo** — Full undo/redo history (max 50 snapshots, session-only) with toolbar buttons
- **Enhanced toolbar** — Tool selector (Select/Pan), edit mode toggle, grid snap dropdown, NC marker size controls, zoom controls, undo/redo buttons
- **Draggable NC markers** — NC markers can be repositioned in edit mode; positions persist via `markerX`/`markerY` fields in ncStore

### Bay Editor Improvements

- **Bay navigation** — Previous/Next buttons, dropdown selector, and counter (e.g. "13 / 15") for navigating between bays in BayEditorPage
- **SVG beam clipping fix** — BayFrontView now computes `effectiveHeight = max(frameHeight, maxBeamElevation) * 1.08` so beams above frame height are visible
- **Level count cap raised** — Maximum levels increased from 10 to 20 in both BayConfig and RackWizard

### Form Validations

- **New Inspection form** (Client Info step): End Customer required, email regex, phone input with country code picker (23 countries), inline error messages
- **Beam Editor** — Length (1-10000mm), Height (1-500mm), Depth (1-500mm), Thickness (0.1-50mm) with inline errors
- **Frame Editor** — Upright height (1-20000mm), Width (1-500mm), Depth (1-5000mm), whole-number bracing quantities

### Bug Fixes

- **Page height overflow** — LayoutEditor, BayEditorPage, FrameEditorPage use `h-[calc(100vh-4rem)]`
- **Selection vs navigation conflict** — Edit mode click selects parent rack instead of navigating
- **"Apply to all levels" bug** — Now correctly scoped to current bay only (was affecting all bays)

---

## Progress Overview

**Overall completion: ~85% of total client scope across 3 client documents + developer clarifications.**

| Document | Coverage | Status |
|----------|----------|--------|
| Doc 1: Specification List for Phase 1 (initial) | ~80% | Ch 1-5 mostly done. Ch 6 (Data Export) 50% — CSV export done, XLSX/ZIP/PDF pending. Missing: bay description field, frame compatibility check |
| Doc 2: NC Marker Rules & NC List for Elements (initial) | ~90% | All 22 element categories with exact Doc 2 NC names. Placement engine done. Pie-chart markers done. Remaining: Scope Table categories |
| Doc 3: App Analysis (20260403 — first client review) | ~90% | Sections 2-4 complete. Section 1 at 60% (Accessories Editor + Import DB deferred by client) |
| Clarification Questions (developer-raised, Q1-Q13) | ~90% | Q1-Q11 implemented, Q12 (placement rules) now implemented, Q13 pending |

---

## Storage & Database

- **Engine:** All data persisted to browser `localStorage` via Zustand persist middleware
- **Backend:** None — the app runs entirely in the browser with no server or cloud database
- **Stores:** `inspectionStore`, `rackStore`, `ncStore`, `beamDatabaseStore`, `frameDatabaseStore`, `supplierStore`
- **Photos:** Stored as base64 strings in localStorage. Large inspections with many photos may approach browser limits (~5-10MB)
- **Portability:** Data lives on the device's browser only. Clearing browser data erases all inspections

---

## Document Compliance Audit

### Doc 1 (Specification List for Phase 1) — ~75% Complete

**7-chapter specification document (43 pages) — the most comprehensive Phase 1 spec.**

#### Ch 1: Initial Structure — 90% Complete

| Requirement | Status | Notes |
|-------------|--------|-------|
| New inspection creation with client details | Done | |
| Renewal inspections workflow | Done | |
| Client data entry (reseller, end customer, address, contacts) | Done | |
| Working areas management | Done | |
| Status badges (draft/completed) | Done | |

#### Ch 2: Rack Creation Wizard — 85% Complete

| Requirement | Status | Notes |
|-------------|--------|-------|
| Simplified wizard (manufacturer, bays, bay length, levels, elevations, frame) | Done | |
| Manufacturer selection from database | Done | |
| Frame database with filtered suggestions (same manufacturer, depth, height) | Done | |
| Automatic frame compatibility check (height > highest elevation) | Not done | Doc specifies validation warning |
| Final summary before creation confirmation | Not done | Wizard creates directly without summary step |
| Auto-generation in 2D layout on creation | Done | |

#### Ch 3: Rack List Management — 80% Complete

| Requirement | Status | Notes |
|-------------|--------|-------|
| Table view with rack name, manufacturer, total bays | Done | |
| "Bay Description" field (e.g. "3x2700+1x1800+1x2700") | Not done | Doc specifies synthetic format showing bay lengths and sequence |
| Rack orientation (left-to-right numbering from front) | Done | |
| Create new rack (wizard + duplicate) | Done | |
| Duplicate naming ("Copy of (1)", "Copy of (1) (2)") | Partial | Duplicates exist but naming format may differ |
| Edit rack (re-open wizard pre-filled) | Done | |
| Delete with confirmation | Done | |
| Action menu (three-dots) per rack row | Done | |
| Auto-creation in 2D layout | Done | |

#### Ch 4: Rack Editor — Bay & Frame Management — 90% Complete

| Requirement | Status | Notes |
|-------------|--------|-------|
| Bay editor: left area (front view SVG) + right area (tabs) | Done | |
| Bay Configuration tab (frames, levels, beam type, elevation, accessories) | Done | |
| Bay Inspection tab (NC recording on beams, levels, accessories) | Done | |
| Touch-first element selection on front drawing | Done | |
| FRONT/REAR position specification for beams | Done | |
| Quick NC buttons + "Other" dropdown | Done | |
| Severity (green/yellow/red) | Done | |
| Photo attachment (camera + gallery, multiple per NC) | Done | |
| Save NC button (enabled only when element + NC type + severity selected) | Done | |
| NC graphical indicator (colored dot) on front view + layout | Done | |
| Multiple NC entry (fields reset, stay on same screen) | Done | |
| Return to layout button | Done | |
| Copy configuration to other bays | Done | |
| Frame editor: left area (schematic drawing) + right area (tabs) | Done | |
| Frame Configuration tab (frame modification, accessories) | Done | |
| Frame Inspection tab (upright front/rear, diagonal numbered, h-brace numbered, base plate, load sign) | Done | |
| Frame NC recording with same flow as bay | Done | |

#### Ch 5: 2D Layout Editor — 85% Complete

| Requirement | Status | Notes |
|-------------|--------|-------|
| Unlimited 2D workspace | Done | |
| Edit Layout mode (padlock icon toggle) | Done | |
| Move racks by dragging | Done | |
| Alignment guide lines (Canva-style) | Done | |
| Rotate racks (90°/180°/270°/360° + manual angle) | Done | |
| Managing distances between racks (display + editable field) | Not done | Future enhancement |
| Import external layouts (vector PDF / AutoCAD) | Not done | Future enhancement |
| Lock layout (prevent movement) | Done | |
| Zoom (pinch gesture) + Pan (drag) | Done | |
| Layout export to PDF (vector, plot extents style) | Not done | Future enhancement |
| Graphical numbering of bays and frames on layout | Done | |

#### Ch 6: Data Extraction (Export) — 50% Complete

| Requirement | Status | Notes |
|-------------|--------|-------|
| Export NC data to CSV | Done | RFC 4180 compliant, 12 columns, browser download |
| Column structure: Area, Rack, Bay/Frame, Level, Element, Position, Quantity, NC Type, Severity, Notes, Photos, Date | Done | |
| Export UI: "Export NCs" button on layout toolbar + "Export All NCs" on Working Areas | Done | |
| Extraction rules (only NCs, one row per NC) | Done | |
| Export to XLSX format | Not done | Currently CSV only |
| Photo export: clickable links in XLSX, filenames in CSV | Not done | |
| ZIP bundle (inspection.xlsx + /photos/ folder) | Not done | |
| Layout PDF export (vector, per working area) | Not done | Future enhancement |
| Integration: NC export + layout PDF + photos as complete package | Not done | Future enhancement |

#### Ch 7: Attachments — Reference Only (no implementation needed)

Glossary, MVP purpose, data structure definitions. Used as reference throughout development.

---

### Doc 3 (App Analysis), Section 1: Editors & Database — 60% Complete (3 of 5 items built, 2 deferred by client)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Beam Editor — full CRUD, supplier link, type, dimensions, finish, features, supplier code | Done | |
| Frame Editor — full CRUD, supplier link, type, upright specs, depth, bracing qty, finish | Done | |
| Supplier Editor — name + color | Done | |
| Beam/Frame auto-naming | Done | Default formats, client may customize |
| Duplicate & Edit | Done | |
| Editor panel on Home Screen | Done | |
| Form validations (all dimension fields) | Done | |
| Accessories Editor | Deferred | Phase 5 per client |
| Import DB (CSV bulk upload) | Deferred | Phase 5 per client |

### Doc 3 (App Analysis), Section 2: Layout — 100% Complete

| Requirement | Status | Notes |
|-------------|--------|-------|
| Supplier color-coding on racks | Done | |
| Color legend | Done | |
| Snap-to-grid + alignment guides | Done | |
| Selection, multi-select, drag select | Done | |
| Transform handles (move, rotate, resize) | Done | |
| Keyboard shortcuts (full set) | Done | |
| Right-click context menu | Done | |
| Properties panel | Done | |
| Undo/Redo (50 snapshots) | Done | |
| Import floor plan (vector PDF) | Future | Client marked as future |
| Editable distances | Future | Client marked as future |

### Doc 3 (App Analysis), Section 3: Bay View & Configuration — 95% Complete

| Requirement | Status | Notes |
|-------------|--------|-------|
| Bay width at bottom | Done | |
| Beam names from DB | Done | |
| Interaxis dimensions + "From ground" column | Done | |
| Bay info: number, rack, supplier, bay length filter | Done | |
| Per-level beam panels with filtered dropdowns | Done | |
| "New Beam" button | Done | |
| "Apply to all levels" bug fix | Done | |
| Per-level accessories | Done (interim) | Free-text until Accessories Editor |
| Left/Right frame selection (independent, filtered) | Done | |
| "New Frame" button | Done | |
| Duplicate Configuration with bay checkboxes | Done | |
| Level count raised to 20 | Done | |

### Doc 3 (App Analysis), Section 4: Inspection — 95% Complete

| Requirement | Status | Notes |
|-------------|--------|-------|
| Touch-first NC flow (tap level → element → FRONT/REAR → NC → severity → photos → save) | Done | |
| Quick NC buttons + "Other" dropdown | Done | Updated with Doc 2 NC names |
| NC on all 22 element categories | Done | 12 bay elements (5 per-level + 7 bay-level) + 10 frame elements |
| NC on frames (diagonal, cross member, load sign, protections) | Done | |
| NC on uprights (upright, footplate, top tie beam, impact guards) | Done | Renamed to Doc 2 names |
| Numbered diagonal/cross member selection | Done | |
| Severity picker (green/yellow/red) | Done | |
| Photo capture (up to 3 per NC) | Done | |
| Quantity field | Done | |
| Notes field | Done | |
| NC markers on 2D layout (colored, sized, tap/long-press) | Done | With placement engine + pie-chart grouping |
| NC markers draggable | Done | |
| NC marker placement rules (from Doc 2) | Done | 18 element-type placement rules implemented |
| Pie-chart severity markers | Done | Konva Arc on canvas, SVG path in views |
| Bay inspection mode toggle (per-level / bay-level) | Done | |

### Clarification Questions (Developer-Raised) — 90% Complete

| Question | Status | Notes |
|----------|--------|-------|
| Q1. Beam name format | Implemented | Default: `"{Type} {Length}x{Height} - {Supplier}"` |
| Q2. Frame name format | Implemented | Default: `"{FrameType} {Height}x{Depth} - {Supplier}"` |
| Q3. Finish color input | Implemented | Free text (e.g. "RAL 5010 Blue") |
| Q4. Shared supplier list | Implemented | Single `supplierStore` across all editors |
| Q5. Beam filter exact match | Implemented | Exact match on `beam.length === bayLength` |
| Q6. Accessories before editor | Implemented | Free-text + notes as interim |
| Q7. Duplicate config scope | Implemented | Copies beams + accessories |
| Q8. Rack depth for frame filter | Implemented | Uses `rack.frameDepth` |
| Q9. NC types for new elements | Implemented | All 22 categories with exact Doc 2 NC names |
| Q10. Common vs "Other" NCs | Implemented | First 3 as quick buttons, rest as Other |
| Q11. Photo capture method | Implemented | Both camera and gallery via `accept="image/*"` |
| Q12. NC marker placement rules | Implemented | 18 element-type placement rules + pie-chart markers |
| Q13. FRONT/REAR in reports | Stored | `face` field saved; export not yet built |

### Doc 2 (NC Marker Rules & NC List): NC Types & Marker Rules — ~90% Complete

| Requirement | Status | Notes |
|-------------|--------|-------|
| 18 element types with exact NC lists from Doc 2 | Done | All 18 Doc 2 elements + 4 Doc 3 extras (basePlate, loadSign, topTieBeam, footplate) = 22 total categories, 89 NC types |
| Marker placement engine (18 position rules) | Done | `computeMarkerPosition()` in `src/utils/markerPlacement.js` — handles inside-bay, center, rear, frame, guards, edge, aisle positions |
| Pie-chart severity markers | Done | Konva `Arc` slices on 2D canvas (`NCMarker.jsx`), SVG `path` arcs in views (`SVGPieMarker.jsx`) |
| NC grouping by element | Done | `groupNCsByElement()` in `src/utils/ncGrouping.js` — groups NCs for consolidated pie markers |
| Old NC migration | Done | `NC_ID_MIGRATION` + `ELEMENT_TYPE_MIGRATION` maps in ncTypes.js, auto-applied via `onRehydrateStorage` in ncStore |
| Bay inspection mode toggle | Done | Per-level (5 elements) vs Bay/rack-level (7 elements) toggle in BayInspection |
| Frame guard renaming | Done | `frontGuard` → `frontImpactGuard`, `cornerGuard` → `cornerImpactGuard` |
| Scope Table categories | Not started | Doc 2 defines: Missing, To be corrected, Obsolete, To be repositioned |

---

## Current Milestone Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Beam & Frame Database Editors | Done |
| Phase 2 | Bay Configuration Rework | Done |
| Phase 3 | Inspection Functionality Rework | Done |
| Phase 4 | Layout Enhancements | Done |
| Phase 5a | NC Alignment (Doc 2) | Done |
| Phase 5b | Accessories + Export | Next |

---

## Remaining Work — $4,500 Scope

| Week | Milestone | Cost | Status | Deliverables |
|------|-----------|------|--------|-------------|
| Week 1 | M1: NC Alignment | $1,500 | **DONE** | 22 NC element types, exact Doc 2 names, placement engine, pie-chart markers, store migration, inspection mode toggle |
| Week 2 | M2: Clarifications + M3: Export | $700 | **DONE** | CSV export (12 columns), Export buttons on layout + working areas, NC summary badges + panels across all pages |
| Week 3 | M4: Accessories + Import | $800 | Pending | Accessories Editor (full CRUD), replace free-text with DB dropdown, CSV import for beams/frames/accessories |
| Week 4 | M5: Polish & Testing + Contingency | $1,500 | Pending | Tablet touch optimization, performance pass, edge cases, bug fixes |
| **Total** | | **$4,500** | **25% done** | |

---

## What's Next — Prioritized Backlog

### Immediate (Week 2 — Export & Clarifications)

| # | Task | Priority | Effort | Notes |
|---|------|----------|--------|-------|
| 1 | **NC Data Export to CSV/XLSX** | High | 2-3 days | Doc 1 Ch 6: Export button, column structure (Lot, Manufacturer, Rack, Level, Element, Anomaly, Severity, Photo, Notes), one row per NC |
| 2 | **NC Summary View** | High | 1 day | Summary panel showing NC counts by severity (green/yellow/red) per rack and per area |
| 3 | **Photo export in ZIP bundle** | Medium | 1 day | ZIP containing inspection.xlsx + /photos/ folder with filenames referenced in XLSX |
| 4 | **Scope Table categories** | Medium | 0.5 day | Doc 2 defines: Missing, To be corrected, Obsolete, To be repositioned — categorize NCs |
| 5 | **Q13: FRONT/REAR in export** | Low | 0.5 day | Include face column in export output |

### Short-term (Week 3 — Accessories & Import)

| # | Task | Priority | Effort | Notes |
|---|------|----------|--------|-------|
| 6 | **Accessories Editor** | High | 2 days | Full CRUD for accessories (similar to Beam/Frame editors), with supplier link |
| 7 | **Replace free-text accessories** | High | 1 day | Bay config: swap free-text accessory fields with DB dropdown from Accessories Editor |
| 8 | **CSV Import for beams/frames/accessories** | Medium | 1-2 days | Bulk upload from CSV, validate columns, preview before import |

### Medium-term (Week 4 — Polish & Gaps)

| # | Task | Priority | Effort | Notes |
|---|------|----------|--------|-------|
| 9 | **Tablet touch optimization** | High | 1-2 days | Larger touch targets, swipe gestures, responsive panels |
| 10 | **Frame compatibility check** | Medium | 0.5 day | Doc 1 Ch 2: Warn if frame height < highest beam elevation |
| 11 | **Rack wizard summary step** | Low | 0.5 day | Doc 1 Ch 2: Show summary before creation confirmation |
| 12 | **Bay description field** | Low | 0.5 day | Doc 1 Ch 3: Synthetic format "3x2700+1x1800+1x2700" |
| 13 | **Performance pass** | Medium | 1 day | Virtual scrolling for large lists, memo optimization, lazy loading |
| 14 | **Edge case bug fixes** | Medium | 1-2 days | Testing & fixing across all inspection flows |

### Not in Current Scope (Future)

| Task | Notes |
|------|-------|
| PDF Report Generation | Branded inspection reports with photos + severity summary |
| Layout PDF Export | Vector PDF per working area (Doc 1 Ch 5) |
| Import Floor Plan | Vector PDF/AutoCAD as scaled background in 2D layout |
| Backend / Cloud Sync | Server-side storage, multi-device sync |
| Multi-User Auth | Inspector accounts, admin roles |
| Offline PWA | Service worker for full offline capability |
| Dashboard & Analytics | NC trends, completion rates, severity distribution |

---

---

## Project Structure

```
src/
├── components/
│   ├── BayEditor/        # Bay inspection, config & front view
│   ├── Canvas/           # Konva-based layout: LayoutCanvas, RackShape, BayShape, FrameShape, NCMarker
│   ├── FrameEditor/      # Frame inspection, config & view
│   ├── Layout/           # Header & Sidebar
│   ├── ui/               # Reusable UI: Button, Input, Select, Modal, Card, PhoneInput
│   └── Wizard/           # Rack creation wizard
├── data/                 # Reference data: manufacturers, beams, frames, NC types (with migration maps)
├── pages/                # Route pages: Home, NewInspection, WorkingAreas, RackList, LayoutEditor, BayEditorPage, FrameEditorPage, BeamEditorPage, FrameDatabaseEditorPage, SupplierEditorPage, RenewalsPage
├── stores/               # Zustand stores: inspectionStore, rackStore, ncStore (with migration), beamDatabaseStore, frameDatabaseStore, supplierStore
├── utils/                # Shared utilities: ncHelpers, markerPlacement, ncGrouping
├── App.jsx               # Router & route definitions
└── main.jsx              # Entry point
```

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start dev server         |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |
