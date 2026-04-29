# RackVision

Warehouse Racking Inspection Platform — a web application for conducting, managing, and documenting warehouse pallet racking inspections.h

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
- **Pie-chart severity markers** — multiple NCs on the same element render as a single pie-chart marker (both on 2D canvas and SVG views) — enabled in production
- **Marker placement engine** — 18 element-type position rules for auto-placing NC markers on the 2D layout
- **NC grouping** — NCs grouped by element for consolidated marker display
- **Inspection mode toggle** — Bay inspection splits into "Per Level" (beam, pallet support bar, etc.) and "Bay/Rack Level" (aisle, entire racking system, etc.)
- **Store migration** — Old NC IDs and element types auto-migrate on app load via `onRehydrateStorage`
- Traffic-light severity system (green / yellow / red) per NC type
- Notes, photos (up to 3), quantity, and FRONT/REAR face per NC

### NC Export & Summary

- **Export NCs (3 formats)** — CSV, XLSX, or ZIP bundle via dropdown menu on toolbar
  - **CSV** — RFC 4180 compliant with UTF-8 BOM for Excel compatibility
  - **XLSX** — Native Excel format with proper column widths using SheetJS
  - **ZIP** — Bundle containing `inspection.xlsx` + `/photos/` folder with all NC photos
- **13 columns per Doc 1 Ch 6.2** — Lot, Manufacturer, Rack name, Reference, Level, Position, Quantity, Element, Photo, Description, Anomaly, Damage, Scope
- **Export buttons** — "Export NCs" on 2D layout toolbar (per area), "Export All NCs" on Working Areas page (all areas)
- **Pie-chart severity markers** — multiple NCs on the same element render as a single pie-chart marker (both on 2D canvas and SVG views)
- **Scope Table categories (Doc 2)** — NCs classified as Missing, To be corrected, To be repositioned, or Other
- **NC Summary Badge** — compact severity breakdown (red/yellow/green counts + proportional bar) shown on:
  - Rack list (per rack row)
  - Bay editor (top bar, replaces simple count)
  - Working Areas (per area card)
- **NC Summary Panel** — detailed collapsible panel in Bay editor with severity breakdown, scope breakdown, percentages, and top 5 element types

### Reference Data

- 10 pre-loaded racking manufacturers (Mecalux, AR Racking, Dexion, SSI Schaefer, etc.) with ability to add custom manufacturers
- Standard frame sizes (3000mm to 12000mm height)
- Standard beam sizes (box beams, step beams, structural beams from 1800mm to 3600mm) with capacity ratings

---

## Latest Changes

### Doc 5 — Milestone C: UX Improvements (v1.5.0)

- **Level auto-select from SVG** — Clicking a beam (e.g. L2) on the bay front view SVG auto-switches to the Inspection tab with that level pre-selected and element buttons shown
- **Inline beam/frame creation in wizard** — Steps 4 and 6 now have "+ New Beam" / "+ New Frame" buttons that expand an inline form with Name, dimensions. Created items are auto-selected.
- **Inspection card enrichment** — Home page cards now show reseller, contact name, and site address (when filled)
- **Delete inspection** — Trash icon on each inspection card with confirmation modal showing area/rack/NC counts. Deletes all associated data.

### Doc 5 — Milestone B: Data Flow Fixes (v1.4.0)

- **Per-bay width on 2D layout** — Each bay now renders at its own `customLength` on the canvas instead of using the rack-level default for all bays. Racks with mixed bay sizes (e.g. 1800mm + 2700mm + 3600mm) display correctly.
- **Wizard data propagation** — Beam and frame selections made in the Rack Wizard now auto-populate every bay's `beamSelections` (all levels) and `leftFrameDbId`/`rightFrameDbId`. No more empty bay configs after wizard completion.
- **Canvas position persistence** — Pan position is saved per working area and restored when re-entering the layout editor. Zoom level is also persisted.

### Doc 5 — Milestone A: Quick Fixes (v1.3.0)

- **Home button** — RackVision logo in header is now clickable, navigates to home page from any screen
- **Frame labels corrected** — Bay config "Left Frame"/"Right Frame" renamed to "Front Frame"/"Rear Frame"
- **Rack name repositioned** — Rack name now appears beside the last frame, vertically centered in the rack body (was floating above)

### Safe Rack Deletion & NC Management

- **Delete confirmation modal** — Deleting a rack (right-click → Delete, or keyboard Delete/Backspace) now shows a detailed modal listing what will be lost: rack name, bay count, frame count, and NC count. NCs are highlighted in red since they represent recorded inspection data.
- **"Clear NCs Only" option** — New button inside the delete modal lets you remove all NCs from a rack without deleting the rack itself. Useful when re-doing an inspection on the same rack structure.
- **"Clear NCs" in context menu** — Right-click context menu now shows a "Clear X NCs" option (amber) when the rack has recorded NCs, separate from the destructive "Delete Rack" (red).
- **Multi-rack keyboard delete** — Selecting multiple racks and pressing Delete/Backspace also uses the new confirmation modal with combined totals.

### Per-Level Accessories, Feature Flags & DB Enhancements

- **Per-level accessories** — Each beam level's expanded panel now has its own accessory picker (DB-backed + custom entries). Data stored in `bayConfig.levelAccessories` keyed by level index. Duplicated when copying bay config.
- **Accessory Database** — New `accessoryDatabaseStore` with CRUD, 11 categories, supplier filtering. Dedicated `AccessoryEditorPage` at `/editors/accessories`.
- **Beam description field** — `beamDatabaseStore` now supports `description`; visible in editor list + form.
- **Frame customName + description** — `frameDatabaseStore` supports `customName` (overrides auto-generated name) and `description`.
- **Bay-level accessories in Bay Information** — DB-backed accessory selector with supplier filtering, custom entries, and "From database" tags.
- **Pie-chart markers** — Pie-chart severity markers now visible across all environments.
- **Per-bay independence fix** — Added `key={bayId}` to BayFrontView, BayConfig, BayInspection to force re-mount on bay navigation (fixes stale local state).

### Doc 4 (Gagliardi) Round 2 — Beam/Frame DB Hardening + Navigation

Proper architectural fix for the "I can't select my beam in BayConfig" report. The two stacked root causes were: (1) the editors let you save garbage data (no supplier, zero dimensions), and (2) BayConfig used the database filter as a hard gate on length, hiding any beam that didn't exactly match the current bay length.

- **Required-field validation in Beam Editor** — `BeamEditorPage` now requires Supplier, Length, Height, Depth, and Thickness. All fields show inline red errors and the form refuses to save until they're filled. Editing a legacy bad beam is also blocked until the user fills in the missing fields (verified end-to-end with Playwright on a seeded `dede` beam — see Browser Verification Tests below).
- **Required-field validation in Frame Database Editor** — `FrameDatabaseEditorPage` now requires Supplier, Upright Height, Upright Width, and Depth.
- **Database filter rewritten as supplier-only** — `getFilteredBeams(supplierId)` and `getFilteredFrames(supplierId)` no longer take dimension arguments. Length / depth / minHeight are computed at the call site for **sort order and visual hints**, not as exclusion filters.
- **Bay length follows the chosen beam, not the other way around** — `BayConfig` now sorts beams by closeness to the current bay length (exact match first), shows the length in **amber** when it doesn't match, and **auto-syncs `customLength`** to the chosen beam's length on click. This matches physical reality: the bay's width *is* its beams' length.
- **Frame depth follows the chosen frame** — `BayConfig` shows each frame as `Name — D{depth} H{height}` with `⚠` markers when depth ≠ rack frame depth or height < top beam elevation. Selecting a different-depth frame syncs `rack.frameDepth` automatically.
- **Context-aware back navigation in editors** — `BeamEditorPage` and `FrameDatabaseEditorPage` back arrows now check `showForm` state. From the form they close the form and return to the list; from the list they go to Home. Previously the back arrow always jumped straight to Home from inside the form, skipping the list.

### Doc 4 (Gagliardi) Round 1 — Quick Fixes

First batch of fixes from the second client review. 5 of 16 Doc 4 items shipped. All low-risk, all inside existing budget.

- **Drop `F` prefix from frame labels (2.1b)** — `RackShape` → `FrameShape` now renders `1`, `2`, `3`... instead of `F1`, `F2`, `F3` on the 2D layout
- **Upright labels FRONT / REAR (4b)** — Frame side-elevation view in `FrameView.jsx` now labels uprights as `FRONT` (left, near viewer) and `REAR` (right) instead of `L` / `R`. Labels moved above the upright rectangles so the longer text fits cleanly
- **Bay width dimension refresh bug (3.3)** — `BayFrontView` now reads `bay.bayConfig.customLength` first and falls back to `rack.bayLength`. The `useMemo` dependency array was updated so the bay width label re-renders when the user changes the bay length in `BayConfig`
- **Bay supplier locked to Rack Wizard (3.1a)** — `BayConfig` no longer shows an editable supplier dropdown. The supplier is displayed read-only, sourced from the parent rack, with a helper note explaining it's set in the wizard. Removed unused `handleSupplierChange` and `supplierOptions`
- **Beam Name field added to Beam Editor (3.1b)** — `BeamEditorPage` now has a top-level "Beam Name" input. Empty input → name is auto-generated from type/dimensions/supplier (existing behavior preserved). Filled input → custom name is used and persisted on a new `customName` field in `beamDatabaseStore`. The placeholder shows the live auto-generated name as the user fills in other fields

### Export, Scope Categories & Summary (Week 2)

- **3-format export** — Export dropdown on toolbar with CSV, XLSX (SheetJS), and ZIP bundle (JSZip + file-saver) options
- **XLSX export** — Native Excel file with column widths, proper headers, one row per NC
- **ZIP bundle** — Contains `inspection.xlsx` + `/photos/` folder with all NC photos as image files (NC_00001_1.jpg naming)
- **13 columns per Doc 1 Ch 6.2** — Lot, Manufacturer, Rack name, Reference, Level, Position, Quantity, Element, Photo, Description, Anomaly, Damage + Scope
- **Scope Table categories (Doc 2)** — 4 categories (Missing, To be corrected, To be repositioned, Other) auto-derived from NC type names. Added to export + NC Summary Panel
- **NC Summary Badge** — compact inline severity breakdown integrated into Rack list, Bay editor, and Working Areas
- **NC Summary Panel** — collapsible detailed panel with severity breakdown, scope breakdown, and top 5 element types

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
- **"Edit Properties" blank page** — Right-click → Edit Properties was navigating to a non-existent route. Now opens the properties side panel correctly.
- **Duplicated rack not draggable** — Duplicated racks were overlapping the original (only 50px offset) and couldn't be grabbed. Fixed: duplicate now places below the original based on actual rack depth, and Konva node refs resolve correctly after render so the rack is immediately selectable and draggable.

---

## Progress Overview

**Overall completion: ~98% of Milestone 1-2 scope (SOW). $4,500 scope fully delivered. Only Italian i18n remains from client meeting points.**


| Document / Area                                  | Coverage | Status                                                                                                                                 |
| ------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Doc 1: Specification List for Phase 1            | ~95%     | Ch 1-6 done. Layout PDF done. Bay description done. Frame compat check done. Renewals done. Pending: layout PDF vector export (future) |
| Doc 2: NC Marker Rules & NC List for Elements    | ~95%     | All 22 element categories, exact Doc 2 names. Placement engine + pie-chart markers (production). Scope Table done                      |
| Doc 3: App Analysis (first client review)        | ~95%     | Sections 1-4 complete. Accessories Editor done (DB + CRUD). Import DB deferred by client                                               |
| Doc 4: Gagliardi Feedback (second client review) | **100%** | 16/16 items shipped                                                                                                                    |
| SOW Milestone 1                                  | **100%** | Wizard, layout, editors, databases all complete                                                                                        |
| SOW Milestone 2                                  | **~95%** | Bay/frame config, inspection, export, per-level accessories done. Pending: Italian language                                            |
| Client Meeting Points (April 2026)               | **~90%** | 22/23 points done. Pending: Italian i18n                                                                                               |


---

## Storage & Database

- **Engine:** All data persisted to browser `localStorage` via Zustand persist middleware
- **Backend:** None — the app runs entirely in the browser with no server or cloud database
- **Stores:** `inspectionStore`, `rackStore`, `ncStore`, `beamDatabaseStore`, `frameDatabaseStore`, `supplierStore`, `accessoryDatabaseStore`
- **Photos:** Stored as base64 strings in localStorage. Large inspections with many photos may approach browser limits (~5-10MB)
- **Portability:** Data lives on the device's browser only. Clearing browser data erases all inspections

---

## Browser Verification Tests

End-to-end browser smoke tests are run with **Playwright (headless Chromium)** against the live Vite dev server. They are kept **outside the project tree** (under `/tmp/rackvision-verify/`) so the project's `package.json` and `node_modules` stay clean. This is intentional — these tests are an operational tool used by Claude during fix verification, not a CI suite.

### How to run

```bash
# 1. Start the dev server (in one terminal)
npm run dev

# 2. Set up the verifier (one-time, in another terminal)
mkdir -p /tmp/rackvision-verify && cd /tmp/rackvision-verify
npm init -y >/dev/null
npm install --silent playwright@latest
npx playwright install chromium

# 3. Run the verification script
node verify.mjs
```

The script:

1. Launches headless Chromium at 1280×900
2. Navigates the app at `http://localhost:5173` (or whatever port Vite chose — check the dev server output)
3. Drives each user flow with `page.getByRole(...)` / `page.getByText(...)` selectors
4. Asserts visible state (error messages, URL changes, button visibility)
5. Saves screenshots to `/tmp/rackvision-verify/screenshots/` for visual evidence
6. Captures any `console` or `pageerror` events and reports them at the end
7. Prints a PASS/FAIL summary table

### Conventions

- **One try/catch per flow** — a failure in one flow does not prevent the others from running
- **Selectors prefer visible text** — `getByRole('button', { name: 'Save Beam' })` over fragile CSS selectors
- **Icon-only buttons** are located via DOM structure (e.g., the back arrow is "the first button before the page `h1`")
- **Seed bad data via `localStorage.setItem`** when a flow needs to test edit-of-broken-data — never commit broken data via the UI
- **Always `localStorage.clear()`** at the start of any flow that needs a known-empty state, especially for "supplier required" assertions

### Currently verified flows


| ID                     | Flow                                                                               | Validates                                                                                                                                                                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**                  | Beam Editor empty save                                                             | Required errors on Supplier, Length, Height, Depth, Thickness                                                                                                                                                                                                                            |
| **B**                  | Beam Editor partial save                                                           | Only Supplier error remains after dimensions filled                                                                                                                                                                                                                                      |
| **C**                  | Edit existing bad beam                                                             | Saved-then-broken legacy data is blocked on update                                                                                                                                                                                                                                       |
| **D**                  | Back navigation context                                                            | Back from list → Home; Back from form → list (URL preserved)                                                                                                                                                                                                                             |
| **E**                  | Frame Editor empty save                                                            | Required errors on Supplier, Upright Height, Upright Width, Depth                                                                                                                                                                                                                        |
| **Doc4-Comprehensive** | Full Doc 4 audit (20 checks across wizard / 2D layout / bay config / frame config) | 13 PASS / 6 FAIL / 1 NOT_TESTABLE — real compliance **9 of 15 testable (60%)**                                                                                                                                                                                                           |
| **W1**                 | Wizard step 1 empty-state when no suppliers                                        | Empty-state message + "Open Supplier Editor" CTA; Next disabled                                                                                                                                                                                                                          |
| **W2**                 | Wizard step 4 empty-state when supplier has no beams                               | Empty-state message + "Open Beam Editor" CTA; Next disabled                                                                                                                                                                                                                              |
| **W3**                 | Wizard filters beams & frames by selected supplier                                 | Only Acme beams/frames shown when Acme selected; Beta rows hidden; rack persists with `supplierId`, `supplierName`, `beamId`, `frameId`, `bayLength`                                                                                                                                     |
| **4a-left**            | Left upright click opens left frame editor                                         | Clicking leftmost upright rect in `BayFrontView` navigates to `/frame/{frames[bayIndex].id}`                                                                                                                                                                                             |
| **4a-right**           | Right upright click opens right frame editor                                       | Clicking rightmost upright rect navigates to `/frame/{frames[bayIndex+1].id}`                                                                                                                                                                                                            |
| **2.1d-a**             | Label font control is present in toolbar                                           | `Label 100%` chip visible on layout page                                                                                                                                                                                                                                                 |
| **2.1d-b**             | Increase label font size                                                           | Two Plus clicks → `Label 150%`                                                                                                                                                                                                                                                           |
| **2.1d-c**             | Decrease label font size                                                           | One Minus click → `Label 75%`                                                                                                                                                                                                                                                            |
| **2.1d-d**             | Clamp at lower bound                                                               | Ten Minus clicks → `Label 50%` (does not go below)                                                                                                                                                                                                                                       |
| **2.1d-e**             | Clamp at upper bound                                                               | Twenty Plus clicks → `Label 300%` (does not go above)                                                                                                                                                                                                                                    |
| **E2E-1**              | Empty wizard shows "No suppliers" state                                            | Opens wizard with empty DB, asserts `No suppliers in your database` visible                                                                                                                                                                                                              |
| **E2E-2**              | Full happy path via real UI                                                        | Creates supplier `Merclus` → beam (2700 len) → frame (6000 h) via **actual editor pages**, walks all 7 wizard steps, asserts rack persisted with matching `supplierId`, `supplierName`, `beamId`, `frameId`, `bayLength=2700`, `frameHeight=6000`, `frameDepth=1000`, `uprightWidth=100` |
| **E2E-3**              | Beam appears in wizard immediately after save                                      | Creates beam via Beam Editor, opens wizard, advances to step 4 — asserts `No beams in the database` is **not** shown                                                                                                                                                                     |
| **E2E-4**              | Two-supplier isolation                                                             | Creates Merclus + Acme, adds beam to Acme only, opens wizard selecting Merclus — asserts empty state for Merclus and Acme's 2500 beam does **not** leak                                                                                                                                  |


All flows currently pass (verified 2026-04-10) with **0 new console errors**. Screenshots: `01-beam-required-errors.png` through `06-frame-required-errors.png`.

**Doc 4 Comprehensive run (2026-04-10) findings:**

- ✅ **4 items previously marked "Not done" are actually passing in production:** 1.3 (wizard frame DB validation), 2.1a (rack name position), 3.2 (inline accessory add), 4c (upright depth dimension). README Doc 4 table updated accordingly.
- ❌ **6 true failures:** 1.1 / 1.2 (wizard still uses static `beams.js` / `frames.js` — not `supplierStore`/`beamDatabaseStore`/`frameDatabaseStore`), 2.1c (orientation semantics not wired to label rendering), 2.1d (no font-size control for rack/frame labels), 4a (upright click in `BayEditorPage.jsx:153-155` not yet routed to frame editor), 4d (brace numbering not ground-up in `FrameView.jsx:67-93`).
- Cosmetic: `Button` component does not forward `title` prop, so back-button tooltips don't appear (low priority, not blocking).

### When to add a new flow

Add a Playwright flow whenever you fix a bug that has a **visible browser symptom** that a unit test cannot capture — e.g., navigation regressions, validation errors not appearing, render-order bugs, persisted-state migrations. Do **not** add flows for pure logic that can be unit-tested.

---

## Document Compliance Audit

### Doc 1 (Specification List for Phase 1) — ~95% Complete

**7-chapter specification document (43 pages) — the most comprehensive Phase 1 spec.**

#### Ch 1: Initial Structure — 90% Complete


| Requirement                                                   | Status | Notes |
| ------------------------------------------------------------- | ------ | ----- |
| New inspection creation with client details                   | Done   |       |
| Renewal inspections workflow                                  | Done   |       |
| Client data entry (reseller, end customer, address, contacts) | Done   |       |
| Working areas management                                      | Done   |       |
| Status badges (draft/completed)                               | Done   |       |


#### Ch 2: Rack Creation Wizard — 85% Complete


| Requirement                                                                   | Status   | Notes                                        |
| ----------------------------------------------------------------------------- | -------- | -------------------------------------------- |
| Simplified wizard (manufacturer, bays, bay length, levels, elevations, frame) | Done     |                                              |
| Manufacturer selection from database                                          | Done     |                                              |
| Frame database with filtered suggestions (same manufacturer, depth, height)   | Done     |                                              |
| Automatic frame compatibility check (height > highest elevation)              | Not done | Doc specifies validation warning             |
| Final summary before creation confirmation                                    | Not done | Wizard creates directly without summary step |
| Auto-generation in 2D layout on creation                                      | Done     |                                              |


#### Ch 3: Rack List Management — 80% Complete


| Requirement                                           | Status   | Notes                                                           |
| ----------------------------------------------------- | -------- | --------------------------------------------------------------- |
| Table view with rack name, manufacturer, total bays   | Done     |                                                                 |
| "Bay Description" field (e.g. "3x2700+1x1800+1x2700") | Not done | Doc specifies synthetic format showing bay lengths and sequence |
| Rack orientation (left-to-right numbering from front) | Done     |                                                                 |
| Create new rack (wizard + duplicate)                  | Done     |                                                                 |
| Duplicate naming ("Copy of (1)", "Copy of (1) (2)")   | Partial  | Duplicates exist but naming format may differ                   |
| Edit rack (re-open wizard pre-filled)                 | Done     |                                                                 |
| Delete with confirmation                              | Done     |                                                                 |
| Action menu (three-dots) per rack row                 | Done     |                                                                 |
| Auto-creation in 2D layout                            | Done     |                                                                 |


#### Ch 4: Rack Editor — Bay & Frame Management — 90% Complete


| Requirement                                                                                           | Status | Notes |
| ----------------------------------------------------------------------------------------------------- | ------ | ----- |
| Bay editor: left area (front view SVG) + right area (tabs)                                            | Done   |       |
| Bay Configuration tab (frames, levels, beam type, elevation, accessories)                             | Done   |       |
| Bay Inspection tab (NC recording on beams, levels, accessories)                                       | Done   |       |
| Touch-first element selection on front drawing                                                        | Done   |       |
| FRONT/REAR position specification for beams                                                           | Done   |       |
| Quick NC buttons + "Other" dropdown                                                                   | Done   |       |
| Severity (green/yellow/red)                                                                           | Done   |       |
| Photo attachment (camera + gallery, multiple per NC)                                                  | Done   |       |
| Save NC button (enabled only when element + NC type + severity selected)                              | Done   |       |
| NC graphical indicator (colored dot) on front view + layout                                           | Done   |       |
| Multiple NC entry (fields reset, stay on same screen)                                                 | Done   |       |
| Return to layout button                                                                               | Done   |       |
| Copy configuration to other bays                                                                      | Done   |       |
| Frame editor: left area (schematic drawing) + right area (tabs)                                       | Done   |       |
| Frame Configuration tab (frame modification, accessories)                                             | Done   |       |
| Frame Inspection tab (upright front/rear, diagonal numbered, h-brace numbered, base plate, load sign) | Done   |       |
| Frame NC recording with same flow as bay                                                              | Done   |       |


#### Ch 5: 2D Layout Editor — 85% Complete


| Requirement                                                 | Status   | Notes              |
| ----------------------------------------------------------- | -------- | ------------------ |
| Unlimited 2D workspace                                      | Done     |                    |
| Edit Layout mode (padlock icon toggle)                      | Done     |                    |
| Move racks by dragging                                      | Done     |                    |
| Alignment guide lines (Canva-style)                         | Done     |                    |
| Rotate racks (90°/180°/270°/360° + manual angle)            | Done     |                    |
| Managing distances between racks (display + editable field) | Not done | Future enhancement |
| Import external layouts (vector PDF / AutoCAD)              | Not done | Future enhancement |
| Lock layout (prevent movement)                              | Done     |                    |
| Zoom (pinch gesture) + Pan (drag)                           | Done     |                    |
| Layout export to PDF (vector, plot extents style)           | Not done | Future enhancement |
| Graphical numbering of bays and frames on layout            | Done     |                    |


#### Ch 6: Data Extraction (Export) — 80% Complete


| Requirement                                                                                                                                | Status   | Notes                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------------------------------------------------- |
| Export NC data to CSV                                                                                                                      | Done     | RFC 4180 compliant, UTF-8 BOM, browser download    |
| Export NC data to XLSX                                                                                                                     | Done     | SheetJS with proper column widths                  |
| Column structure per 6.2: Lot, Manufacturer, Rack name, Reference, Level, Position, Quantity, Element, Photo, Description, Anomaly, Damage | Done     | Exact Doc 1 Ch 6.2 order and naming + Scope column |
| Reference = bay/frame number                                                                                                               | Done     | Bay NCs → bay name, Frame NCs → frame name         |
| Level = level number (bay) or element index (frame)                                                                                        | Done     |                                                    |
| Position = FRONT/REAR, blank if N/A                                                                                                        | Done     |                                                    |
| Damage = G/Y/R severity coding                                                                                                             | Done     |                                                    |
| Photo = filenames separated by ; (CSV)                                                                                                     | Done     |                                                    |
| Photo export: images in ZIP /photos/ folder                                                                                                | Done     | NC_00001_1.jpg naming convention                   |
| Description = element characteristics from beam/frame DB                                                                                   | Done     | Falls back to notes                                |
| Export UI: format dropdown (CSV/XLSX/ZIP) on toolbar + Working Areas                                                                       | Done     |                                                    |
| Extraction rules (only NCs, one row per NC)                                                                                                | Done     |                                                    |
| ZIP bundle (inspection.xlsx + /photos/ folder)                                                                                             | Done     | JSZip + file-saver                                 |
| Layout PDF export (vector, per working area)                                                                                               | Not done | Future enhancement                                 |
| Integration: NC export + layout PDF + photos as complete package                                                                           | Not done | Future enhancement                                 |


#### Ch 7: Attachments — Reference Only (no implementation needed)

Glossary, MVP purpose, data structure definitions. Used as reference throughout development.

---

### Doc 3 (App Analysis), Section 1: Editors & Database — 90% Complete (4 of 5 items built, 1 deferred by client)


| Requirement                                                                               | Status   | Notes                                        |
| ----------------------------------------------------------------------------------------- | -------- | -------------------------------------------- |
| Beam Editor — full CRUD, supplier link, type, dimensions, finish, features, supplier code | Done     |                                              |
| Frame Editor — full CRUD, supplier link, type, upright specs, depth, bracing qty, finish  | Done     |                                              |
| Supplier Editor — name + color                                                            | Done     |                                              |
| Beam/Frame auto-naming                                                                    | Done     | Default formats, client may customize        |
| Duplicate & Edit                                                                          | Done     |                                              |
| Editor panel on Home Screen                                                               | Done     |                                              |
| Form validations (all dimension fields)                                                   | Done     |                                              |
| Accessories Editor                                                                        | Done     | Full CRUD, 11 categories, supplier filtering |
| Import DB (CSV bulk upload)                                                               | Deferred | Phase 5 per client                           |


### Doc 3 (App Analysis), Section 2: Layout — 100% Complete


| Requirement                              | Status | Notes                   |
| ---------------------------------------- | ------ | ----------------------- |
| Supplier color-coding on racks           | Done   |                         |
| Color legend                             | Done   |                         |
| Snap-to-grid + alignment guides          | Done   |                         |
| Selection, multi-select, drag select     | Done   |                         |
| Transform handles (move, rotate, resize) | Done   |                         |
| Keyboard shortcuts (full set)            | Done   |                         |
| Right-click context menu                 | Done   |                         |
| Properties panel                         | Done   |                         |
| Undo/Redo (50 snapshots)                 | Done   |                         |
| Import floor plan (vector PDF)           | Future | Client marked as future |
| Editable distances                       | Future | Client marked as future |


### Doc 3 (App Analysis), Section 3: Bay View & Configuration — 95% Complete


| Requirement                                         | Status | Notes                                            |
| --------------------------------------------------- | ------ | ------------------------------------------------ |
| Bay width at bottom                                 | Done   |                                                  |
| Beam names from DB                                  | Done   |                                                  |
| Interaxis dimensions + "From ground" column         | Done   |                                                  |
| Bay info: number, rack, supplier, bay length filter | Done   |                                                  |
| Per-level beam panels with filtered dropdowns       | Done   |                                                  |
| "New Beam" button                                   | Done   |                                                  |
| "Apply to all levels" bug fix                       | Done   |                                                  |
| Per-level accessories                               | Done   | DB-backed picker + custom entries per beam level |
| Left/Right frame selection (independent, filtered)  | Done   |                                                  |
| "New Frame" button                                  | Done   |                                                  |
| Duplicate Configuration with bay checkboxes         | Done   |                                                  |
| Level count raised to 20                            | Done   |                                                  |


### Doc 3 (App Analysis), Section 4: Inspection — 95% Complete


| Requirement                                                                            | Status | Notes                                                           |
| -------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------- |
| Touch-first NC flow (tap level → element → FRONT/REAR → NC → severity → photos → save) | Done   |                                                                 |
| Quick NC buttons + "Other" dropdown                                                    | Done   | Updated with Doc 2 NC names                                     |
| NC on all 22 element categories                                                        | Done   | 12 bay elements (5 per-level + 7 bay-level) + 10 frame elements |
| NC on frames (diagonal, cross member, load sign, protections)                          | Done   |                                                                 |
| NC on uprights (upright, footplate, top tie beam, impact guards)                       | Done   | Renamed to Doc 2 names                                          |
| Numbered diagonal/cross member selection                                               | Done   |                                                                 |
| Severity picker (green/yellow/red)                                                     | Done   |                                                                 |
| Photo capture (up to 3 per NC)                                                         | Done   |                                                                 |
| Quantity field                                                                         | Done   |                                                                 |
| Notes field                                                                            | Done   |                                                                 |
| NC markers on 2D layout (colored, sized, tap/long-press)                               | Done   | With placement engine + pie-chart grouping                      |
| NC markers draggable                                                                   | Done   |                                                                 |
| NC marker placement rules (from Doc 2)                                                 | Done   | 18 element-type placement rules implemented                     |
| Pie-chart severity markers                                                             | Done   | Konva Arc on canvas, SVG path in views                          |
| Bay inspection mode toggle (per-level / bay-level)                                     | Done   |                                                                 |


### Doc 4 (Gagliardi "DA SISTEMARE" Feedback) — 100% Complete (16 of 16 testable)

**Second client review (post Doc 3). 16 fix/change items across 4 areas. Received after Week 2 delivery.**

#### Section 1: Rack Creation Wizard


| #   | Requirement                                                                                | Status   | Priority | Maps To                  | Notes                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------ | -------- | -------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 1.1 | Supplier dropdown must pull from **suppliers database** (not hardcoded list)               | **Done** | High     | Doc 1 Ch 2 / Doc 3 Sec 1 | `RackWizard.jsx` — step 1 now reads `supplierStore`; empty-state CTA links to Supplier Editor                            |
| 1.2 | Beam selection in wizard must pull from **beam database, filtered by selected supplier**   | **Done** | High     | Doc 1 Ch 2               | `RackWizard.jsx` — step 4 uses `beamDatabaseStore.getFilteredBeams(supplierId)`; empty-state CTA links to Beam Editor    |
| 1.3 | Frame selection in wizard must pull from **frame database, filtered by selected supplier** | **Done** | High     | Doc 1 Ch 2               | `RackWizard.jsx` — step 6 uses `frameDatabaseStore.getFilteredFrames(supplierId)`; empty-state CTA links to Frame Editor |


#### Section 2: 2D Layout


| #    | Requirement                                                                             | Status   | Priority | Maps To     | Notes                                                                                                                                                                                                                                                                   |
| ---- | --------------------------------------------------------------------------------------- | -------- | -------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1a | Rack name displayed **next to first or last upright frame** (end of rack), not floating | **Done** | Medium   | Doc 1 Ch 5  | `RackShape.jsx` — name now anchored at `x = totalWidth - scaledUprightWidth/2 - 100` (right end, next to last frame) with `wrap="none"` wide centering container so large font sizes don't wrap                                                                         |
| 2.1b | Frame numbering: drop the `F` prefix — use `1, 2, 3` instead of `F1, F2, F3`            | **Done** | Low      | Doc 3 Sec 2 | `FrameShape.jsx` — `text={`${frameIndex}`}`                                                                                                                                                                                                                             |
| 2.1c | Front side = side where numbers appear (orientation semantics)                          | **Done** | Low      | Doc 1 Ch 3  | `rackStore.js` — new `frontSide` field (`'top'`/`'bottom'`, default `'top'`). `RackShape.jsx` + `FrameShape.jsx` render rack name and frame numbers above or below based on `frontSide`. `LayoutEditor.jsx` — F shortcut flips selected rack(s)                         |
| 2.1d | **Font size controls** for rack name / frame labels (like existing NC dot size control) | **Done** | Medium   | —           | `CanvasToolbar.jsx` — added Label +/- control (50%-300%, 25% step). Threaded `labelFontSize` through `LayoutEditor → LayoutCanvas → RackShape → BayShape/FrameShape`; scales rack name, bay label, and frame number text. Verified via Playwright flows 2.1d-a … 2.1d-e |


#### Section 3: Bay Configuration


| #    | Requirement                                                                                                                            | Status   | Priority | Maps To              | Notes                                                                                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 3.1a | Bay supplier must be **locked to wizard selection** (not editable, remove "All Suppliers")                                             | **Done** | High     | Doc 3 Sec 3          | `BayConfig.jsx` — replaced Select with read-only display sourced from `rack.supplierId`                                           |
| 3.1b | Beam Name field **missing from beam editor**                                                                                           | **Done** | Medium   | Doc 3 Sec 1          | `BeamEditorPage.jsx` + `beamDatabaseStore.js` — added `customName` field. Empty = auto-generate (existing), filled = override     |
| 3.2  | Accessories panel must be **inside each level's expanded card** + dropdown linked to **Accessories DB**                                | **Done** | High     | Doc 3 Sec 1 / Week 3 | Per-level accessory picker with DB-backed selection + custom entries. Accessories Editor with full CRUD at `/editors/accessories` |
| 3.3  | **BUG — Bay width dimension not updating** when bay length changes and beams are swapped (beam labels update, but width label doesn't) | **Done** | High     | —                    | `BayFrontView.jsx` — now reads `bay.bayConfig.customLength` first; added to `useMemo` deps                                        |


#### Section 4: Frame Configuration


| #   | Requirement                                                                                                                           | Status   | Priority | Maps To     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4a  | Open frame editor by **clicking upright in bay screen** (new entry point)                                                             | **Done** | Medium   | Doc 3 Sec 3 | `BayEditorPage.jsx` — `onElementClick` now routes `upright` taps to the bounding frame (`rack.frames[bayIndex]` for left, `bayIndex+1` for right). Verified via Playwright flows 4a-left / 4a-right                                                                                                                                                                                                                                                                                                                                                 |
| 4b  | Upright labels must be **FRONT / REAR** (not Left / Right) — matches beam convention                                                  | **Done** | High     | Doc 2       | `FrameView.jsx` — labels renamed and moved above the upright rectangles to fit the longer text                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4c  | Upright depth ≠ width — current `100` dimension is **visually incorrect** (uprights aren't square)                                    | **Done** | Medium   | —           | `frameDatabaseStore.js` — new `uprightDepth` field (defaults to `uprightWidth` for legacy frames). `FrameDatabaseEditorPage.jsx` — added "Depth (side view, mm)" input with 1–500 validation. Wired through `RackWizard.jsx` → `rackStore.js`. `FrameView.jsx` — side-view scale now uses `uprightDepth` for the leg width; both dimension labels show `uprightDepth` value                                                                                                                                                                         |
| 4d  | Brace numbering must be **ground-up** (diagonal 1 = bottom, not top)                                                                  | **Done** | High     | Doc 2       | `FrameView.jsx` — brace generator reversed. `sectionTopY(i) = uprightTopY + (numBraceSections - 1 - i) * sectionPxH` maps `i=0` to the bottom-most section. Both diagonals and horizontals are numbered ground-up (`horizontal-1` = floor level)                                                                                                                                                                                                                                                                                                    |
| 4e  | **NEW: 4 frame bracing types (Z, D, K, X)** — frame editor must render different diagonal/horizontal patterns based on type selection | **Done** | High     | —           | `frameDatabaseStore.js` + `rackStore.js` — new `braceType` field (default `'Z'`). `FrameDatabaseEditorPage.jsx` — added "Brace Pattern" select (Z/D/K/X) in Bracing section. Wired through `RackWizard.jsx` (initialRackData, handleSupplierChange, handleFrameSelect). `FrameView.jsx` — diagonal generator branches on `braceType`: **Z** = one zig-zag diagonal per section alternating direction; **D** = one diagonal per section same direction; **K** = two diagonals meeting at section midpoint; **X** = two crossed diagonals per section |


**Summary by priority (updated from comprehensive browser verification):**

- **High (10):** ~~1.1~~, ~~1.2~~, ~~1.3~~, ~~3.1a~~, ~~3.2~~, ~~3.3~~, ~~4b~~, ~~4d~~, ~~4e~~ — **10 done**
- **Medium (5):** ~~2.1a~~, ~~3.1b~~, ~~4a~~, ~~4c~~, ~~2.1d~~ — **5 done**
- **Low (2):** ~~2.1b~~, ~~2.1c~~ — **2 done**

**Total: 17 done / 17 testable (100%).** 1.1/1.2/1.3 verified via flows W1/W2/W3; 4a verified via flows 4a-left / 4a-right; 2.1d verified via flows 2.1d-a … 2.1d-e. See Browser Verification Tests section.

**Round 1 shipped (5 items):** 2.1b, 3.1a, 3.1b, 3.3, 4b — see "Doc 4 (Gagliardi) Round 1 — Quick Fixes" under Latest Changes.

**Dependencies on existing roadmap:**

- **3.2 (Accessories per-level + DB)** — shipped. Full DB-backed per-level accessory picker.
- **1.1/1.2/1.3 (Wizard DB wiring)** — shipped.
- **4d (Brace numbering ground-up)** — shipped. Existing frame NCs keyed on `diagonal-N` / `horizontal-N` will now point to a different physical brace (numbering was reversed). If legacy NCs need to be preserved, add a migration pass that maps old `diagonal-i` → `diagonal-(N+1-i)` in `ncStore.js`.
- **4e (Z/D/K/X frame types)** — shipped.

---

### Clarification Questions (Developer-Raised) — 90% Complete


| Question                        | Status      | Notes                                                  |
| ------------------------------- | ----------- | ------------------------------------------------------ |
| Q1. Beam name format            | Implemented | Default: `"{Type} {Length}x{Height} - {Supplier}"`     |
| Q2. Frame name format           | Implemented | Default: `"{FrameType} {Height}x{Depth} - {Supplier}"` |
| Q3. Finish color input          | Implemented | Free text (e.g. "RAL 5010 Blue")                       |
| Q4. Shared supplier list        | Implemented | Single `supplierStore` across all editors              |
| Q5. Beam filter exact match     | Implemented | Exact match on `beam.length === bayLength`             |
| Q6. Accessories before editor   | Implemented | Free-text + notes as interim                           |
| Q7. Duplicate config scope      | Implemented | Copies beams + accessories                             |
| Q8. Rack depth for frame filter | Implemented | Uses `rack.frameDepth`                                 |
| Q9. NC types for new elements   | Implemented | All 22 categories with exact Doc 2 NC names            |
| Q10. Common vs "Other" NCs      | Implemented | First 3 as quick buttons, rest as Other                |
| Q11. Photo capture method       | Implemented | Both camera and gallery via `accept="image/*"`         |
| Q12. NC marker placement rules  | Implemented | 18 element-type placement rules + pie-chart markers    |
| Q13. FRONT/REAR in reports      | Stored      | `face` field saved; export not yet built               |


### Doc 2 (NC Marker Rules & NC List): NC Types & Marker Rules — ~90% Complete


| Requirement                                     | Status      | Notes                                                                                                                                |
| ----------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 18 element types with exact NC lists from Doc 2 | Done        | All 18 Doc 2 elements + 4 Doc 3 extras (basePlate, loadSign, topTieBeam, footplate) = 22 total categories, 89 NC types               |
| Marker placement engine (18 position rules)     | Done        | `computeMarkerPosition()` in `src/utils/markerPlacement.js` — handles inside-bay, center, rear, frame, guards, edge, aisle positions |
| Pie-chart severity markers                      | Done        | Konva `Arc` slices on 2D canvas (`NCMarker.jsx`), SVG `path` arcs in views (`SVGPieMarker.jsx`)                                      |
| NC grouping by element                          | Done        | `groupNCsByElement()` in `src/utils/ncGrouping.js` — groups NCs for consolidated pie markers                                         |
| Old NC migration                                | Done        | `NC_ID_MIGRATION` + `ELEMENT_TYPE_MIGRATION` maps in ncTypes.js, auto-applied via `onRehydrateStorage` in ncStore                    |
| Bay inspection mode toggle                      | Done        | Per-level (5 elements) vs Bay/rack-level (7 elements) toggle in BayInspection                                                        |
| Frame guard renaming                            | Done        | `frontGuard` → `frontImpactGuard`, `cornerGuard` → `cornerImpactGuard`                                                               |
| Scope Table categories                          | Not started | Doc 2 defines: Missing, To be corrected, Obsolete, To be repositioned                                                                |


---

## Current Milestone Status


| Phase    | Description                     | Status |
| -------- | ------------------------------- | ------ |
| Phase 1  | Beam & Frame Database Editors   | Done   |
| Phase 2  | Bay Configuration Rework        | Done   |
| Phase 3  | Inspection Functionality Rework | Done   |
| Phase 4  | Layout Enhancements             | Done   |
| Phase 5a | NC Alignment (Doc 2)            | Done   |
| Phase 5b | Accessories + Export            | Next   |


---

## Remaining Work — $4,500 Scope


| Week      | Milestone                              | Cost       | Status             | Deliverables                                                                                                                                                                 |
| --------- | -------------------------------------- | ---------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Week 1    | M1: NC Alignment                       | $1,500     | **DONE**           | 22 NC element types, exact Doc 2 names, placement engine, pie-chart markers, store migration, inspection mode toggle                                                         |
| Week 2    | M2: Clarifications + M3: Export        | $700       | **DONE**           | CSV/XLSX/ZIP export (13 columns, Doc 1 Ch 6.2), Scope categories, NC summary badges + panels, format dropdown                                                                |
| Week 3    | M4: Accessories + Import + Doc 4 Fixes | $800       | **DONE**           | Accessories Editor (full CRUD, 11 categories), per-level DB-backed accessory picker, Doc 4 wizard DB wiring (1.1/1.2/1.3), bay supplier lock (3.1a), beam/frame DB hardening |
| Week 4    | M5: Polish & Testing + Doc 4 Bugs/UX   | $1,500     | **DONE**           | All Doc 4 items (16/16 + 3.2 DB wiring), Z/D/K/X frame types, font size controls, per-bay independence fix, pie-chart markers in production                                  |
| **Total** |                                        | **$4,500** | **100% delivered** |                                                                                                                                                                              |


---

## What's Next — Prioritized Backlog

### Completed (Weeks 1-2)


| #   | Task                              | Status | Notes                                                                                                 |
| --- | --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| 1   | **NC Data Export (CSV/XLSX/ZIP)** | DONE   | 3 format options via dropdown. Doc 1 Ch 6.2 columns + Scope                                           |
| 2   | **NC Summary View**               | DONE   | Summary badges on Rack list, Bay editor, Working Areas + detailed panel                               |
| 3   | **XLSX export format**            | DONE   | SheetJS with proper column widths                                                                     |
| 4   | **Photo export in ZIP bundle**    | DONE   | ZIP with inspection.xlsx + /photos/ folder                                                            |
| 5   | **Scope Table categories**        | DONE   | Doc 2: Missing, To be corrected, To be repositioned, Other — auto-derived + in export + summary panel |
| 6   | **Q13: FRONT/REAR in export**     | DONE   | Position column shows FRONT/REAR, blank if N/A                                                        |


### Short-term (Completed)


| #   | Task                                        | Status   | Notes                                                          |
| --- | ------------------------------------------- | -------- | -------------------------------------------------------------- |
| 6   | **Accessories Editor**                      | DONE     | Full CRUD, 11 categories, supplier filtering                   |
| 7   | **Per-level accessories with DB**           | DONE     | DB-backed picker + custom entries inside each beam level panel |
| 8   | **CSV Import for beams/frames/accessories** | Deferred | Phase 5 per client decision                                    |


### Remaining Polish (optional / future)


| #   | Task                          | Priority | Notes                                                     |
| --- | ----------------------------- | -------- | --------------------------------------------------------- |
| 9   | **Tablet touch optimization** | Medium   | Larger touch targets, swipe gestures, responsive panels   |
| 10  | **Frame compatibility check** | Low      | Doc 1 Ch 2: Warn if frame height < highest beam elevation |
| 11  | **Rack wizard summary step**  | Low      | Doc 1 Ch 2: Show summary before creation confirmation     |
| 12  | **Bay description field**     | Low      | Doc 1 Ch 3: Synthetic format "3x2700+1x1800+1x2700"       |
| 13  | **Italian language (i18n)**   | High     | Only remaining client meeting point                       |
| 14  | **Performance pass**          | Medium   | Virtual scrolling, memo optimization, lazy loading        |


### Not in Current Scope (Future)


| Task                  | Notes                                                     |
| --------------------- | --------------------------------------------------------- |
| PDF Report Generation | Branded inspection reports with photos + severity summary |
| Layout PDF Export     | Vector PDF per working area (Doc 1 Ch 5)                  |
| Import Floor Plan     | Vector PDF/AutoCAD as scaled background in 2D layout      |
| Backend / Cloud Sync  | Server-side storage, multi-device sync                    |
| Multi-User Auth       | Inspector accounts, admin roles                           |
| Offline PWA           | Service worker for full offline capability                |
| Dashboard & Analytics | NC trends, completion rates, severity distribution        |


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

## Release & Deployment SOP

RackVision follows **Semantic Versioning** (SemVer) for all releases, similar to how Apple and Google manage app releases.

### Versioning Scheme

```
v{MAJOR}.{MINOR}.{PATCH}
```


| Part      | When to bump                                                 | Example         |
| --------- | ------------------------------------------------------------ | --------------- |
| **MAJOR** | Breaking changes, data migration required, major UI overhaul | v1.0.0 → v2.0.0 |
| **MINOR** | New features, new element types, new editor pages            | v1.1.0 → v1.2.0 |
| **PATCH** | Bug fixes, UI tweaks, documentation updates                  | v1.2.0 → v1.2.1 |


### Release History


| Version    | Tag                   | Date    | Highlights                                                                      |
| ---------- | --------------------- | ------- | ------------------------------------------------------------------------------- |
| **v1.0.0** | Initial Release       | 2026-04 | Phases 1-4: inspections, racks, 2D layout, bay/frame editors                    |
| **v1.1.0** | NC Alignment & Export | 2026-04 | Doc 2 NC types (22 categories), CSV/XLSX/ZIP export, severity badges            |
| **v1.2.0** | Accessories & Polish  | 2026-04 | Per-level accessories, Doc 4 complete (16/16), pie-chart markers, feature flags |
| **v1.2.1** | Safe Deletion & Fixes | 2026-04 | Safe rack deletion modal, Edit Properties fix, duplicate rack fix               |
| **v1.5.0** | Doc 5 Milestone C     | 2026-04 | Level auto-select, wizard inline beam/frame, inspection delete                  |
| **v1.4.0** | Doc 5 Milestone B     | 2026-04 | Per-bay width, wizard propagation, canvas position persistence                  |
| **v1.3.0** | Doc 5 Milestone A     | 2026-04 | Home button, Front/Rear frame labels, rack name repositioned                    |


### Pre-Release Checklist

Before creating a new release, complete every step:

1. **Code is on `main`** — all feature branches merged, no open PRs for this release
2. **Build passes** — `npm run build` completes with zero errors
3. **Lint passes** — `npm run lint` shows no blocking issues
4. **Manual smoke test** — open the production URL and verify:
  - Home page loads, recent inspections display
  - Create a new inspection → add working area → create rack via wizard
  - 2D layout: drag, zoom, right-click menu, duplicate, delete all work
  - Bay editor: front view renders, NC recording flow completes
  - Frame editor: side view renders, brace types display correctly
  - Export: CSV/XLSX/ZIP downloads successfully
5. **No regressions** — compare against previous release notes for any broken features

### Release Process

```bash
# 1. Ensure clean working tree
git status  # should show "nothing to commit, working tree clean"

# 2. Tag the release
git tag v{X.Y.Z} -m "v{X.Y.Z} — Short description"

# 3. Push tag to GitHub
git push origin v{X.Y.Z}

# 4. Create GitHub Release
gh release create v{X.Y.Z} \
  --title "v{X.Y.Z} — Short Description" \
  --notes "## What's New
- Feature or fix 1
- Feature or fix 2

## Bug Fixes
- Fix description"

# 5. Verify Vercel auto-deploys from main
npx vercel ls  # confirm latest deployment is "Ready"

# 6. Verify production URL
# Open https://rackvision-three.vercel.app and run smoke test
```

### Deployment Pipeline


| Step    | Tool            | Trigger                | Notes                                                |
| ------- | --------------- | ---------------------- | ---------------------------------------------------- |
| Build   | Vite 8          | `git push origin main` | Vercel auto-builds on push                           |
| Deploy  | Vercel          | Automatic              | Zero-downtime deployment, instant rollback available |
| CDN     | Vercel Edge     | Automatic              | Global CDN, assets cached at edge                    |
| Release | GitHub Releases | Manual                 | Tag + release notes after deploy verification        |


### Rollback

If a deployment introduces a critical bug:

```bash
# Option 1: Revert via Vercel dashboard
# Go to vercel.com → project → Deployments → promote a previous deployment

# Option 2: Revert via git
git revert HEAD
git push origin main
# Vercel auto-deploys the revert
```

### Environment URLs


| Environment | URL                                                                        | Deploys from         |
| ----------- | -------------------------------------------------------------------------- | -------------------- |
| Production  | [https://rackvision-three.vercel.app](https://rackvision-three.vercel.app) | `main` branch (auto) |
| Preview     | Auto-generated per commit                                                  | Any branch/PR        |


---

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


