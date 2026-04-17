# RACKVISION

## Statement of Work & Project Response

**Prepared for:** Cristian Gagliardi
**Prepared by:** Elytra Studios
**Date:** April 13, 2026

---

Dear Cristian,

We have carefully reviewed each of your nine points and are pleased to provide detailed responses below, along with the confirmed scope, milestone plan, and clarifications on all technical and contractual matters. As discussed, we confirm your selection of **Option A – PWA ($500)** for the current phase. Combined with the core development cost of $4,500, the total project investment is **$5,000**, structured across three milestones as outlined in this document.

We're also happy to confirm weekly syncs — Saturdays work fine on our end, so joining a call won't be an issue. We're excited about RackVision and would love to be part of it.

---

## 1. Company Information

We understand the importance of having formal company details for contractual purposes. Please find our information below:

| Detail | Information |
|--------|-------------|
| Legal Name | Elytra Studios |
| Registered Address | 69B, PCSIR, Near Ameer Chowk, Lahore, Pakistan |
| Registration Number | Will be provided on the invoice |
| Tax ID | Will be provided on the invoice |
| Contact Email | haseebasif@elytrastudios.com |
| Contact Person | Haseeb Asif |

*These details will be fully reflected in the final agreement before execution.*

---

## 2. Ownership of Software & Source Code

We fully acknowledge and confirm your ownership requirements. Upon full and final payment, the following will apply:

| Your Requirement | Our Commitment |
|-----------------|----------------|
| Exclusive ownership of RackVision | Confirmed – You will be the sole, exclusive, irrevocable, worldwide, and perpetual owner of the software |
| Full source code delivery | Confirmed – Complete source code will be delivered to you |
| Repository access (Git) | Confirmed – Full access to the Git repository throughout development and after delivery |
| All project assets included | Confirmed – Code, data stores, export logic, configurations, and all related assets are included |
| Freedom to continue with other developers | Confirmed – You are free to engage any developer to continue, modify, or extend the software after delivery |

All economic rights — including the right to use, modify, distribute, sell, and further develop the software — will be fully transferred to you. Elytra Studios will retain no rights to the software or its derivatives.

---

## 3. Future Native Version – Architectural Approach

As detailed in our earlier proposal, we recommended Option A (PWA) for this phase because it delivers everything you need for field testing — installable, offline-capable, and full-screen — at a fraction of the native app cost. At the same time, we are designing the architecture to make a future native transition practical:

**Separation of Concerns:** Business logic (rack configuration rules, inspection workflows, validation, export) is encapsulated in standalone service modules and utility files, independent of the UI layer. This logic can be directly reused in a React Native project.

**API-Ready Data Layer:** The data access layer is abstracted through Zustand stores so that switching from localStorage to a remote API requires changes only at the data source level.

**Component Architecture:** UI components follow patterns compatible with React Native conventions (functional components, hooks-based state management).

**Shared Data Models:** Data models, validation logic, and reference data are defined in standalone JavaScript modules importable by both web and native projects.

**Our estimate:** Approximately 60–70% of business logic and data layer code should be directly reusable in a future React Native implementation. The UI layer would need to be rebuilt using native components, but core logic would carry over without a rebuild from scratch.

For reference, our earlier proposal outlined a full native app (Option B) at $2,000 as a future phase, including React Native rebuild, full native camera/storage access, App Store and Play Store deployment, and push notifications. This remains available whenever you decide to proceed.

---

## 4. Access to Code & Project Assets

We are committed to full transparency throughout development. All milestone code will be pushed to Git for your review:

| Item | Details |
|------|---------|
| Repository platform | GitHub |
| Access granted | After you invite us to your Git |
| Code updates | All milestone code will be pushed to the repository for your review and testing |
| Full project files | Delivered at project completion – all source files, assets, and configurations |
| Documentation | Technical documentation covering architecture, data store structure, and component structure |
| Build/deployment instructions | Step-by-step guide for building, deploying, and running the application independently |

You will be able to clone the repository, review code, and track all progress at any point during development.

---

## 5. Acceptance Criteria & Milestones

The project is structured into three milestones. Each milestone follows a clear process:

> **Development → Code pushed to Git → Client Review and test → Approval → Payment**

---

### Milestone 1 – Core Setup, Rack Wizard & Layout ($1,500)

| Area | Details |
|------|---------|
| Deliverables | Project setup and repository, client-side data stores (suppliers, beams, upright frames), rack creation wizard (supplier selection from DB, beam selection filtered by supplier, frame selection filtered by supplier with compatibility check), 2D layout editor (rack visualization, rack naming at first/last upright, numeric-only upright numbering, font size adjustment for labels and NC dots, alignment guides, undo/redo, zoom/pan) |
| Acceptance Criteria | Wizard completes full creation flow end-to-end; all dropdown selections filter correctly by supplier; frame compatibility warning shown when frame is shorter than highest beam elevation; rack layout renders with correct naming and numbering; data persists across sessions; code pushed to Git for review |
| Payment | $1,500 upon written approval |

---

### Milestone 2 – Bay/Frame Config, Inspection & Export ($1,500)

| Area | Details |
|------|---------|
| Deliverables | Bay configuration (supplier locked from wizard and non-editable, beam name field, beam configuration per level, per-bay independent level configuration, accessory notes per bay, bay width management with bay description display and correct dimension updates, duplicate bay config to other bays), frame configuration (front/rear upright labels instead of left/right, correct side-view dimensions, ground-up element ordering for diagonals and crosspieces, four frame type categories: Z, D, K, X with correct visual representation), frame access from bay screen via upright click, inspection management with 22 element categories and 89 non-conformity types per Doc 2, NC recording with severity, photos, quantity, front/rear position, NC pie-chart markers on layout and views, renewals workflow (deep-copy inspection for re-inspection), data export (CSV/XLSX/ZIP with Doc 1 Ch 6.2 columns, Layout PDF with cover page, rack table, and NC details) |
| Acceptance Criteria | Bay width changes propagate to drawing dimensions; per-bay level changes do not affect other bays; frame types display correctly per category letter; element numbering starts from ground; NC placement and inspection flow complete with all 22 element categories; renewals create a full deep copy of an existing inspection; export produces valid CSV/XLSX/ZIP files and Layout PDF; code pushed to Git |
| Payment | $1,500 upon written approval |

---

### Milestone 3 – PWA, Bug Fixes & Deployment ($2,000)

| Area | Details |
|------|---------|
| Deliverables | PWA implementation (service worker, app manifest, offline caching, install prompt), offline testing on iPad and Android tablet, cache update handling, data backup/restore via export/import, bug fixes from Milestone 1 and 2 feedback, complete technical documentation, deployment/build instructions, final repository handover |
| Acceptance Criteria | App installs on tablet home screen and opens full-screen without browser bar; works 100% offline including after device restart; backup export and restore import function correctly; all reported bugs from prior milestones resolved; documentation complete and sufficient for independent development; final sign-off on entire project |
| Payment | $2,000 upon written approval and final acceptance |

---

### Payment Summary

| Milestone | Amount | Trigger |
|-----------|--------|---------|
| M1 – Core Setup, Rack Wizard & Layout | $1,500 | Written approval after demo |
| M2 – Bay/Frame Config, Inspection & Export | $1,500 | Written approval after demo |
| M3 – PWA, Bug Fixes & Deployment | $2,000 | Written approval and final acceptance |
| **Total** | **$5,000** | |

---

### Handling Incomplete or Misaligned Features

If during your review you identify features that do not meet the agreed specifications:

- You document the specific issues during the review period
- We review and classify each item as a valid deviation or a scope clarification
- Valid deviations are corrected before the milestone is resubmitted for your approval
- Payment is released only after your explicit written confirmation

---

## 6. Bug Fixing & Post-Delivery Support

Bug fixing during the project is covered within Milestone 3. After final delivery, our support commitment is:

| Item | Details |
|------|---------|
| Warranty period | 1 month from final delivery acceptance (Milestone 3 sign-off) |
| What's covered (bugs) | Any behavior that deviates from the agreed specifications – fixed at no additional cost |
| Response time | Acknowledgment within 24 hours; fix based on severity (critical: 48h, standard: 5 business days) |
| What's NOT covered | New features, design changes, enhancements, or requirements not in the original scope |
| After warranty | Support and development available under a separate maintenance agreement at mutually agreed rates |

**Definition of a Bug:** A bug is any functionality that does not perform as described in the agreed specifications and milestone acceptance criteria. Feature requests, enhancements, and scope additions are considered change requests and will be quoted separately.

---

## 7. Data Storage & Safety

As outlined in our earlier proposal, the PWA stores all data locally on the device using the browser's localStorage API via Zustand persist middleware. All inspection data, rack configurations, and reference databases remain on the user's device.

---

## 8. Scope Clarification

### Included in Current Scope ($5,000)

| Feature Area | What's Included |
|-------------|-----------------|
| Rack Creation Wizard | Supplier selection from DB, beam selection filtered by supplier, frame selection filtered by supplier with compatibility warning, complete step-by-step wizard flow |
| 2D Layout Editor | Rack visualization, rack naming at first/last upright, numeric-only upright numbering, zoom/pan controls, alignment guides (Canva-style snapping), undo/redo, font size adjustment for labels and NC dots, rack front-side toggle, rack rotation |
| Bay Configuration | Bay info display, supplier locked from wizard (non-editable), beam name field, beam configuration per level, per-bay independent level and elevation configuration, accessory notes per bay (free-text), bay width management with bay description display (`3x2700+1x1800` format), duplicate bay config to other bays |
| Frame Configuration | Front/rear upright labeling, correct side-view dimensions, ground-up element ordering, four brace pattern categories (Z, D, K, X) with correct visual representation, accessible from bay screen via upright click |
| Inspection & NC Recording | 22 element categories with 89 non-conformity types per Doc 2, severity levels (green/yellow/red), front/rear position, photo attachments (multiple per NC), quantity field, NC pie-chart markers on layout and views, NC marker placement engine with 18 position rules |
| Renewals Workflow | Deep-copy an existing inspection (racks, bays, frames, NCs) to create a renewal inspection for re-inspection of the same site |
| Data Export | CSV/XLSX/ZIP export of inspection data with Doc 1 Ch 6.2 column structure, Layout PDF export (cover page, layout snapshot, rack table, NC details), scope table categories (Missing, To be corrected, To be repositioned, Other) |
| PWA / Offline | Service worker, offline capability, installable on tablet (home screen icon, full-screen), survives device restarts, auto-updates on reconnect |
| Data Stores | Suppliers, beams, upright frames (client-side, localStorage-backed) |
| Documentation & Delivery | Full source code, Git repository access, data store structure docs, architecture docs, build/deployment instructions |
| Bug Fixes | Resolution of all bugs identified during milestone reviews, included in Milestone 3 |

---

### Excluded (Future Phases / Additional Cost)

| Item | Notes |
|------|-------|
| Accessories Database & Editor | Full accessories DB with CRUD management and per-level selection from DB — planned for a future phase |
| Native Mobile App (iOS/Android) | Available as future phase (~$2,000); current architecture designed for reusability |
| Cloud Backend / Server-Side Storage | For automatic sync, multi-device support, and centralized backup |
| User Authentication / Multi-User | Login system, role management, team access |
| Push Notifications | Not supported by PWA on iOS; available with native app |
| App Store / Play Store Listing | Requires native app (Option B) |
| Advanced Reporting & Analytics | Dashboards, statistical analysis, trend reports beyond basic export |
| Third-Party Integrations | ERP, CRM, inventory, or other external system connections |
| Ongoing Hosting & Maintenance | Post-warranty support available under a separate maintenance agreement |

---

## 9. Formal Agreement

We have prepared a draft Software Development Agreement that covers all the points you have raised. The key terms are summarized below:

| Clause | Summary |
|--------|---------|
| Parties | Cristian Gagliardi (Client) and Elytra Studios (Developer) |
| Scope | As defined in Section 8 of this document |
| Total Cost | $5,000 ($4,500 core development + $500 PWA implementation) |
| Payment Structure | 3 milestones: $1,500 / $1,500 / $2,000 – each upon written approval |
| Ownership | Full, exclusive, irrevocable, worldwide, perpetual ownership transfers to you upon final payment |
| Repository Access | After you invite us; milestone code pushed to Git for your review |
| Acceptance Process | Demo + client review and test + written approval per milestone |
| Warranty | 1 month bug fixing from final delivery acceptance |
| Confidentiality | Elytra Studios will not reuse or disclose project information |
| Governing Law | Laws of Pakistan |

We are happy to review any draft agreement you may wish to share, or we can finalize and send our draft for your review. The enclosed draft agreement is provided for your reference and can be adjusted based on your feedback.

### Payment Methods

For your convenience, we accept payment via the following methods:

- Company bank transfer (details will be provided on the invoice)
- Wise (TransferWise)
- Payoneer

An invoice corresponding to each milestone will be shared alongside the agreement. Please use whichever payment method is most convenient for you.

---

## 10. Partnership Opportunity

Beyond our role as a development partner, we'd like to put a broader collaboration angle on the table. Elytra Studios is not just a service company — we also collaborate as technology partners on products we believe in.

RackVision looks like a promising and well-targeted product with strong market potential. If you're open to it, we would be happy to explore a technology partnership — either after the MVP/POC phase or in an upcoming call, whichever suits you best.

This is entirely optional and separate from our current engagement. We simply wanted to express our genuine interest in the product's long-term vision.

---

## 11. Communication & Weekly Syncs

To ensure smooth progress and alignment throughout the project, we propose the following:

| Item | Details |
|------|---------|
| Weekly sync calls | Saturdays (confirmed – our team is available) |
| Milestone demos | Scheduled at completion of each milestone for live presentation and walkthrough |
| Day-to-day communication | Via email or your preferred messaging platform |
| Code review access | Continuous via GitHub – you can review progress at any time |
| Project lead (Elytra) | Mubasher – will structure milestones, acceptance criteria, and coordinate deliveries |

---

We are excited about the RackVision project and confident that together we will deliver a product that meets your quality standards and business needs. Your thoroughness in defining requirements gives us an excellent foundation for success.

Please do not hesitate to reach out with any questions or additional requirements.

Warm regards,

**Haseeb Asif**
CEO – Elytra Studios
haseebasif@elytrastudios.com | +92 305 2677669
elytrastudios.com
69B, PCSIR, Near Ameer Chowk, Lahore, Pakistan

---

*(Draft Software Development Agreement (to be finalized))*
