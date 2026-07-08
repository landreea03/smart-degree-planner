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
   HELPERS
======================= */

export function sumCredits(courseList, catalog) {
  return courseList.reduce((sum, c) => sum + (catalog[c]?.credits || 0), 0);
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
