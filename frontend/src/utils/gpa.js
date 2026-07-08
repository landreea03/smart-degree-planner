export const GRADE_POINTS = {
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  "D-": 0.7,
  F: 0.0,
};

export const GRADE_OPTIONS = Object.keys(GRADE_POINTS);

/**
 * Computes GPA from completed courses that have a grade on record.
 * Ungraded completed courses (e.g. transfer credit) count toward progress
 * but are excluded from the GPA average, same as most real transcripts.
 */
export function computeGpa(completedCourses, grades, catalog) {
  let qualityPoints = 0;
  let gpaCredits = 0;

  for (const code of completedCourses) {
    const course = catalog[code];
    const grade = grades[code];
    if (!course || !grade || !(grade in GRADE_POINTS)) continue;

    qualityPoints += GRADE_POINTS[grade] * course.credits;
    gpaCredits += course.credits;
  }

  return {
    gpa: gpaCredits > 0 ? qualityPoints / gpaCredits : null,
    gpaCredits,
  };
}

/** Credits completed per category, keyed by category name. */
export function categoryProgress(completedCourses, catalog) {
  const totals = {};
  const completed = {};

  for (const course of Object.values(catalog)) {
    const cat = course.category || "Elective";
    totals[cat] = (totals[cat] || 0) + course.credits;
  }

  for (const code of completedCourses) {
    const course = catalog[code];
    if (!course) continue;
    const cat = course.category || "Elective";
    completed[cat] = (completed[cat] || 0) + course.credits;
  }

  return Object.keys(totals).map((cat) => ({
    category: cat,
    completed: completed[cat] || 0,
    total: totals[cat],
    percent: totals[cat] ? Math.min(100, Math.round(((completed[cat] || 0) / totals[cat]) * 100)) : 0,
  }));
}
