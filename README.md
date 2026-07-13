# 🎓 Smart Degree Planner

[![CI](https://github.com/landreea03/smart-degree-planner/actions/workflows/ci.yml/badge.svg)](https://github.com/landreea03/smart-degree-planner/actions/workflows/ci.yml)

A full-stack degree-planning tool: create an account, pick a program, drag courses into semesters, and it flags schedule conflicts and unmet prerequisites automatically while tracking GPA and requirement-category progress toward graduation.

**Live demo:** _add your deployed URL here after following [DEPLOYMENT.md](./DEPLOYMENT.md)_

## Features

- **Real user accounts, two roles** — email/password sign-up and sign-in with bcrypt-hashed passwords and JWT session cookies. Students' saved plans are private to their account; advisors get a separate role with read access across every student.
- **Graduation forecast** — a constraint-satisfaction engine that simulates the rest of a degree semester by semester, respecting *both* prerequisites and the fact that real courses aren't offered every term (capstones and seminars often run once a year). Projects an actual graduation term and flags the specific "bottleneck" courses — the ones anchoring your longest prerequisite chain, or only offered once a year — that are constraining your timeline.
- **Course recommendations** — a rules-based "what should I take next" engine that scores eligible courses by how many future courses they unlock and how far behind their requirement category is, with a plain-language reason attached to every pick.
- **Advisor dashboard** — a second account role that can browse every student, drill into any of their saved plans (read-only, cross-account), leave notes tied to a specific course, and mark a plan approved or flagged — plus a campus-wide analytics view (most commonly scheduled courses, at-risk courses by D/F grade frequency, average semesters to graduate, plan status breakdown).
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
- **Automated tests + CI** — 23 backend integration tests (`node:test`) covering auth, role-based access control, catalog integrity, and per-user plan isolation, plus 46 frontend unit tests (Vitest) covering the scheduling, GPA, graduation-forecast, and recommendation engines. GitHub Actions runs both suites, lint, and a production build on every push and pull request.

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

Auth is a `users` table plus a JWT signed on sign-up/sign-in and stored in an httpOnly cookie — the token is never touched by client JS, which rules out theft via XSS. The JWT payload carries the user's `role` (`student` or `advisor`), so `backend/src/auth.js` can gate routes with a `requireAdvisor` middleware without an extra DB round trip per request. Every `/api/plans/*` route requires that cookie and filters its SQL by `user_id`, so one account can never read, update, or delete another's plans (covered by a dedicated test). Advisor routes (`/api/advisor/*`) are the deliberate exception — they're allowed to read *any* student's plans, but only for accounts with `role = 'advisor'`. `backend/src/app.js` exports a `createApp()` factory that builds the Express app without starting a listener, so the test suite can spin up a real instance on an ephemeral port instead of mocking anything.

**Graduation forecast** (`estimateGraduation` in `frontend/src/utils/scheduler.js`) turns "when will I graduate" into a real constraint-satisfaction problem instead of a simple `remaining credits ÷ max per semester` estimate. Every course carries an `offeredTerms` list (derived at seed time in `backend/src/seedData.js` from course metadata already in the catalog — capstones/seminars/thesis-style courses become once-a-year, lower-level gen-ed/math courses get summer availability too), and the forecast greedily schedules term by term, only placing a course when both its prerequisites are satisfied *and* it's actually offered that term. A companion critical-path analysis (`computeBottlenecks`) walks the prerequisite DAG to find each course's longest dependency chain, so it can name the specific courses that are constraining the timeline rather than just reporting a date.

**Course recommendations** (`recommendNextSemester` in `frontend/src/utils/recommend.js`) is a small, fully explainable rules engine — no ML, no black box. It scores every eligible course by how many other courses it unlocks (out-degree in the prerequisite graph) and how far behind its requirement category is, with a light credit penalty to avoid always recommending the heaviest courses. Every recommendation returns its reasoning in plain language alongside the course code.

Both engines are pure functions with no React or Express dependency, which is what makes them straightforward to unit test in isolation (see `scheduler.test.js` and `recommend.test.js`).

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
| GET | `/api/advisor/students` | Advisor | Every student account, with saved-plan counts |
| GET | `/api/advisor/students/:id/plans` | Advisor | One student's saved plans |
| GET | `/api/advisor/plans/:id` | Advisor | Any single plan (any owner), plus notes |
| POST | `/api/advisor/plans/:id/notes` | Advisor | Leave a note on a plan, optionally tied to a course |
| PUT | `/api/advisor/plans/:id/status` | Advisor | Mark a plan `none` / `approved` / `flagged` |
| GET | `/api/advisor/analytics` | Advisor | Cross-plan aggregates (common courses, at-risk courses, avg. time to graduate, plan status breakdown) |

## Project structure

```
backend/
  src/
    db.js           SQLite connection + schema + migrations
    auth.js          JWT/cookie session helpers (sign, verify, requireAuth, requireAdvisor)
    seedData.js      Program + minor catalogs, seeding logic, offeredTerms derivation
    routes/          auth.js, programs.js, minors.js, plans.js, advisor.js
    app.js           createApp() factory (used by both server.js and the test suite)
    server.js        Starts the HTTP listener
  test/              node:test integration tests (auth, programs, minors, plans, advisor)
frontend/
  src/
    api.js           Fetch client for the backend (auth-aware, sends the session cookie)
    components/       ProgramSelector, MinorSelector, YearSelector, Sidebar,
                       PlannerBoard, CourseMap, GpaPanel, SavedPlans, CourseDetails,
                       ThemeToggle, AuthPanel, GraduationForecast, RecommendationsPanel,
                       AdvisorDashboard
    utils/            scheduler.js + scheduler.test.js (scheduling/conflicts/year-term
                       labeling/catalog merging/graduation forecast/bottleneck analysis),
                       recommend.js + recommend.test.js (course recommendations),
                       gpa.js + gpa.test.js (GPA/category math), categoryColor.js
    App.jsx           Top-level state, theme, auth, and layout
.github/workflows/
  ci.yml             Runs backend tests, frontend tests, lint, and build on push/PR
```

## Testing

```bash
npm run test --workspace backend    # 23 integration tests (node:test) against a real in-process server
npm run test --workspace frontend   # 46 unit tests (Vitest) for the scheduling, GPA, forecast, and recommendation engines
```

Backend tests spin up the real Express app (via `createApp()`) on an ephemeral port against a throwaway SQLite database per test file — no mocking. They cover the full auth flow (signup validation, login, session cookies, logout), catalog data integrity (every prerequisite code must exist in its own program/minor's catalog), per-user plan isolation (one account can never read or modify another's saved plans), and advisor access control (students get 403 on advisor routes; advisors can read any student's plans, leave notes, and set status). Frontend tests exercise the pure scheduling/GPA/forecast/recommendation functions directly, including edge cases like prerequisite cycles and courses that can never be scheduled.

## Known limitations

- On Render's free tier, the SQLite file is on ephemeral disk, so saved plans and accounts reset on redeploy (see [DEPLOYMENT.md](./DEPLOYMENT.md)).
- Course catalog edits made in the UI are local to your browser session and aren't written back to the database.
- No password reset flow — losing your password on the live demo means creating a new account.
- Advisor analytics are global (across every student/program in the database), not scoped per-institution or per-cohort — fine for a single-deployment demo, would need a tenancy model for a real multi-school rollout.
- Anyone can sign up as an advisor at sign-up time; there's no verification step gating who gets that role, which is a deliberate simplification for a demo (a real deployment would invite/approve advisors rather than let anyone self-select).

## Possible next steps

- Password reset / email verification.
- Course seat capacity + waitlists, so the availability engine also accounts for a course being full, not just off-term.
- Advisor-to-student assignment (instead of every advisor seeing every student).
- CSV/transcript import to auto-populate completed courses.
