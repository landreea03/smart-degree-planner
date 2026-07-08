# 🎓 Smart Degree Planner

A full-stack degree-planning tool: pick a program, drag courses into semesters, and it flags schedule conflicts and unmet prerequisites automatically while tracking GPA and requirement-category progress toward graduation.

**Live demo:** _add your deployed URL here after following [DEPLOYMENT.md](./DEPLOYMENT.md)_

## Features

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

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + Vite | Fast dev loop, standard for a portfolio piece |
| Drag-and-drop | [`@hello-pangea/dnd`](https://github.com/hello-pangea/dnd) | Maintained fork of `react-beautiful-dnd` |
| PDF export | `html2canvas` + `jsPDF` | Client-side snapshot-to-PDF, no server round trip |
| Backend | Node + Express | Small, well-understood REST API |
| Database | SQLite via Node's built-in [`node:sqlite`](https://nodejs.org/api/sqlite.html) | Zero native dependencies to compile/install — just Node 22.5+ |

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

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/programs` | List all degree programs |
| GET | `/api/programs/:id/courses` | Full catalog (courses + prerequisites) for a program |
| GET | `/api/minors` | List all minors |
| GET | `/api/minors/:id/courses` | Full catalog (courses + prerequisites) for a minor |
| GET | `/api/plans?programId=` | List saved plans for a program |
| GET | `/api/plans/:id` | Fetch one saved plan |
| POST | `/api/plans` | Create a saved plan |
| PUT | `/api/plans/:id` | Update a saved plan |
| DELETE | `/api/plans/:id` | Delete a saved plan |

## Project structure

```
backend/
  src/
    db.js           SQLite connection + schema + migrations
    seedData.js      Program + minor catalogs, seeding logic
    routes/          programs.js, minors.js, plans.js
    server.js        Express app entrypoint
frontend/
  src/
    api.js           Fetch client for the backend
    components/       ProgramSelector, MinorSelector, YearSelector, Sidebar,
                       PlannerBoard, CourseMap, GpaPanel, SavedPlans, CourseDetails,
                       ThemeToggle
    utils/            scheduler.js (scheduling/conflicts/year-term labeling/catalog
                       merging), gpa.js (GPA/category math), categoryColor.js
    App.jsx           Top-level state, theme, and layout
```

## Known limitations

- No user accounts/auth — saved plans are shared, not scoped to a person. Fine for a solo demo; would need an auth layer for multi-user use.
- On Render's free tier, the SQLite file is on ephemeral disk, so saved plans reset on redeploy (see [DEPLOYMENT.md](./DEPLOYMENT.md)).
- Course catalog edits made in the UI are local to your browser session and aren't written back to the database.

## Possible next steps

- User accounts so saved plans are private per person.
- "What-if" GPA projection (simulate future grades against remaining requirements).
- CSV/transcript import to auto-populate completed courses.
