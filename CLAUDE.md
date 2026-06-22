# CLAUDE.md — OPS Scheduler

> This file is read at the start of every Claude Code session.
> It is the single source of truth for project context, conventions, and current state.
> Update the "Current Phase" and "Session Handoff" sections after every working session.

---

## Project Overview

**OPS Scheduler** is a web application for **Orlando Plus Security (OPS)**, replacing Excel-based workflows for managing security guard scheduling at convention center events.

**Core workflow:**
1. Client provides a "buy order" (Excel file) — post names, dates, shift windows
2. Supervisor imports Excel → tags posts to halls → confirms
3. System auto-splits posts into shifts (by duration rules)
4. Supervisor assigns guards/staffers to shifts via drag-and-drop board
5. PDF schedules generated and emailed to guards
6. Guards acknowledge via tokenized link (no account needed)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Frontend | React 18 + Vite + TypeScript |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (email/password, supervisors only) + JWT middleware |
| Data fetching | TanStack React Query v5 |
| Routing | React Router v6 |
| Data utilities | Lodash |
| Testing | Vitest + jsdom |
| Styling | Custom CSS (no UI library) |

**Never add:** UI component libraries (MUI, Chakra, shadcn), Mongoose/ORMs, Redux.

---

## Architecture

This is a full-stack app with a separate Express API and a Vite/React frontend.

### Backend (`/`)
- **Entry**: `index.js` → `server.js` (Express app, port 5000)
- **Auth**: JWT-based. `auth/authentication.js` handles `/auth/signUp` and `/auth/login`. `middleware/auth.js` validates the `Authorization` header on protected routes. Supabase Auth is the identity provider; the JWT is issued by Express after verifying credentials against Supabase.
- **Routes**: `/auth/*`, `/guards/*` (CRUD for guards/workers), `/shows/*` (CRUD for shows/events)
- **Database**: Supabase (Postgres) via the `@supabase/supabase-js` client — **not Mongoose**. The `supabase-js` client replaces all Mongoose model calls.
- **Seeding**: `models/seeds/seeds.js` contains `seedGuards(n)` and `seedShows(n)` generators. For Supabase, seed via `supabase/seed.sql` and `supabase db reset`.

### Frontend (`/client`)
- **Framework**: React 18 + Vite + TypeScript (migrating from CRA/plain JS)
- **State**: TanStack React Query for server state — no Redux
- **Auth**: Supabase Auth session, with JWT stored in `localStorage` for API calls
- **HTTP**: `axiosWithAuth()` in `client/src/helperFuncs.ts` creates an axios instance with `baseURL: http://localhost:5000/` and injects the token as the `Authorization` header
- **Routing**: React Router v6

---

## Data Model

```
Show → Halls → Posts → Shifts → Assignments → Workers
```

```
workers             — guards and staffers, role-typed (replaces Guard model)
shows               — events/conventions
halls               — sub-venue zones within a show (supervisor-tagged at import)
posts               — named physical security locations with start/end time per day
shifts              — splits of a post (auto or manual)
assignments         — worker ↔ shift, tracks acknowledgment and override
availability        — worker availability (per-show or standing)
availability_tokens — tokenized links for guard webform + ack
overtime_flags      — week-level OT tracking across all shows
```

### Worker Role Rules

| Role | Security Posts | Staffing Posts |
|---|---|---|
| Guard | ✅ | ✅ (lower priority) |
| Staffer | ❌ BLOCKED | ✅ |

### Shift Split Logic

| Post Duration | Strategy |
|---|---|
| ≥ 18 hours | `equal_thirds` |
| 8 – 17 hours | `equal_halves` |
| < 8 hours | `single` |

Supervisor always confirms or manually overrides before shifts are written to DB.

### Legacy → Supabase Mapping

| Old Mongoose Model | Supabase Table |
|---|---|
| `Admin` | Supabase Auth users |
| `Guard` | `workers` (role: guard/staffer) |
| `Show` | `shows` |
| `Post` | `posts` |
| (new) | `halls`, `shifts`, `assignments`, `availability` |

---

## Project Structure

```
/                   # Express backend root
  index.js          # Server entry point
  server.js         # Express app + route mounts
  auth/
    authentication.js  # /auth routes (signUp, login, getAdmin)
  middleware/
    auth.js            # JWT verification middleware
  routes/
    guardsRouter.js    # /guards CRUD
    showRouter.js      # /shows CRUD
  models/
    seeds/seeds.js     # Faker-based seed generators (legacy reference)
  supabase/
    migrations/
      001_initial_schema.sql
    seed.sql           # Run via `supabase db reset`

client/             # React frontend
  src/
    components/         # Shared, reusable UI components
    features/
      roster/           # Worker roster (Phase 1 — ACTIVE)
        components/
        hooks/
        utils/
      shows/            # Show management (Phase 2)
      imports/          # Excel import flow (Phase 2)
      schedule/         # Assignment board (Phase 4)
      availability/     # Guard webform (Phase 7)
    hooks/              # Global shared hooks
    lib/
      supabase.ts       # Supabase client singleton
      auth.ts           # Auth helpers
      utils.ts          # Shared utilities
    types/
      index.ts          # ALL TypeScript types — single source of truth
    pages/              # Route-level components
    router.tsx          # All routes defined here
```

---

## Key Commands

```bash
# Dev (run both backend + frontend)
npm run dev               # concurrently runs dev-server + client

# Backend only
npm run dev-server        # nodemon index.js (port 5000)

# Frontend only (from repo root)
npm run client            # Vite dev server (port 3000, proxies /api → 5000)

# Test (frontend)
cd client && npm run test         # Vitest watch mode
cd client && npm run test:run     # Vitest single run (CI)

# Supabase (local)
supabase start            # Start local Supabase stack
supabase db reset         # Reset DB + re-run migrations + seed
supabase gen types typescript --local > client/src/types/supabase.ts

# Build
cd client && npm run build
```

---

## Routes

### API (Express, port 5000)
```
POST /auth/signUp       → create supervisor account
POST /auth/login        → returns JWT
GET  /auth/admin        → get logged-in admin (auth required)
GET/POST /guards        → list / create guards
GET/PUT/DELETE /guards/:id
GET/POST /shows         → list / create shows
GET/PUT/DELETE /shows/:id
```

### Frontend (React Router v6)
```
/login              → LoginPage          (public)
/                   → redirect → /shows
/roster             → RosterPage         (auth required)
/shows              → ShowsPage          (auth required — Phase 2)
/shows/:id          → ShowDetailPage     (auth required — Phase 2)
/schedule/:id       → ScheduleBoardPage  (auth required — Phase 4)
/avail              → GuardAvailPage     (PUBLIC — Phase 7)
/ack/:token         → AckPage            (PUBLIC — Phase 6)
```

---

## Coding Conventions

### TypeScript
- No `any`. Ever.
- All DB types live in `client/src/types/index.ts` — do not inline types in components
- Use `WorkerInsert` / `WorkerUpdate` variants (omit `id`, timestamps) for mutations
- Prefer `type` over `interface` for union types; `interface` for object shapes

### React
- Functional components only
- One component per file
- Co-locate hooks in `features/<name>/hooks/`
- No barrel `index.ts` exports — import directly from file path
- Never use HTML `<form>` with default submit — use `onClick` handlers

### Data Fetching
- All Supabase calls go through React Query (`useQuery`, `useMutation`)
- Query keys: `['entity', filters]` — e.g., `['workers', { type: 'guard' }]`
- Always `invalidateQueries` after mutations — no manual cache writes
- Error and loading states handled in every consumer component

### Testing
- Pure functions (shift split, overlap calc, OT detection) → **unit tests required**
- Name test files `*.test.ts` alongside the file under test
- No component tests in MVP — manual visual QA only

### Git Branches
```
main            → production
dev             → integration
feat/1.1-scaffold
feat/1.2-schema
```
Format: `feat/<ticket-number>-<short-description>`

---

# UI & Design System

---

## 0. How to use this document

- **Tokens only.** Never hard-code a hex, px radius, shadow, or duration in a component. Reference a CSS variable from §3. If a value you need doesn't exist, add a token first, then use it.
- **Every component ships all of its states** (§1). A component without hover/focus/disabled/loading/empty/error is not done.
- **Accessibility is not a phase.** Keyboard + focus-visible + 44px targets + contrast + reduced-motion are acceptance criteria, not polish (§10).
- **Two surfaces, one brand.** _Chrome_ (top bar, side nav, the Guard Badge, auth screens, empty-state hero) carries the dark+gold Orlando Plus identity. _Canvas_ (rosters, calendar, forms, tables) is a calm light work surface. Dark mode flips the canvas; chrome stays dark either way.

---

## 1. Design principles (from checklist.design)

These are enforceable, not aspirational. Treat each as a checklist item per component.

1. **All states, always.** default · hover · focus-visible · active · disabled · loading · empty · error · success. Plus selected/dragging where relevant.
2. **Feedback for every action.** Nothing happens silently. Optimistic update → confirm with a toast; failure → revert + explain. Destructive/irreversible actions confirm first.
3. **Design the empty, loading, and error states first**, not last. A roster with zero workers, a calendar before import, a failed PDF send — each needs a designed state with a next action.
4. **Consistency in the small details.** Border radius, border color, shadow elevation, icon weight, label casing, and corner treatment are identical across components. Pick once (§3), reuse everywhere.
5. **Inline, specific errors.** Validation appears next to the field, in plain language, and says how to fix it — never a generic banner for a field-level problem.
6. **Responsive by structure.** Dense data tables and the calendar degrade to horizontal scroll or stacked cards below `md`; the badge and forms reflow to single column. Touch targets never shrink below 44px.
7. **Plain, consistent UX copy.** Sentence case for body and helper text; SECURITY-STYLE UPPERCASE only for eyebrow labels and the badge. Buttons are verbs ("Assign guard", "Send schedule"), not nouns.
8. **Don't trap the user.** Every modal/drawer closes on Esc + backdrop + an explicit control. Every flow has a back/cancel that doesn't lose work.

> Terminology note: checklist.design's **"Badge"** = a small status/count indicator (our **Status Flag**, §4.3). Our **Guard Badge** (§4.4) is a credential-style profile card. They are two different components; keep the names distinct in code (`StatusFlag` vs `GuardBadge`).

---

## 2. Brand foundation (Orlando Plus → SentinelSchedule)

Pulled directly from `orlandoplussecurity.com`:

- **Gold** `#d4af37` (with light `#e8c84d`) — the single brand accent. Authority, the metal of a badge.
- **Near-black** `#01010d`, warm-dark surfaces `#161208 / #1e1a07 / #221e08`.
- **Type:** `Bebas Neue` (display), `Squada One` (heads/labels), `Stardos Stencil` (stencil accent).
- **Texture:** gold hairline borders (`rgba(212,175,55,.12–.28)`), soft gold glows on hover, 8px radius, 0.25s ease, generous letter-spacing on uppercase labels, 44px minimum controls, reduced-motion respected throughout.

**The translation rule:** that aesthetic is a marketing identity. In the app it becomes a *frame*, not the *content*. Gold = brand, primary action, and selection — **not** a data/status color (conflict, OT, confirmed each get their own hue, §3). Display/stencil fonts = brand moments only. Body, tables, forms, and the calendar use a clean UI font at readable contrast.

---

## 3. Design tokens

Style management: **CSS Modules + design tokens as CSS custom properties.** No CSS-in-JS runtime, scoped class names, and tokens give theming for free. Recommended structure:

```
src/styles/
  tokens.css        # everything below — :root, [data-theme], chrome layer
  reset.css         # minimal modern reset
  globals.css       # html/body, base type, focus-visible defaults
ComponentName/
  ComponentName.tsx
  ComponentName.module.css   # consumes var(--…) only
```

Theme is set with `<html data-theme="light|dark">` (default `light`). Chrome variables are theme-independent.

```css
:root {
  /* ---- Brand ---- */
  --gold-300: #f0d97a;
  --gold-400: #e8c84d;   /* light gold (gradients, hover) */
  --gold-500: #d4af37;   /* BRAND gold — primary accent */
  --gold-600: #b8932e;   /* gold for text/links on LIGHT surfaces (contrast-safe-ish at large/bold) */
  --gold-700: #8f7122;   /* gold pressed / small text on light */
  --gold-dim: rgba(212,175,55,.15);
  --gold-glow: rgba(212,175,55,.08);
  --grad-gold: linear-gradient(135deg, var(--gold-400), var(--gold-500));

  /* ---- Functional status (NOT brand — keep distinct & scannable) ---- */
  --ok-500:    #2e9e5b;  /* confirmed / acknowledged */
  --ok-bg:     #e7f4ec;
  --warn-500:  #e08a00;  /* overtime / pending / needs attention (echoes brand orange) */
  --warn-bg:   #fdf2e0;
  --danger-500:#d23b4e;  /* conflict / cancelled / overlap */
  --danger-bg: #fbe7ea;
  --info-500:  #2f7fb8;  /* informational / system */
  --info-bg:   #e6f1f8;

  /* ---- Light canvas (default work surface) ---- */
  --surface-canvas: #f6f6f4;   /* app background */
  --surface-raised: #ffffff;   /* cards, table, panels */
  --surface-sunken: #eeeeec;   /* wells, disabled fills, grid gutters */
  --surface-hover:  #f0efea;
  --surface-selected: var(--gold-dim);

  --border:        #e2e2dd;    /* hairlines */
  --border-strong: #cfcfc8;
  --border-gold:   rgba(212,175,55,.45);

  --text-strong: #18181b;      /* headings, primary data */
  --text:        #3a3a40;      /* body */
  --text-muted:  #6c6c75;      /* helper, secondary */
  --text-faint:  #9a9aa2;      /* placeholders, disabled */
  --text-on-gold:#1a1608;      /* dark ink on gold fills */
  --link:        var(--gold-700);

  /* ---- Radius / shadow / motion / layout ---- */
  --radius-sm: 6px;
  --radius:    8px;            /* brand default */
  --radius-lg: 14px;          /* cards, badge, modal */
  --radius-pill: 999px;

  --shadow-1: 0 1px 2px rgba(16,16,20,.06), 0 1px 1px rgba(16,16,20,.04);
  --shadow-2: 0 6px 20px rgba(16,16,20,.10);
  --shadow-3: 0 16px 48px rgba(16,16,20,.18);
  --shadow-gold: 0 8px 28px rgba(212,175,55,.35);

  --dur-fast: .15s;
  --dur:      .25s;           /* brand */
  --ease:     cubic-bezier(.4,0,.2,1);

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  --max-w: 1140px;
  --tap-min: 44px;            /* minimum interactive size */

  --z-base:0; --z-sticky:100; --z-drawer:300; --z-modal:500; --z-toast:700; --z-dragoverlay:900;

  /* ---- Type ---- */
  --font-ui: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-display: "Bebas Neue", var(--font-ui);     /* brand moments */
  --font-head:    "Squada One", var(--font-ui);     /* eyebrows, nav, CTA labels */
  --font-stencil: "Stardos Stencil", var(--font-ui);/* sparing badge/credential accent */
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

/* ---- Dark canvas (toggle) ---- */
[data-theme="dark"] {
  --surface-canvas: #0c0c11;
  --surface-raised: #161410;
  --surface-sunken: #100f0b;
  --surface-hover:  #1c1a13;
  --surface-selected: rgba(212,175,55,.16);

  --border:        rgba(255,255,255,.08);
  --border-strong: rgba(255,255,255,.16);
  --border-gold:   rgba(212,175,55,.3);

  --text-strong: #f3f2ee;
  --text:        #ccccc6;     /* brand --gray */
  --text-muted:  #999aaa;     /* brand --gray-mid */
  --text-faint:  #6f6f78;
  --link:        var(--gold-400);   /* gold is contrast-safe as text on dark */

  --ok-bg:#13251a; --warn-bg:#2a1f0c; --danger-bg:#2b1318; --info-bg:#10242f;
  --shadow-1:0 1px 2px rgba(0,0,0,.5);
  --shadow-2:0 8px 24px rgba(0,0,0,.5);
  --shadow-3:0 24px 60px rgba(0,0,0,.6);
}

/* ---- Chrome layer (top bar, side nav, badge, auth) — always dark ---- */
:root {
  --chrome-bg:     #01010d;          /* brand --dark */
  --chrome-bg-2:   #0a0901;
  --chrome-border: rgba(212,175,55,.14);
  --chrome-text:   #ccccc6;
  --chrome-text-strong: #ffffff;
  --chrome-accent: var(--gold-500);
}
```

---

## 4. Components

Each component lists **required states** and **a11y**. Build with Radix UI primitives (Dialog, Popover, Tooltip, Tabs, Toast, Checkbox, DropdownMenu, etc.) styled via CSS Modules — you inherit focus-trap, ARIA, and keyboard handling; you only own the skin.

### 4.1 Buttons
- **Variants:** `primary` (gold gradient `--grad-gold`, `--text-on-gold` label, optional Squada One uppercase for CTAs), `secondary` (raised surface + `--border-strong`), `ghost` (transparent, hover `--surface-hover`), `outline-gold` (gold border, gold text — dark surfaces only), `danger` (`--danger-500`).
- **Sizes:** sm 32px · md 40px · lg 48px. Touch contexts never below `--tap-min`.
- **States:** hover (lift `translateY(-1px)` + `--shadow-gold` on primary), focus-visible (2px gold ring, see §10), active (reset transform), disabled (`opacity:.55`, no pointer), **loading** (spinner + label, control width locked, `aria-busy`).
- Icon-only buttons require `aria-label` and a Tooltip.

### 4.2 Input / editable field
Powers every editable field across the app, including the Guard Badge fields.
- Parts: label (always present; visually-hidden if needed), control, helper text, error text, optional affix/icon.
- **States:** default · focus (gold border + soft gold bg `rgba(212,175,55,.04)`, matches the brand contact form) · filled · disabled (`--surface-sunken`) · readonly · **invalid** (`--danger-500` border + icon + message, `aria-invalid`, `aria-describedby`) · success (sparingly).
- Inline edit (badge, table cells): show an affordance on hover/focus (pencil or underline), commit on blur/Enter, cancel on Esc, and **toast on save** (§5).
- Times/dates use the platform pickers; display hours with `font-variant-numeric: tabular-nums`.

### 4.3 Status Flag (checklist.design "badge")
Compact indicator used on shifts, assignments, roster rows, calendar cells.
- **Shapes:** dot (state only), pill (state + label), count.
- **Semantic map (use the functional tokens, never gold-as-status):**
  - Confirmed / acknowledged → `--ok-*`
  - Pending / awaiting response → `--warn-*` (amber)
  - **Overtime ≥40h/wk** → `--warn-*` with an OT glyph (ties to the OT flag in the engine)
  - **Conflict / hour overlap** → `--danger-*` (ties to the conflict-detection CTE)
  - Cancelled → `--danger-*`, struck label
  - Open / unassigned → neutral `--surface-sunken` + `--text-muted`
  - System/info → `--info-*`
- Consistent: same radius (`--radius-pill`), same outline/fill treatment everywhere. Never rely on color alone — pair with icon or text (a11y).

### 4.4 Guard Badge ⭐ (signature component)
A profile rendered as a security credential. **This is a brand moment — it uses the dark+gold chrome palette even when the canvas is light.**

- **Anatomy:**
  - Header band: `--chrome-bg`, gold hairline, "SECURITY" / "EVENT STAFF" eyebrow in `--font-head` uppercase tracked; optional `--font-stencil` accent and a faint gold guilloché/watermark.
  - Photo: rounded square, gold ring; fallback = monogram on `--gold-dim`.
  - Identity: name in `--font-display`; role + license/ID (e.g., FL "License D") in mono/tabular.
  - **Body = editable fields** (§4.2) inline: phone, email, certs, hall/zone eligibility, guard-vs-staffer capability, availability link. Each field edits in place, commits on blur/Enter, toasts on save.
  - Status strip: Status Flags (active, certs expiring, current-week hours / OT).
  - Optional barcode/QR stylization at the foot (decorative unless wired to check-in, which is post-MVP).
- **States:** view · editing (fields reveal affordance) · saving (per-field spinner) · invalid (field-level) · compact (list/drag-overlay variant) · skeleton.
- **Variants:** full card · `BadgeMini` (avatar + name + status; used as the **drag overlay** on the calendar, §6).
- **a11y:** it's a labeled group of form fields, not an image. Real `<label>`s, logical tab order, `aria-live` on save confirmations.
- Guard vs staffer capability is visible on the badge and **drives valid drop targets** in assignment (guards → security + staffing posts; staffers → staffing only).

### 4.5 Card / surface
`--surface-raised`, `--border`, `--radius-lg`, `--shadow-1`; hover lift to `--shadow-2` only when the whole card is actionable. Header / body / footer slots. This is the base for show cards, summary tiles, and the badge frame.

### 4.6 Table (roster, dense data)
- Sticky header; zebra via `--surface-sunken` at low alpha; row hover `--surface-hover`; selected row `--surface-selected`.
- Right-align + tabular-nums for hours/counts; truncate with tooltip on overflow.
- Sortable headers (`aria-sort`), column filters (§5 Filtering), bulk-select with a sticky action bar.
- States: loading (skeleton rows, §4.10) · empty (designed, with primary action e.g. "Import buy order" / "Add worker") · error (inline retry).
- Below `md`: horizontal scroll for true tables; convert the roster to stacked cards where a row's identity is a person.

### 4.7 Modal / Dialog (Radix Dialog)
For focused confirmations — **shift-split confirm**, destructive confirms, quick edits. Centered, `--surface-raised`, `--radius-lg`, `--shadow-3`, gold-hairline header. Esc + backdrop + explicit close; focus trapped; returns focus to trigger. Keep to one primary action. Don't use for long multi-step work (use a Drawer or full view).

### 4.8 Drawer (Radix Dialog, side)
Right-side panel for editing an assignment, a post, or a guard without leaving the calendar. Slides from right, `--z-drawer`, scrim over canvas. Same close rules as modal. Good home for the Guard Badge in edit mode.

### 4.9 Toast (Radix Toast)
Bottom-right stack, `--z-toast`, auto-dismiss ~4s, pause on hover, max ~3 visible. Variants map to status tokens. **Every save, send, assign, import, and delete ends in a toast** (success or failure-with-reason). Mocked email/SMS in MVP surface here as `console` + toast (ties to the locked mock strategy). Failures offer an action ("Retry", "Undo").

### 4.10 Empty / Loading / Error (first-class)
- **Empty:** display-font headline + one sentence + primary action. Pre-import calendar, zero-roster, no-shows-today each get a bespoke empty state.
- **Loading:** skeletons that match final layout (table rows, badge, calendar grid). Spinners only for in-control/button waits. Never block the whole screen if part can render.
- **Error:** plain explanation + retry; preserve user input; never a dead end.

### 4.11 Also-needed primitives
Tabs, Tooltip, Popover, DropdownMenu, Checkbox/Radio/Toggle, Searchbar, Banner (page-level notices, e.g., unresolved conflicts in a show), Accordion (hall/zone groupings) — all Radix-backed, all token-styled, all with the full state set.

---

## 5. Signature flows (from checklist.design "Flows")

Brief, enforceable checklists for the flows that matter here.

- **Excel import / Uploading media (buy order).** Dropzone with drag-over highlight + click fallback; show filename/size; validate type before upload; **3 steps with a visible stepper: Parse → bulk hall-tag → Confirm** (locked flow). Per-row parse errors shown inline in a review table; can't advance with blocking errors; success → toast + land on the tagged data. Always allow back without losing tags.
- **Saving changes.** Optimistic UI; toast on success; revert + explain on failure. Inline-edited fields (badge, table) auto-save on blur/Enter. Show a dirty indicator + "Save / Discard" for batch forms.
- **Showing input error.** Field-level, specific, on blur/submit (not on every keystroke); focus the first invalid field; summarize at top only for long forms.
- **Submitting a form.** Disable submit while pending with spinner + label; prevent double-submit; success and failure both visibly resolved.
- **Filtering (roster / calendar).** Filters reflect instantly, show active-filter chips, expose a one-click "Clear all", and persist within the session.
- **Sending the schedule (PDF + email ack).** Confirm recipients → generate (browser print CSS in MVP) → toast per send; per-guard acknowledgment state shown as Status Flags.

---

## 6. Drag & drop (dnd-kit)

The modern core of the assignment experience. Library: **dnd-kit**, with **pointer + keyboard sensors** (DnD must work without a mouse).

**Primary surface — the Show Calendar (§7):** drag a guard from the roster rail onto a shift cell.
- **Drag handle:** explicit, with `cursor: grab/grabbing`; the whole roster row/badge is draggable but the handle is the keyboard entry point.
- **Drag overlay:** render `BadgeMini` (§4.4) under the cursor — not a ghost of the row — so the person being placed is unmistakable.
- **Drop zones:** shift cells highlight on drag-over. Tint **green** for a valid drop, **red** for invalid (capability mismatch — staffer onto a security post — or a known conflict). Eligibility comes from the guard/staffer rule on the badge.
- **On drop:** optimistic assign → run conflict (overlap CTE) + OT (≥40h) checks → if flagged, keep the assignment but stamp the cell with a Status Flag and raise a toast ("Assigned. ⚠ Overlaps Hall B 14:00–18:00"). Never silently block; show why.
- **Auto-scroll** near edges; **multi-select drag** to staff several identical posts at once; **snap** to the shift grid.
- **Keyboard:** Space/Enter lifts, arrows move between cells, Space/Enter drops, Esc cancels. Announce pick-up, current target + validity, and result via an `aria-live` region.

**Secondary DnD:**
- **Roster reordering** (sort/priority) with keyboard support.
- **Bulk hall-tagging** in import (drag posts onto hall buckets, or multi-select + assign).
- **Drag-to-split** (optional, modern): drag a divider on a long post to preview the split (≥18h→thirds, 8–17h→halves, <8h single) before confirming in the split modal.

**Reduced motion:** disable lift/scale animations; keep instantaneous, legible state changes.

---

## 7. The Show Calendar

Per-show scheduling surface; mirrors the data model **Show → Halls → Posts → Shifts → Assignments**.

- **Layout (default):** rows = **Posts grouped by Hall/Zone** (collapsible Accordion groups); horizontal axis = time across the show day(s); shift cells span their window. A right-hand **roster rail** holds draggable guard badges, filterable/searchable.
- **Shift cells:** show post name, window, assigned guard (or "Open"), and a Status Flag. Split shifts render as adjacent segments. Color by **status**, never by brand gold (gold = selection/hover only).
- **Density:** comfortable default; a compact toggle for big shows. `tabular-nums` everywhere time appears.
- **Interactions:** click a cell → Drawer to edit; drag from rail → assign (§6); conflicts/OT surface as flags + an optional page Banner summarizing unresolved issues for the show.
- **Responsive:** below `lg`, switch to a single-day vertical timeline (posts as a scrollable list with time sub-rows) rather than a cramped grid.
- Build the grid as **custom CSS Grid** (full control over DnD + dense cells); avoid a heavyweight calendar lib.

---

## 8. Accessibility baseline (acceptance criteria)

- **Contrast.** Body/UI text meets WCAG AA. **Gold `#d4af37` is not body text on light** — use `--gold-600/700` for the rare gold text on light, and only at large/bold sizes; prefer dark ink. Gold-as-text is fine on dark surfaces. Verify status colors against their `*-bg`.
- **Never color alone.** Conflict/OT/confirmed all carry an icon or text label in addition to hue.
- **Focus-visible** on every interactive element: `box-shadow: 0 0 0 2px var(--surface-raised), 0 0 0 4px var(--gold-500)` (a gold ring with a surface gap). Never remove outlines without a replacement.
- **Targets ≥ 44px** in touch contexts (the brand site already holds this line).
- **Keyboard:** full operability incl. DnD (§6), menus, dialogs, calendar cells. Logical tab order; Esc closes layers.
- **Screen readers:** label icon buttons; `aria-live` for saves, toasts, and drag results; tables use real headers + `aria-sort`; the Guard Badge is a labeled field group.
- **Reduced motion:** honor `prefers-reduced-motion` — kill transforms/marquees/auto-animations, keep state changes (the brand CSS already does this; match it).

---

## 9. Motion

Durations `--dur-fast` / `--dur`; easing `--ease`. Hover lifts ≤ 2px. Modals/drawers: fade + small slide. Skeleton shimmer subtle. Everything gated behind reduced-motion. No motion that delays data appearing.

---

## 10. Quick do / don't

**Do**
- Reach for a token; add one if missing.
- Keep gold for brand, primary action, selection, and focus.
- Give conflict / OT / confirmed their own non-gold colors.
- Ship empty + loading + error with every data view.
- Use `BadgeMini` as the drag overlay.
- Keep the work canvas light and legible; let the chrome and the badge carry the swagger.

**Don't**
- Hard-code hex/px/durations in component CSS.
- Use Bebas Neue / Squada One / Stardos Stencil for table cells, form values, or anything dense.
- Use gold as a status color or as body text on white.
- Build DnD that only works with a mouse.
- Leave a save, send, assign, import, or delete without a toast.
- Block the user in a modal with no Esc/back.

---

### Implementation cross-references (already locked elsewhere in this repo)
- Data model: `Show → Halls → Posts → Shifts → Assignments → Workers` — the calendar (§7) is its direct visual form.
- Shift-split logic (≥18h thirds / 8–17h halves / <8h single, supervisor override) → split modal (§4.7) + optional drag-to-split (§6).
- Conflict detection (single overlap CTE) and OT (≥40h/wk) → Status Flags (§4.3) + drop-time feedback (§6).
- Mock strategy (email via console+toast, PDF via print CSS, SMS out of MVP) → Toasts (§4.9) + send flow (§5).
- MVP build order is unchanged; this doc governs the UI layer as each phase lands (roster → import → split → assignment UI → flags → PDF/email → availability webform).

## External Service Mocks (MVP)

| Service | Mock Strategy | Real Implementation |
|---|---|---|
| Email (schedules) | `console.log` + toast: "Email sent to {email}" | Resend via Supabase Edge Function |
| SMS | Skipped entirely | Twilio (post-MVP) |
| PDF generation | `window.print()` with print CSS | Puppeteer / pdf-lib via Edge Function |
| Auth email | Supabase default (works out of box) | Custom SMTP (post-MVP) |
| File storage | Not stored — generated on demand | Supabase Storage (post-MVP) |

**Never add real API keys for email/SMS to this codebase during MVP.**

---

## Environment Variables

```
# Backend (.env in root)
PORT=5000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # backend only — never expose to frontend
JWT_SECRET=
JWT_EXP=3600s

# Frontend (client/.env)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Seed Data (Dummy)

Loaded via `supabase db reset` from `supabase/seed.sql`.

**Workers:** 12 total — 9 guards (1 supervisor, 1 inactive), 3 staffers  
**Show:** Europa 2025 — Orange County Convention Center, Sept 5–7  
**Halls:** Hall A, Hall B, Loading Dock, Registration / Main Lobby  
**Posts:** 8 posts across halls with realistic security/staffing split  
**Shifts:** Pre-split using auto-logic (thirds/halves)  
**Assignments:** Mixed states — confirmed, pending, no_show, one open shift  
**Availability:** 4 guards with per-show availability for Europa 2025  

---

## MVP Build Order

| Phase | Epic | Status |
|---|---|---|
| 1 | Scaffold + Schema + Seed + Roster CRUD | ✅ |
| 2 | Excel Buy Order Import | ✅ |
| 3 | Shift Split Engine | ✅ |
| 4 | Assignment Board UI | 🔵 Active |
| 5 | Conflict + Overtime Detection | ⬜ |
| 6 | PDF Generation + Email Ack | ⬜ |
| 7 | Guard Availability Webform | ⬜ |

**Post-MVP (designed for, not built):**
- Check-in / check-out with timestamps
- SMS delivery
- Client portal
- Mobile guard app

---

## Phase 1 Tickets

| # | Ticket | Status |
|---|---|---|
| 1.1 | Project scaffold (Vite + React + TS + tooling) | ✅ |
| 1.2 | Supabase schema SQL (all tables, enums, triggers) | ✅ |
| 1.3 | Row Level Security policies | ✅ |
| 1.4 | TypeScript types (`client/src/types/index.ts`) | ✅ |
| 1.5 | Seed data (`supabase/seed.sql`) | ✅ |
| 1.6 | Supabase Auth + protected routes | ✅ |
| 1.7 | Roster list view + `useWorkers` hook | ✅ |
| 1.8 | Add / edit worker form | ✅ |
| 1.9 | Deactivate / reactivate (soft delete) | ✅ |
| 1.10 | Shell layout + stubbed navigation | ⬜ |

---

## Phase 2 Tickets

| # | Ticket | Status |
|---|---|---|
| 2.1 | Show setup form + list page | ✅ |
| 2.2 | File upload + SheetJS parse | ✅ |
| 2.3 | Column mapping UI | ✅ |
| 2.4 | Hall tagging step | ✅ |
| 2.5 | Review + confirm import | ✅ |
| 2.6 | Error handling + edge cases | ✅ |
| 2.7 | Full show detail page (posts by hall) | ✅ |
| 2.8 | Import session recovery (sessionStorage) | ⬜ |

---

## Phase 3 Tickets

| # | Ticket | Status |
|---|---|---|
| 3.1 | splitPostIntoShifts() core function | ✅ |
| 3.2 | Vitest suite — split engine | ✅ |
| 3.3 | suggestStrategy() | ✅ |
| 3.4 | Split preview UI (show detail integration) | ✅ |
| 3.5 | SplitConfirmModal (per-post) | ✅ |
| 3.6 | BulkSplitReviewPanel | ✅ |
| 3.7 | commitShifts() + race condition guard | ✅ |
| 3.8 | Reset shifts (ResetShiftsModal + useResetShifts + resetShifts util) | ✅ |
| 3.9 | Show detail shift count + board unlock | ✅ |

---

## Phase 4 Tickets

| # | Ticket | Status |
|---|---|---|
| 4.1 | Board layout + routing + useBoardData hook | ✅ |
| 4.2 | Date navigation + day filter | ✅ |
| 4.3 | ShiftCard component | ✅ |
| 4.4 | Worker panel + useWorkerPanel | ✅ |
| 4.5 | dnd-kit setup + BoardDndProvider | ⬜ |
| 4.6 | Conflict detection (detectOverlap + useConflictCheck) | ⬜ |
| 4.7 | Overtime detection (useOvertimeCheck) | ⬜ |
| 4.8 | Conflict + OT override modal | ⬜ |
| 4.9 | Write assignment (useCreateAssignment, optimistic UI) | ⬜ |
| 4.10 | Shift detail drawer | ⬜ |
| 4.11 | Board filters + status bar | ⬜ |
| 4.12 | Unassign + remove assignment | ⬜ |

---

## Session Handoff

> Update this section at the end of every working session.

**Last completed ticket:** 4.4 — Worker panel + useWorkerPanel  
**Next ticket to start:** 4.5 — dnd-kit setup + BoardDndProvider  
**Blockers / open questions:** dnd-kit (`@dnd-kit/core`, `@dnd-kit/utilities`) must be installed before 4.5 begins — `npm install @dnd-kit/core @dnd-kit/utilities` from `/client`.  
**Notes:** 4.3 created `ShiftCard.tsx` + `ShiftCard.module.css`. 4.4 created `useWorkerPanel.ts` — 3 parallel queries (workers, per_show availability, standing availability); `assignmentsByWorker` derived from `halls` prop via `useMemo` (no extra query). Per_show availability overrides standing when both exist for a worker. `WorkerPanel.tsx` + `WorkerPanel.module.css` — search input, 4 filter tabs (All/Available/Guards/Staffers), collapsible groups (Supervisors → Guards → Staffers), worker cards with G/S type badge, license # for guards, availability badge (✓ or ⚠), and assignment pills ("HHMM–HHMM" format). `ScheduleBoardPage.tsx` — placeholder `<aside>` replaced with `<WorkerPanel showId date halls />`; orphaned panel CSS removed from page module.
