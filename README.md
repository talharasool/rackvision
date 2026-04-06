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


