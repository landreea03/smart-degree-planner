import { missingPrereqs } from "./scheduler";
import { categoryProgress } from "./gpa";

/**
 * Recommends up to `maxPerSemester` courses to take next, using two
 * heuristics a real academic advisor leans on:
 *
 *  1. Prioritize courses that unlock the most other courses (their
 *     "out-degree" in the prerequisite graph) — taking these sooner keeps
 *     more of the catalog open for future semesters, instead of leaving a
 *     gatekeeper course for last and stalling everything behind it.
 *  2. Prioritize categories furthest from being fulfilled, so requirements
 *     don't all pile up in the final year.
 *
 * A small credit penalty nudges the mix toward a balanced workload rather
 * than always picking the heaviest courses. This is explicitly a rules-based
 * heuristic, not a trained model — every score is explainable, which is why
 * each pick comes back with plain-language reasons.
 */
export function recommendNextSemester(catalog, completedCourses = [], alreadyPlaced = [], options = {}) {
  const { maxPerSemester = 4 } = options;
  const completed = new Set(completedCourses);
  const placed = new Set(alreadyPlaced);

  // How many other courses does completing `code` unlock?
  const unlockCounts = {};
  Object.values(catalog).forEach((course) => {
    (course.prereq || []).forEach((p) => {
      unlockCounts[p] = (unlockCounts[p] || 0) + 1;
    });
  });

  // How far behind (0-100) each requirement category currently is.
  const progress = categoryProgress(completedCourses, catalog);
  const behindByCategory = Object.fromEntries(progress.map((p) => [p.category, 100 - p.percent]));

  const eligible = Object.keys(catalog).filter((code) => {
    if (completed.has(code) || placed.has(code)) return false;
    return missingPrereqs(code, catalog, completedCourses).length === 0;
  });

  const scored = eligible
    .map((code) => {
      const course = catalog[code];
      const category = course.category || "Elective";
      const unlocks = unlockCounts[code] || 0;
      const categoryBehind = behindByCategory[category] ?? 0;
      const score = unlocks * 20 + categoryBehind * 0.5 - (course.credits || 0) * 0.5;
      return { code, category, unlocks, categoryBehind, score };
    })
    // Higher score first; break ties alphabetically for deterministic output.
    .sort((a, b) => b.score - a.score || a.code.localeCompare(b.code));

  return scored.slice(0, maxPerSemester).map(({ code, category, unlocks, categoryBehind }) => ({
    code,
    reasons: buildReasons({ category, unlocks, categoryBehind }),
  }));
}

function buildReasons({ category, unlocks, categoryBehind }) {
  const reasons = [];

  if (unlocks >= 2) reasons.push(`Unlocks ${unlocks} other courses`);
  else if (unlocks === 1) reasons.push("Unlocks 1 other course");

  if (categoryBehind >= 50) reasons.push(`Catches you up on ${category} requirements`);

  if (reasons.length === 0) reasons.push(`Keeps your ${category} progress moving`);

  return reasons;
}
