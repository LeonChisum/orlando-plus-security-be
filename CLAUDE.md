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
| 1 | Scaffold + Schema + Seed + Roster CRUD | 🔵 Active |
| 2 | Excel Buy Order Import | ⬜ |
| 3 | Shift Split Engine | ⬜ |
| 4 | Assignment Board UI | ⬜ |
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

## Session Handoff

> Update this section at the end of every working session.

**Last completed ticket:** 1.9 — Deactivate / reactivate (soft delete)  
**Next ticket to start:** 1.10 — Shell layout + stubbed navigation  
**Blockers / open questions:** 002_rls.sql is missing GRANT statements for `authenticated` role — fixed in file, but must be applied manually in Supabase Studio SQL editor on local instances (not yet run through CLI). Run the grants block or `supabase db reset` to apply.  
**Notes:** `useToggleWorkerActive` in `useWorkerMutations.ts` handles deactivate/reactivate as a standalone mutation (separate from the form save). WorkerForm no longer has an `is_active` checkbox — active workers show a "Deactivate" button (danger-ghost) that requires inline confirm; inactive workers show a "Reactivate" button (success) that fires immediately. Both close the modal on success. The save payload preserves `worker.is_active` on edit so form saves don't accidentally flip the status. Seed uses fixed hex UUIDs prefixed by entity type (11.../workers, 22.../shows, 33.../halls, 44.../posts, 55.../shifts).
