# 🎓 Smart Degree Planner

[![CI](https://github.com/landreea03/smart-degree-planner/actions/workflows/ci.yml/badge.svg)](https://github.com/landreea03/smart-degree-planner/actions/workflows/ci.yml)

A full-stack degree-planning tool: create an account, pick a program, drag courses into semesters, and it flags schedule conflicts and unmet prerequisites automatically while tracking GPA and requirement-category progress toward graduation.

**Live demo:** _add your deployed URL here after following [DEPLOYMENT.md](./DEPLOYMENT.md)_

## Features

- **Real user accounts** — email/password sign-up and sign-in with bcrypt-hashed passwords and JWT session cookies. Saved plans are private per account; only their owner can read, update, or delete them.
- **9 degree programs** — Computer Science, Business Administration, Psychology, Biology, Mechanical Engineering, Nursing, English, Mathematics, and Communication Studies, each with its own realistic course catalog, prerequisites, and credit requirements, served from a real database.
- **6 minors** — Business, Computer Science, Psychology, Data Science, Writing, and Spanish. Pick any minor alongside any major; its courses merge into the same plan (tagged "Minor") and count toward the same GPA/requirement tracking and schedule-conflict checks.
- **"What year are you?" selector** — pick Freshman/Sophomore/Junior/Senior and every course recommended for earlier years is automatically marked completed, with an optional toggle to include summer terms in the plan.
- **Course Map** — a visual flowchart of the entire program: every course as a node positioned by its recommended year/term, connected by arrows to its prerequisites, color-coded by requirement category, with click-to-trace prerequisite chains.
- **Drag-and-drop planning** — move courses between an "unscheduled" pool and semesters (labeled "Year 1 · Fall", "Year 1 · Spring", etc.); drop targets highlight live, and courses placed before their prerequisites are visually flagged.
- **Automatic plan generation** — a topological-sort scheduler batches courses into semesters respecting prerequisite order and a configurable max-courses-per-semester limit.
- **Conflict detection** — flags same-day, overlapping-time course pairs within a semester (online/async courses are exempt).
- **GPA + requirement tracking** — assign letter grades to completed courses and see a live cumulative GPA plus progress bars per requirement category (Major / Math & Science / Gen Ed / Elective / Minor).
- **Save, load, and update plans** — named plans persist to the backend and can be reloaded later.
- **Export to PDF** — one click exports the current planner board as a PDF.
- **Editable catalog** — add, edit, or remove courses from the working catalog directly in the UI.
- **Light/dark theme** — a toggle in the top bar switches the whole app between a clean light theme and a dark theme, persisted across visits.
- **Automated tests + CI** — 17 backend integration tests (`node:test`) covering auth, program/minor catalog integrity, and per-user plan access control, plus 30 frontend unit tests (Vitest) covering the scheduling and GPA engines. GitHub Actions runs both suites, lint, and a production build on every push and pull request.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + Vite | Fast dev loop, standard for a portfolio piece |
| Drag-and-drop | [`@hello-pangea/dnd`](https://github.com/hello-pangea/dnd) | Maintained fork of `react-beautiful-dnd` |
| PDF export | `html2canvas` + `jsPDF` | Client-side snapshot-to-PDF, no server round trip |
| Backend | Node + Express | Small, well-understood REST API |
| Database | SQLite via Node's built-in [`node:sqlite`](https://nodejs.org/api/sqlite.html) | Zero native dependencies to compile/install — just Node 22.5+ |
| Auth | `bcryptjs` + `jsonwebtoken` + httpOnly cookie | Pure-JS password hashing (no native compile step) and a stateless session token |
| Testing | Node's built-in [`node:test`](https://nodejs.org/api/test.html) (backend), [Vitest](https://vitest.dev) (frontend) | Zero/near-zero extra tooling, consistent with the rest of the stack |
| CI | GitHub Actions | Runs both test suites, lint, and a production build on every push/PR |

## Architecture

```
frontend/   React SPA. Fetches program catalogs and manages plan state client-side.
backend/    Express REST API backed by SQLite (programs, courses, prerequisites, saved plans).
```

The catalog (programs, courses, prerequisites) is normalized across three tables so prerequisite graphs and requirement categories are queryable. A saved plan's semester layout is stored as a JSON blob, since its shape (number of semesters, courses per semester) is inherently variable — normalizing that further would add complexity without benefit at this scale.

Every course also carries a `year_level` (1-4) and `term` (Fall/Spring/Summer) — its recommended position in a standard 4-year plan. That metadata drives three things: the semester labels on the planner ("Year 2 · Spring" instead of "Semester 3"), the Course Map's column layout, and the "what year are you" selector's auto-complete logic.

Minors are modeled as a separate catalog (`minors` + `minor_courses` + `minor_course_prereqs`), independent of any program. When a minor is selected, its catalog is merged into the active program's catalog client-side (`mergeCatalogs` in `frontend/src/utils/scheduler.js`) — a course already required by the major takes precedence, so a shared gen-ed requirement can satisfy both without being duplicated. Every minor's prerequisite chain is self-contained (it only reuses major-catalog codes that have zero prerequisites of their own), so a minor works correctly no matter which major it's paired with — this is checked by an automated integrity test rather than by hand.

Color is a first-class piece of the data model, not just styling: every course's `category` (Major/Math & Science/Gen Ed/Elective/Minor) maps to one shared color token (`frontend/src/utils/categoryColor.js`) used consistently by the planner chips, the GPA panel's progress bars, and the Course Map's nodes — and by the CSS variables in `App.css`, which is also how the light/dark theme toggle repaints the whole app without touching component code.

Scheduling and conflict-detection logic (topological sort, time-overlap checks, prerequisite-blocking checks, year/term labeling, catalog merging) lives in pure functions under `frontend/src/utils/`, decoupled from React, so it's independently testable.

Auth is a `users` table plus a JWT signed on sign-up/sign-in and stored in an httpOnly cookie — the token is never touched by client JS, which rules out theft via XSS. Every `/api/plans/*` route requires that cookie and filters its SQL by `user_id`, so one account can never read, update, or delete another's plans (covered by a dedicated test). `backend/src/app.js` exports a `createApp()` factory that builds the Express app without starting a listener, so the test suite can spin up a real instance on an ephemeral port instead of mocking anything.

## Getting started

Requires **Node 22.5+** (for the built-in SQLite module) and npm.

```bash
git clone https://github.com/landreea03/smart-degree-planner.git
cd smart-degree-planner
npm install                 # installs both workspaces (frontend + backend)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev                 # runs backend (:4000) and frontend (:5173) together
```

Open http://localhost:5173. The database seeds itself automatically on first run — no manual setup needed. To force a full re-seed (wipes saved plans): `npm run seed`.

### Running the pieces separately

```bash
cd backend && npm install && npm run dev     # API on :4000
cd frontend && npm install && npm run dev    # UI on :5173
```

## API reference

| Method | Path | Auth required | Description |
|---|---|---|---|
| GET | `/api/health` | No | Liveness check |
| POST | `/api/auth/signup` | No | Create an account, sets the session cookie |
| POST | `/api/auth/login` | No | Sign in, sets the session cookie |
| POST | `/api/auth/logout` | No | Clear the session cookie |
| GET | `/api/auth/me` | Yes | Current signed-in user |
| GET | `/api/programs` | No | List all degree programs |
| GET | `/api/programs/:id/courses` | No | Full catalog (courses + prerequisites) for a program |
| GET | `/api/minors` | No | List all minors |
| GET | `/api/minors/:id/courses` | No | Full catalog (courses + prerequisites) for a minor |
| GET | `/api/plans?programId=` | Yes | List the signed-in user's saved plans for a program |
| GET | `/api/plans/:id` | Yes | Fetch one saved plan (must be owned by the signed-in user) |
| POST | `/api/plans` | Yes | Create a saved plan owned by the signed-in user |
| PUT | `/api/plans/:id` | Yes | Update a saved plan (must be owned by the signed-in user) |
| DELETE | `/api/plans/:id` | Yes | Delete a saved plan (must be owned by the signed-in user) |

## Project structure

```
backend/
  src/
    db.js           SQLite connection + schema + migrations
    auth.js          JWT/cookie session helpers (sign, verify, requireAuth middleware)
    seedData.js      Program + minor catalogs, seeding logic
    routes/          auth.js, programs.js, minors.js, plans.js
    app.js           createApp() factory (used by both server.js and the test suite)
    server.js        Starts the HTTP listener
  test/              node:test integration tests (auth, programs, minors, plans)
frontend/
  src/
    api.js           Fetch client for the backend (auth-aware, sends the session cookie)
    components/       ProgramSelector, MinorSelector, YearSelector, Sidebar,
                       PlannerBoard, CourseMap, GpaPanel, SavedPlans, CourseDetails,
                       ThemeToggle, AuthPanel
    utils/            scheduler.js + scheduler.test.js (scheduling/conflicts/year-term
                       labeling/catalog merging), gpa.js + gpa.test.js (GPA/category math),
                       categoryColor.js
    App.jsx           Top-level state, theme, auth, and layout
.github/workflows/
  ci.yml             Runs backend tests, frontend tests, lint, and build on push/PR
```

## Testing

```bash
npm run test --workspace backend    # 17 integration tests (node:test) against a real in-process server
npm run test --workspace frontend   # 30 unit tests (Vitest) for the scheduling and GPA engines
```

Backend tests spin up the real Express app (via `createApp()`) on an ephemeral port against a throwaway SQLite database per test file — no mocking. They cover the full auth flow (signup validation, login, session cookies, logout), catalog data integrity (every prerequisite code must exist in its own program/minor's catalog), and per-user plan isolation (one account can never read or modify another's saved plans). Frontend tests exercise the pure scheduling/GPA functions directly.

## Known limitations

- On Render's free tier, the SQLite file is on ephemeral disk, so saved plans and accounts reset on redeploy (see [DEPLOYMENT.md](./DEPLOYMENT.md)).
- Course catalog edits made in the UI are local to your browser session and aren't written back to the database.
- No password reset flow — losing your password on the live demo means creating a new account.

## Possible next steps

- Password reset / email verification.
- "What-if" GPA projection (simulate future grades against remaining requirements).
- CSV/transcript import to auto-populate completed courses.
