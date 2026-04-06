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

### Non-Conformity (NC) Tracking

- Comprehensive NC type catalog covering:
  - **Beams**: bent/twisted, damaged, missing safety connector, overloaded, corrosion, weld failure, wrong type, excessive deflection
  - **Uprights**: bent/twisted, damaged, corrosion, out of plumb, damaged perforations, incorrect splice
  - **Frames**: out of plumb, damaged, overloaded, wrong type, missing, corrosion
  - **Braces**: bent/twisted, damaged, missing, loose/detached, corrosion, weld failure
  - **Base Plates**: missing, damaged, not fixed to floor, corrosion, wrong type, shim issues
  - **Guardrails**: missing, damaged, incorrect height, not fixed properly, corrosion
- Traffic-light severity system (green / yellow / red) per NC type
- Notes support per NC

### Reference Data

- 10 pre-loaded racking manufacturers (Mecalux, AR Racking, Dexion, SSI Schaefer, etc.) with ability to add custom manufacturers
- Standard frame sizes (3000mm to 12000mm height)
- Standard beam sizes (box beams, step beams, structural beams from 1800mm to 3600mm) with capacity ratings

---

## Latest Changes

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

#### New Canvas Components
- `SelectionTransformer.jsx` — Konva Transformer wrapper for selected rack nodes
- `SnapGuides.jsx` — Alignment guide line rendering + snap calculation utility
- `CanvasToolbar.jsx` — Extracted toolbar with all canvas controls
- `PropertiesPanel.jsx` — Side panel for selected rack/NC properties

### Bay Editor Improvements

- **Bay navigation** — Previous/Next buttons, dropdown selector, and counter (e.g. "13 / 15") for navigating between bays in BayEditorPage
- **SVG beam clipping fix** — BayFrontView now computes `effectiveHeight = max(frameHeight, maxBeamElevation) * 1.08` so beams above frame height are visible
- **Level count cap raised** — Maximum levels increased from 10 to 20 in both BayConfig and RackWizard

### Form Validations

- **New Inspection form** (Client Info step):
  - End Customer name is required (min 2 characters)
  - Email validation with proper regex
  - Phone input with country code picker (23 countries: GB, FR, ES, IT, DE, US, NL, BE, CH, AT, DK, SE, NO, PL, PT, IE, FI, AU, JP, CN, IN, AE, SA)
  - Phone number length validation (7-15 digits)
  - Contact name and city min-length validation
  - Inline error messages that clear on field change
- **Beam Editor** — Length required (1-10000mm), Height (1-500mm), Depth (1-500mm), Thickness (0.1-50mm) with inline errors
- **Frame Editor** — Upright height required (1-20000mm), Width (1-500mm), Depth required (1-5000mm), diagonal/cross member quantity must be whole numbers
- **Input component enhanced** — New `min`, `max`, `step`, `prefix`, `inputClassName` props for numeric constraints and prefix addon support

#### New UI Components
- `PhoneInput.jsx` — Phone number input with country code dropdown picker

### Bug Fixes

- **Page height overflow** — LayoutEditor, BayEditorPage, and FrameEditorPage now use `h-[calc(100vh-4rem)]` to account for the 64px Header
- **Selection vs navigation conflict** — In edit mode with select tool, clicking bays/frames selects the parent rack instead of navigating away
- **Background click detection** — Fixed by walking up the Konva node tree to properly detect rack clicks

---

## Implementation Status vs Client Document

Summary of all client-requested changes and their current implementation status.

### Section 1: Editor & Database Management — FULLY IMPLEMENTED

| Feature | Status |
|---------|--------|
| Beam Editor — full CRUD with supplier, type, dimensions, finish, features, supplier code | Done |
| Frame Editor — full CRUD with supplier, type, upright specs, depth, bracing quantities, finish | Done |
| Supplier Editor — name + color assignment for layout visual distinction | Done |
| Beam/Frame name auto-generation from entered data | Done |
| Duplicate & Edit for beams and frames | Done |
| Editor panel on Home Screen with navigation to all editors | Done |
| Form validations on all dimension fields (length, height, depth, thickness, quantities) | Done |
| Accessories Editor | Deferred (Phase 5, per client) |
| Import DB (CSV bulk upload) | Deferred (Phase 5, per client) |

### Section 2: Layout — FULLY IMPLEMENTED

| Feature | Status |
|---------|--------|
| Supplier color-coding on racks in 2D layout | Done |
| Legend showing supplier colors + names | Done |
| Canva-like construction guidelines (snap-to-grid, alignment guides) | Done |
| Rack selection, multi-select, drag selection box | Done |
| Transform handles (move, rotate, resize) | Done |
| Keyboard shortcuts (Delete, Ctrl+D/Z/Y/A, arrows, R, V, H, Escape) | Done |
| Right-click context menu | Done |
| Properties panel for selected rack editing | Done |
| Undo/Redo (max 50 snapshots, session-only) | Done |
| Import building floor plan (vector PDF) | Not in scope (future) |
| Editable distances between specific points | Not in scope (future) |

### Section 3: Bay View & Configuration — FULLY IMPLEMENTED

| Feature | Status |
|---------|--------|
| Bay width label at bottom | Done |
| Beam name from database (not L1/L2/L3) | Done |
| Interaxis dimensions (center-to-center) + "From ground" read-only column | Done |
| Bay Information: Bay Number, Rack, Supplier field, Bay Length as filter | Done |
| Per-level beam panels (collapsible) with filtered beam dropdown (supplier + length) | Done |
| "New Beam" button opens Beam Editor if no match | Done |
| "Apply to all levels" scoped to current bay only (bug fixed) | Done |
| Per-level accessories (free-text + notes until Accessories Editor is built) | Done (interim) |
| Frame selection: Left + Right independently, filtered by supplier/depth/height | Done |
| "New Frame" button opens Frame Editor | Done |
| Duplicate Configuration with bay checkboxes + save button | Done |
| Level count raised from 10 to 20 | Done |

### Section 4: Inspection Functionality — FULLY IMPLEMENTED

| Feature | Status |
|---------|--------|
| NC on beams/levels: tap level → element buttons → FRONT/REAR → NC type → severity → photos → save | Done |
| Quick NC buttons ("Damaged", "Missing safety lock", "Unhooked") + "Other" dropdown | Done |
| NC on level accessories: same flow as beams | Done |
| NC on frames: click frame area → Diagonal/Cross Member/Load Sign/Protections | Done |
| NC on uprights: click upright → Upright/Footplate/Top Tie Beam/Front Guard/Corner Guard | Done |
| Diagonals/cross members: numbered selection (1 = bottom, increasing upward) | Done |
| Uprights: FRONT/REAR selection | Done |
| Severity picker (green/yellow/red) per allowed severities | Done |
| Photo capture: up to 3 photos per NC via file input (camera/gallery) | Done |
| Quantity field: default 1, editable | Done |
| Notes field: optional text observations | Done |
| Colored NC markers on 2D layout (severity-colored, with glow) | Done |
| NC markers: global size setting (increase/decrease) | Done |
| NC markers: tap → view description | Done |
| NC markers: long-press → context menu (Edit/Delete) | Done |
| NC markers: draggable in edit mode, position persists | Done |
| NC marker placement rules file | Pending (client to provide, see Q12) |
| New NC types: Load Sign, Top Tie Beam, Footplate, Front Guard, Corner Guard | Done |

### Client Questions — Cross-Check Status

| Question | Status | Notes |
|----------|--------|-------|
| Q1. Beam name auto-generation format | **Implemented with default** | Uses `"{Type} {Length}x{Height} - {Supplier}"` format. Client may want to customize. |
| Q2. Frame name auto-generation format | **Implemented with default** | Uses `"{FrameType} {Height}x{Depth} - {Supplier}"` format. Client may want to customize. |
| Q3. Finish color input — free text or predefined? | **Implemented as free text** | Currently a text input (e.g. "RAL 5010 Blue"). Client to confirm if RAL picker preferred. |
| Q4. Shared supplier list across beams/frames? | **Yes, shared** | Single `supplierStore` feeds all editors. Client to confirm this is correct. |
| Q5. Beam filter by bay length — exact match? | **Exact match** | Currently filters `beam.length === bayLength`. Client to confirm if tolerance needed. |
| Q6. Accessories before Accessories Editor? | **Free-text name + notes** | Per-level accessories use free-text until Phase 5. Client to confirm this interim approach. |
| Q7. What does "Duplicate Configuration" copy? | **Beams + accessories** | Copies beam selections and accessories to target bays. Client to confirm scope. |
| Q8. Rack depth for frame filtering? | **Uses `rack.frameDepth`** | Existing field on rack. Client to confirm or if separate field needed. |
| Q9. NC types for new elements? | **Implemented with reasonable defaults** | See `ncTypes.js` — loadSign (4 types), topTieBeam (5), footplate (4), frontGuard (5), cornerGuard (5). Client to review and adjust. |
| Q10. Common vs "Other" NCs per element? | **Implemented** | Beams: 3 quick buttons + Other. Other elements: first 3 as quick + rest as Other. Client to provide preferred split per element. |
| Q11. Photo capture — camera or file upload? | **Both** | Uses `<input accept="image/*">` which opens camera or gallery on tablet. |
| Q12. NC marker placement rules file? | **STILL PENDING** | Client has not provided this file. Currently markers use auto-placement or manual drag positioning. |
| Q13. FRONT/REAR tracked in reports? | **Stored in NC data** | `face` field saved with each NC. Export/report feature not yet built. Client to confirm if needed in reports. |

---

## Client Analysis — Requested Changes (April 2026)

Full breakdown of changes requested by the client, organized by area.

### 1. Editor & Database Management

The home screen needs an **Editor panel** with the following sections:

#### Beam Editor

A complete beam database. Each beam entry has:

- **Beam name** — auto-generated from entered data (naming standard TBD)
- **Supplier** — linked to supplier database
- **Beam type** — Standard double C (default) / Step beam for shelving / Other
- **Dimensions** — Length (mm), Height (mm), Depth (mm), Thickness (mm)
- **Finish** — Painted (+ color field) or Galvanized (Cold-dip default / Hot-dip)
- **Optional features/accessories** — 3 free-text fields (e.g. shelf support angle, tie rod plate, bracing plate)
- **Supplier code** — optional

Must support: create from scratch, **Duplicate & Edit** existing beam, Save, Cancel.
This database feeds all beam dropdowns throughout the app.

#### Frame Editor

A complete frame database. Each frame entry has:

- **Frame name** — auto-generated from entered data (naming standard TBD)
- **Supplier** — linked to supplier database
- **Frame type** — Welded / Bolted
- **Upright** — Description (optional), Height (mm), Width (mm)
- **Frame dimensions** — Height (= upright height), Depth (mm)
- **Finish** — same options as beam (Painted+color / Galvanized cold-dip or hot-dip)
- **Diagonals** — Quantity + text field for details (center distance, length, type, etc.)
- **Cross members** — Quantity + text field for details
- **Supplier code** — optional

Must support: create from scratch, **Duplicate & Edit**, Save, Cancel.
Diagonal and cross member **quantities** are critical — they are used during frame inspection to let the inspector select which specific diagonal/cross member has an issue (numbered from bottom up).

#### Supplier Editor

Simple page to enter supplier info + assign a **color** for visual distinction in the 2D layout.

#### Accessories Editor

Database of shelving accessories (mesh decks, shelves, horizontal bracing, row spacers, etc.).
**Status: Deferred** to a later stage.

#### Import DB

Bulk upload via CSV for beams, frames, accessories.
**Status: Deferred** to a later stage.

---

### 2. Layout Changes

**Client feedback**: "Overall, it is very good."

#### Supplier Color-Coding

- Each supplier gets an assigned color
- Racks in the 2D layout are colored by their supplier
- A **legend** showing supplier colors and names

#### Future Layout Features (Not in current scope)

- Import building floor plan (vector PDF) as scaled background
- Construction guidelines / snap alignment between racks
- Editable distances between shelving units

---

### 3. Bay View & Configuration Changes

**Client feedback on bay front view**: "The front view image of the bay is perfect."

#### Bay Front View Drawing Changes

- Bay width label should be at the **bottom** (currently at top)
- Show **beam name from database** instead of L1, L2, L3
- Dimensions should show **center-to-center distance between beams** (interaxis), not absolute height from ground. Absolute height is only needed for the top beam and shown separately.

#### Bay Information Panel

- Add **Supplier** field
- Move **bay length** (Custom Length) here — it acts as a filter for all beam dropdowns in this bay

#### Beam Configuration Rework

- One **panel per level** (as many panels as there are levels)
- Each panel contains:
  - **Beam dropdown** — filtered by: supplier = rack supplier AND beam length = bay length. If no match, a "New Beam" button opens the Beam Editor.
  - **Accessories dropdown** — from accessories database, with a **"+"** button to add multiple accessories per level. Each accessory row = dropdown + notes text field.
- The old standalone Accessories panel is **removed** (replaced by per-level accessories in beam config)

#### Frame Selection Rework

- Left and right frame can be **different** (first/last frames of a rack may be taller)
- Show **frame name from database** instead of "Frame 1" / "Frame 2"
- **Dropdown filtered by**: supplier match, frame depth = rack depth, frame height > top beam elevation
- "New Frame" button → opens Frame Editor
- Drawing adapts frame height based on selected frame

#### Levels & Elevations Rework

- Change input from absolute height to **interaxis** (distance between levels)
- Add a **read-only "From ground" column** (auto-calculated cumulative sum)
- Example: 3 levels → interaxis 1500/1500/1500 → from ground 1500/3000/4500

#### Duplicate Configuration

- New section replacing the old Accessories panel
- **Checkboxes for each bay** in the rack
- Copies current bay's full config (beams, levels, accessories) to selected bays
- Save button in this section

#### Bug Fix: "Apply Beam to All Levels"

- **Current bug**: Changes beams for the entire shelving system (all bays), not just the current bay
- **Required**: Must only apply to the current bay

---

### 4. Inspection Functionality Changes

**Client feedback**: "This is not very well implemented; I would like to change it."

The app will be used on a **tablet via touch**. The current right-hand menu approach should be replaced with **direct interaction on the drawing**.

#### NC on Beams / Levels (Touch Flow)

Starting from the 2D layout → click bay → bay view opens:

1. **Tap a level** in the bay drawing → a panel appears on the right showing all elements at that level
2. If no accessories configured: only **BEAM** button appears. If accessories exist: beam + accessory names shown.
3. Select element (e.g. BEAM) → system asks **FRONT or REAR**
4. Shows **common NC buttons**: "Damaged", "Missing safety lock", "Unhooked or partially unhooked", **"Other"** (opens dropdown for less frequent NCs)
5. Select NC → **severity picker** (green / yellow / red)
6. **Photo capture** — button to take and save up to **3 photos** per NC
7. **Save** button

#### NC on Level Accessories

Same flow as beams — tap level, see accessory names alongside beam, select accessory, pick NC, severity, photos, save.

#### NC on Frames and Related Elements

Accessible from: 2D layout (click frame) OR bay front view (click upright).

**Click within frame rectangular area** → shows element buttons:

- Diagonal
- Cross member
- Load sign
- Protections (guard rail)

**Click on upright** → shows element buttons:

- Upright
- Footplate
- Top tie beam
- Protections (front guard, corner guard)

**For diagonals and cross members**: system asks which number (starting from 1 = closest to ground, increasing upward). The total count comes from frame configuration (diagonal/cross member quantity set in Frame Editor).

**For uprights**: system also asks FRONT or REAR.

Each element → NC type buttons → severity → optional text notes → photos (up to 3) → save.

#### Colored NC Markers on 2D Layout

- Markers appear on the **2D layout only** (not in bay front view)
- Placement rules based on detected NC and related element (rules file to be provided by client)
- Markers must be clearly visible
- **Global size setting** — increase/decrease all marker sizes at once
- **Tap** marker → view simple NC description
- **Long-press** (hold ~2 seconds) → context menu with **EDIT** (modify NC or severity) and **DELETE**
- Delete is useful for follow-up inspections to remove resolved NCs

#### Quantity Field

- All NC entries get a **quantity** field (number of affected elements)
- Default: **1** (covers most cases)
- Editable for cases like: multiple missing safety clips, multiple missing anchor bolts, etc.

---

## Implementation Phases

### Phase 1: Beam & Frame Database Editors ← Foundation

> Everything else depends on having proper beam/frame databases with full fields.


| Task                                            | Files                                                    |
| ----------------------------------------------- | -------------------------------------------------------- |
| Create `beamDatabaseStore` (Zustand + persist)  | `src/stores/beamDatabaseStore.js` (new)                  |
| Create `frameDatabaseStore` (Zustand + persist) | `src/stores/frameDatabaseStore.js` (new)                 |
| Create `supplierStore` (Zustand + persist)      | `src/stores/supplierStore.js` (new)                      |
| Beam Editor page — full CRUD form               | `src/pages/BeamEditorPage.jsx` (new)                     |
| Frame Database Editor page — full CRUD form     | `src/pages/FrameDatabaseEditorPage.jsx` (new)            |
| Supplier Editor page — name + color             | `src/pages/SupplierEditorPage.jsx` (new)                 |
| Add Editor panel to Home Screen                 | `src/pages/HomePage.jsx` (modify)                        |
| Add new routes                                  | `src/App.jsx` (modify)                                   |
| Seed existing beam/frame data into stores       | `src/data/beams.js`, `src/data/frames.js` (may refactor) |


### Phase 2: Bay Configuration Rework

> Depends on Phase 1.


| Task                                                           | Files                                                       |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| Add supplier field + bay length to Bay Information             | `src/components/BayEditor/BayConfig.jsx`                    |
| Rework beam config to per-level panels with filtered dropdowns | `src/components/BayEditor/BayConfig.jsx`                    |
| Add per-level accessories (dropdown + notes + "+" button)      | `src/components/BayEditor/BayConfig.jsx`                    |
| Rework frame selection (filtered dropdowns, left ≠ right)      | `src/components/BayEditor/BayConfig.jsx`                    |
| Change elevations to interaxis + computed "from ground"        | `src/components/BayEditor/BayConfig.jsx`                    |
| Add "Duplicate Configuration" section with bay checkboxes      | `src/components/BayEditor/BayConfig.jsx` (or new component) |
| Fix "Apply to all levels" bug (must scope to current bay only) | `src/components/BayEditor/BayConfig.jsx`                    |
| Update front view: width at bottom, beam names, interaxis dims | `src/components/BayEditor/BayFrontView.jsx`                 |
| Update bay/rack data structures for new fields                 | `src/stores/rackStore.js`                                   |


### Phase 3: Inspection Functionality Rework

> Depends on Phase 2.


| Task                                                                                                        | Files                                            |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Rewrite bay inspection: tap level → element buttons → FRONT/REAR → NC → severity → photos → save            | `src/components/BayEditor/BayInspection.jsx`     |
| Make bay front view levels clickable/tappable                                                               | `src/components/BayEditor/BayFrontView.jsx`      |
| Rewrite frame inspection: click area → element buttons → numbered selection → NC → severity → photos → save | `src/components/FrameEditor/FrameInspection.jsx` |
| Make frame view areas clickable (frame body vs uprights)                                                    | `src/components/FrameEditor/FrameView.jsx`       |
| Add quantity field to NC data model                                                                         | `src/stores/ncStore.js`                          |
| Add photo array (up to 3) to NC data model                                                                  | `src/stores/ncStore.js`                          |
| Add new NC types: load sign, top tie beam, footplate, protections (front guard, corner guard)               | `src/data/ncTypes.js`                            |
| Add FRONT/REAR field to NC data model                                                                       | `src/stores/ncStore.js`                          |


### Phase 4: Layout Enhancements

> Can start after Phase 1 (supplier colors), rest after Phase 3 (NC markers).


| Task                                                                  | Files                                                                   |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Color racks by supplier in 2D layout                                  | `src/components/Canvas/RackShape.jsx`, `BayShape.jsx`, `FrameShape.jsx` |
| Add supplier color legend to layout                                   | `src/pages/LayoutEditor.jsx`                                            |
| NC markers on layout: tap → view, long-press → edit/delete menu       | `src/components/Canvas/NCMarker.jsx`                                    |
| Global marker size setting in toolbar                                 | `src/pages/LayoutEditor.jsx`                                            |
| Marker placement based on NC type + element (needs rules from client) | `src/components/Canvas/LayoutCanvas.jsx`                                |


### Phase 5: Accessories Editor & Import DB (Deferred)

- Accessories Editor — full CRUD for all shelving accessories
- Import DB — CSV bulk upload for beams, frames, accessories
- **Not in current scope** — client will revisit later

---

## Client Questions (Must Answer Before/During Development)

### Beam & Frame Editors

**Q1. Beam name auto-generation format?**
When creating a beam, the name is auto-generated. What format should it follow?
Example options: `"Double C 2700x50 - Mecalux"`, `"BOX-2700-Mecalux"`, or something else?

**Q2. Frame name auto-generation format?**
Same question for frames.
Example: `"Welded 6000x1000 - Mecalux"`, `"W-6000x1000-MEX"`, or something else?

**Q3. Finish color input — free text or predefined list?**
For "Painted" finish, should color be: (a) free text, (b) a color picker, or (c) a predefined list like RAL codes?

**Q4. Should the supplier list be shared across beams, frames, and accessories?**
Or can each product type have its own independent suppliers?

### Bay Configuration

**Q5. When filtering beams by bay length — must it be an exact match?**
Example: if bay length is 2700mm, should we show only beams with length exactly 2700mm? Or also beams within a tolerance (e.g. ±50mm)?

**Q6. How to handle accessories before the Accessories Editor is built?**
The per-level accessory dropdown needs data, but the Accessories Editor is deferred. Options:
(a) Hardcode a temporary list of common accessories (mesh deck, shelf, row spacer, horizontal bracing)
(b) Use a free-text field until the editor is built
(c) Skip accessories in levels entirely until Phase 5

**Q7. What exactly does "Duplicate Configuration" copy?**
When copying a bay config to other bays, should it include: (a) only beam selections, (b) beams + level heights, (c) beams + heights + accessories, (d) everything including left/right frame selections?

**Q8. Where is rack depth defined for frame filtering?**
Frames are filtered by "frame depth = shelving depth". Is this the existing `frameDepth` field on the rack, or should there be a separate rack depth field?

### Inspection

**Q9. NC types and severities for new element types?**
The document introduces elements not yet in our NC catalog:

- **Load sign** — what NCs apply? (missing, damaged, illegible, wrong position?)
- **Top tie beam** — what NCs apply?
- **Footplate** — is this different from the existing "base plate" element?
- **Protections (front guard, corner guard)** — are these separate from the existing "guardrail" NCs?

Please provide the full NC type list and allowed severities for each new element.

**Q10. What are the common vs "Other" NCs per element?**
The document says beams show buttons for "Damaged", "Missing safety lock", "Unhooked or partially unhooked" and an "Other" dropdown. Is this split (common buttons vs Other dropdown) the same for all elements, or does each element type have its own set of common NCs? Can you provide the common NCs list per element type?

**Q11. Photo capture — camera or file upload?**
Should the app open the device camera directly, or allow selecting from gallery? Both? Max file size per photo?

**Q12. NC marker placement rules file?**
The document says "the rules for placing markers based on the detected NC and related element will be provided in an attached file." We need this file to implement marker positioning on the 2D layout. Can you provide it?

**Q13. Is FRONT/REAR tracked separately in reports?**
When an NC is recorded as FRONT or REAR (on beams, uprights), does this distinction need to appear in reports/exports? Or is it just for the inspector's reference?

---

## Project Structure

```
src/
├── components/
│   ├── BayEditor/        # Bay inspection, config & front view
│   ├── Canvas/           # Konva-based layout: LayoutCanvas, RackShape, BayShape, FrameShape, NCMarker
│   ├── FrameEditor/      # Frame inspection, config & view
│   ├── Layout/           # Header & Sidebar
│   ├── ui/               # Reusable UI: Button, Input, Select, Modal, Card
│   └── Wizard/           # Rack creation wizard
├── data/                 # Reference data: manufacturers, beams, frames, NC types
├── pages/                # Route pages: Home, NewInspection, WorkingAreas, RackList, LayoutEditor, BayEditorPage, FrameEditorPage, RenewalsPage
├── stores/               # Zustand stores: inspectionStore, rackStore, ncStore
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


