/* =======================
   TIME / CONFLICT ENGINE
======================= */

export function parseTime(t) {
  if (!t || t === "Asynchronous" || t === "TBD") return null;
  const [s, e] = t.split("-").map((x) => x.trim());
  const toMin = (x) => {
    const [h, m] = x.split(":").map(Number);
    return h * 60 + m;
  };
  return [toMin(s), toMin(e)];
}

export function daysOverlap(a, b) {
  if (!a || !b) return false;
  for (const c of a) if (b.includes(c)) return true;
  return false;
}

export function timeOverlap(a, b) {
  if (!a || !b) return false;
  return a[0] < b[1] && b[0] < a[1];
}

export function detectConflicts(semester, catalog) {
  const conflicts = new Set();

  for (let i = 0; i < semester.length; i++) {
    for (let j = i + 1; j < semester.length; j++) {
      const c1 = catalog[semester[i]];
      const c2 = catalog[semester[j]];

      if (!c1 || !c2) continue;
      if (c1.mode === "Online" || c2.mode === "Online") continue;

      if (daysOverlap(c1.days, c2.days) && timeOverlap(parseTime(c1.time), parseTime(c2.time))) {
        conflicts.add(semester[i]);
        conflicts.add(semester[j]);
      }
    }
  }

  return conflicts;
}

/** Prerequisites of `code` that have not been completed yet. */
export function missingPrereqs(code, catalog, completedCourses) {
  const course = catalog[code];
  if (!course) return [];
  return course.prereq.filter((p) => !completedCourses.includes(p));
}

/**
 * For each column on the planner board, figures out which courses have a
 * prerequisite that isn't satisfied yet by that point in the plan (i.e.
 * not already completed, and not scheduled in an earlier semester).
 * Returns { unscheduled: Set, "sem-0": Set, "sem-1": Set, ... }.
 */
export function computeBlocked(unscheduled, semesters, catalog, completedCourses) {
  const blocked = {};
  const satisfied = new Set(completedCourses);

  blocked.unscheduled = new Set(
    unscheduled.filter((code) => missingPrereqs(code, catalog, completedCourses).length > 0)
  );

  semesters.forEach((sem, i) => {
    const blockedHere = new Set();
    sem.forEach((code) => {
      const course = catalog[code];
      if (!course) return;
      const stillMissing = course.prereq.filter((p) => !satisfied.has(p));
      if (stillMissing.length > 0) blockedHere.add(code);
    });
    blocked[`sem-${i}`] = blockedHere;
    sem.forEach((code) => satisfied.add(code));
  });

  return blocked;
}

/* =======================
   YEAR / TERM LABELING
======================= */

export const YEAR_LEVELS = [
  { level: 1, label: "Freshman" },
  { level: 2, label: "Sophomore" },
  { level: 3, label: "Junior" },
  { level: 4, label: "Senior" },
];

/** Course codes whose recommended year is earlier than `year` (1-4). */
export function coursesBeforeYear(catalog, year) {
  return Object.keys(catalog).filter((code) => (catalog[code].yearLevel || 1) < year);
}

/**
 * Human label for the semester at `index` (0-based) on the planner board,
 * offset by the student's starting year so a plan that begins mid-degree
 * (e.g. a transfer or a Junior who's already completed years 1-2) is
 * labeled correctly instead of always starting at "Year 1".
 */
export function termLabel(index, { startYear = 1, includeSummer = false } = {}) {
  const termNames = includeSummer ? ["Fall", "Spring", "Summer"] : ["Fall", "Spring"];
  const termsPerYear = termNames.length;
  const absoluteIndex = index + (startYear - 1) * termsPerYear;
  const year = Math.floor(absoluteIndex / termsPerYear) + 1;
  const term = termNames[absoluteIndex % termsPerYear];
  return `Year ${year} · ${term}`;
}

/* =======================
   GRADUATION FORECAST
   Real degree catalogs don't offer every course every semester (capstones
   and seminars often run once a year). That turns "when will I graduate"
   into a genuine constraint-satisfaction problem: a greedy multi-semester
   simulator that respects prerequisites AND term availability, plus a
   critical-path analysis that flags which courses are actually constraining
   the timeline.
======================= */

/** Whether `course` is offered in the given term name ("Fall"/"Spring"/"Summer"). */
export function courseOfferedInTerm(course, termName) {
  if (!course?.offeredTerms || course.offeredTerms.length === 0) return true;
  return course.offeredTerms.includes(termName);
}

/**
 * For each not-yet-completed course, the length of the longest prerequisite
 * chain ending at it (a course with no prereqs has depth 1). The course(s)
 * at the maximum depth sit on the "critical path" — delaying any of them
 * delays everything that depends on them. Courses offered in only one term
 * a year are flagged too, since missing that one window costs a full year
 * regardless of how deep they sit in the chain.
 */
export function computeBottlenecks(catalog, completedCourses = []) {
  const codes = Object.keys(catalog).filter((code) => !completedCourses.includes(code));
  const depthCache = {};

  function depth(code, seen) {
    if (depthCache[code] !== undefined) return depthCache[code];
    if (seen.has(code)) return 0; // cycle guard — shouldn't happen in valid data
    const course = catalog[code];
    if (!course || course.prereq.length === 0) return (depthCache[code] = 1);

    const nextSeen = new Set(seen);
    nextSeen.add(code);
    const prereqDepths = course.prereq
      .filter((p) => catalog[p] && !completedCourses.includes(p))
      .map((p) => depth(p, nextSeen));
    const maxPrereqDepth = prereqDepths.length ? Math.max(...prereqDepths) : 0;
    return (depthCache[code] = 1 + maxPrereqDepth);
  }

  const scored = codes.map((code) => {
    const course = catalog[code];
    const offeredTerms = course.offeredTerms || [];
    return {
      code,
      depth: depth(code, new Set()),
      onceAYear: offeredTerms.length === 1,
      onlyTerm: offeredTerms.length === 1 ? offeredTerms[0] : null,
    };
  });

  const maxDepth = scored.reduce((max, s) => Math.max(max, s.depth), 0);

  return scored
    .filter((s) => s.depth === maxDepth || s.onceAYear)
    .sort((a, b) => b.depth - a.depth)
    .map((s) => ({
      code: s.code,
      depth: s.depth,
      reason: s.onceAYear
        ? `Only offered in ${s.onlyTerm} — missing that term pushes graduation back a full year`
        : `Anchors the longest prerequisite chain in your plan (${s.depth} course${s.depth === 1 ? "" : "s"} deep)`,
    }));
}

/**
 * Greedily simulates the rest of a degree, term by term, respecting both
 * prerequisites and which terms each course is actually offered in, to
 * project a realistic graduation date instead of assuming every course is
 * always available. Courses that can never be scheduled (a genuine cycle,
 * or a prerequisite outside the catalog) are reported in `unresolved`
 * rather than silently dropped.
 */
export function estimateGraduation(catalog, options = {}) {
  const { maxPerSemester = 4, startYear = 1, includeSummer = false, completedCourses = [] } = options;
  const termNames = includeSummer ? ["Fall", "Spring", "Summer"] : ["Fall", "Spring"];
  const termsPerYear = termNames.length;

  const remaining = Object.keys(catalog).filter((code) => !completedCourses.includes(code));
  const satisfied = new Set(completedCourses);
  const unplaced = new Set(remaining);

  const semesters = [];
  let lastPlacedIndex = -1;
  let consecutiveEmpty = 0;
  let index = 0;
  // Generous safety bound: even in the worst case (one course placed per
  // term, plus waiting out empty terms) this terminates well before it'd
  // ever matter for a real 4-year catalog.
  const maxTermsToTry = (remaining.length + 1) * termsPerYear + termsPerYear * 4;

  while (unplaced.size > 0 && index < maxTermsToTry) {
    const absoluteIndex = index + (startYear - 1) * termsPerYear;
    const termName = termNames[absoluteIndex % termsPerYear];

    const eligible = [...unplaced]
      .filter((code) => {
        const course = catalog[code];
        if (!course) return false;
        if (!courseOfferedInTerm(course, termName)) return false;
        return course.prereq.every((p) => satisfied.has(p));
      })
      .sort();

    const chosen = eligible.slice(0, maxPerSemester);

    if (chosen.length > 0) {
      semesters.push({ index, term: termName, courses: chosen });
      chosen.forEach((code) => {
        satisfied.add(code);
        unplaced.delete(code);
      });
      lastPlacedIndex = index;
      consecutiveEmpty = 0;
    } else {
      consecutiveEmpty++;
      // Nothing placeable across every term type for a full year+ means
      // what's left is permanently stuck (a cycle, or a prereq that isn't
      // in the catalog at all) — waiting longer won't help.
      if (consecutiveEmpty > termsPerYear) break;
    }

    index++;
  }

  return {
    semesters,
    totalSemesters: lastPlacedIndex + 1,
    projectedGraduation: lastPlacedIndex >= 0 ? termLabel(lastPlacedIndex, { startYear, includeSummer }) : null,
    bottlenecks: computeBottlenecks(catalog, completedCourses),
    unresolved: [...unplaced],
  };
}

/* =======================
   HELPERS
======================= */

export function sumCredits(courseList, catalog) {
  return courseList.reduce((sum, c) => sum + (catalog[c]?.credits || 0), 0);
}

/**
 * Merges a minor's catalog into a major/program catalog. Courses already
 * required by the major take precedence (a shared gen-ed requirement can
 * satisfy both), so the minor only contributes codes the major doesn't
 * already have.
 */
export function mergeCatalogs(programCatalog, minorCatalog) {
  const merged = { ...programCatalog };
  Object.entries(minorCatalog || {}).forEach(([code, course]) => {
    if (!merged[code]) merged[code] = course;
  });
  return merged;
}

export function totalCatalogCredits(catalog) {
  return Object.values(catalog).reduce((sum, c) => sum + (c.credits || 0), 0);
}

/**
 * Topologically sorts `courses` (respecting prerequisites already completed)
 * into semester-sized batches. Throws if a prerequisite cycle exists.
 */
export function scheduleCourses(courses, maxPerSem, completedCourses = []) {
  const graph = {};
  const indeg = {};

  Object.keys(courses).forEach((k) => {
    graph[k] = [];
    indeg[k] = 0;
  });

  Object.entries(courses).forEach(([c, v]) => {
    v.prereq.forEach((p) => {
      if (completedCourses.includes(p)) return; // already satisfied
      if (!graph[p]) return; // prereq isn't in the active pool
      graph[p].push(c);
      indeg[c]++;
    });
  });

  let ready = Object.keys(indeg).filter((k) => indeg[k] === 0).sort();
  const semesters = [];
  let taken = 0;

  while (ready.length) {
    const sem = ready.splice(0, maxPerSem);
    semesters.push(sem);
    const nextReady = [];
    sem.forEach((c) => {
      taken++;
      graph[c].forEach((n) => {
        indeg[n]--;
        if (indeg[n] === 0) nextReady.push(n);
      });
    });
    ready = [...ready, ...nextReady.sort()];
  }

  if (taken !== Object.keys(courses).length) {
    throw new Error("Impossible schedule: prerequisite cycle detected.");
  }

  return semesters;
}
