import { describe, it, expect } from "vitest";
import {
  parseTime,
  daysOverlap,
  timeOverlap,
  detectConflicts,
  missingPrereqs,
  computeBlocked,
  coursesBeforeYear,
  termLabel,
  sumCredits,
  mergeCatalogs,
  totalCatalogCredits,
  scheduleCourses,
} from "./scheduler";

describe("parseTime", () => {
  it("parses a start-end range into minutes", () => {
    expect(parseTime("09:00 - 09:50")).toEqual([540, 590]);
  });

  it("returns null for async/TBD/empty times", () => {
    expect(parseTime("Asynchronous")).toBeNull();
    expect(parseTime("TBD")).toBeNull();
    expect(parseTime("")).toBeNull();
    expect(parseTime(null)).toBeNull();
  });
});

describe("daysOverlap / timeOverlap", () => {
  it("detects a shared day", () => {
    expect(daysOverlap("MWF", "TR")).toBe(false);
    expect(daysOverlap("MWF", "MW")).toBe(true);
  });

  it("detects overlapping time ranges", () => {
    expect(timeOverlap([540, 590], [560, 600])).toBe(true);
    expect(timeOverlap([540, 590], [590, 650])).toBe(false);
    expect(timeOverlap([540, 590], [600, 650])).toBe(false);
  });
});

describe("detectConflicts", () => {
  const catalog = {
    A: { days: "MWF", time: "09:00 - 09:50", mode: "In-Person", credits: 3, prereq: [] },
    B: { days: "MW", time: "09:30 - 10:20", mode: "In-Person", credits: 3, prereq: [] },
    C: { days: "TR", time: "09:00 - 09:50", mode: "In-Person", credits: 3, prereq: [] },
    D: { days: "MWF", time: "09:00 - 09:50", mode: "Online", credits: 3, prereq: [] },
  };

  it("flags two in-person courses with overlapping days and times", () => {
    const conflicts = detectConflicts(["A", "B"], catalog);
    expect(conflicts.has("A")).toBe(true);
    expect(conflicts.has("B")).toBe(true);
  });

  it("does not flag courses on different days", () => {
    const conflicts = detectConflicts(["A", "C"], catalog);
    expect(conflicts.size).toBe(0);
  });

  it("ignores online courses even if the time overlaps", () => {
    const conflicts = detectConflicts(["A", "D"], catalog);
    expect(conflicts.size).toBe(0);
  });
});

describe("missingPrereqs / computeBlocked", () => {
  const catalog = {
    CS1411: { prereq: [], credits: 4 },
    CS1412: { prereq: ["CS1411"], credits: 4 },
    CS2413: { prereq: ["CS1412"], credits: 3 },
  };

  it("reports prereqs not yet completed", () => {
    expect(missingPrereqs("CS1412", catalog, [])).toEqual(["CS1411"]);
    expect(missingPrereqs("CS1412", catalog, ["CS1411"])).toEqual([]);
  });

  it("marks courses blocked when their prereq hasn't been taken yet", () => {
    const blocked = computeBlocked(["CS1412"], [["CS2413"]], catalog, []);
    expect(blocked.unscheduled.has("CS1412")).toBe(true);
    expect(blocked["sem-0"].has("CS2413")).toBe(true);
  });

  it("unblocks a course once its prereq is completed", () => {
    const blocked = computeBlocked(["CS1412"], [], catalog, ["CS1411"]);
    expect(blocked.unscheduled.has("CS1412")).toBe(false);
  });

  it("satisfies a later semester's prereq once it's scheduled in an earlier one", () => {
    const blocked = computeBlocked([], [["CS1411"], ["CS1412"]], catalog, []);
    expect(blocked["sem-0"].has("CS1411")).toBe(false);
    expect(blocked["sem-1"].has("CS1412")).toBe(false);
  });
});

describe("coursesBeforeYear", () => {
  const catalog = {
    A: { yearLevel: 1 },
    B: { yearLevel: 2 },
    C: { yearLevel: 3 },
  };

  it("returns courses with a yearLevel earlier than the given year", () => {
    expect(coursesBeforeYear(catalog, 3).sort()).toEqual(["A", "B"]);
    expect(coursesBeforeYear(catalog, 1)).toEqual([]);
  });
});

describe("termLabel", () => {
  it("labels semesters starting from year 1 without summer", () => {
    expect(termLabel(0)).toBe("Year 1 · Fall");
    expect(termLabel(1)).toBe("Year 1 · Spring");
    expect(termLabel(2)).toBe("Year 2 · Fall");
  });

  it("offsets the label when the student starts partway through the degree", () => {
    expect(termLabel(0, { startYear: 3 })).toBe("Year 3 · Fall");
  });

  it("cycles through Fall/Spring/Summer when summer terms are included", () => {
    expect(termLabel(0, { includeSummer: true })).toBe("Year 1 · Fall");
    expect(termLabel(2, { includeSummer: true })).toBe("Year 1 · Summer");
    expect(termLabel(3, { includeSummer: true })).toBe("Year 2 · Fall");
  });
});

describe("sumCredits / totalCatalogCredits", () => {
  const catalog = { A: { credits: 4 }, B: { credits: 3 }, C: { credits: 3 } };

  it("sums credits for a list of course codes", () => {
    expect(sumCredits(["A", "B"], catalog)).toBe(7);
  });

  it("ignores unknown course codes", () => {
    expect(sumCredits(["A", "ZZZ"], catalog)).toBe(4);
  });

  it("sums every course's credits in a catalog", () => {
    expect(totalCatalogCredits(catalog)).toBe(10);
  });
});

describe("mergeCatalogs", () => {
  it("lets the major's course win on a code collision", () => {
    const program = { ENGL1301: { name: "Major version", credits: 3 } };
    const minor = { ENGL1301: { name: "Minor version", credits: 3 }, ART2301: { name: "Art History", credits: 3 } };
    const merged = mergeCatalogs(program, minor);
    expect(merged.ENGL1301.name).toBe("Major version");
    expect(merged.ART2301.name).toBe("Art History");
  });

  it("handles a missing minor catalog", () => {
    const program = { A: { credits: 3 } };
    expect(mergeCatalogs(program, undefined)).toEqual(program);
  });
});

describe("scheduleCourses", () => {
  it("orders courses into semesters respecting prerequisites", () => {
    const courses = {
      CS1411: { prereq: [], credits: 4 },
      CS1412: { prereq: ["CS1411"], credits: 4 },
      CS2413: { prereq: ["CS1412"], credits: 3 },
      ENGL1301: { prereq: [], credits: 3 },
    };
    const semesters = scheduleCourses(courses, 2, []);

    const codeToSemester = {};
    semesters.forEach((sem, i) => sem.forEach((c) => (codeToSemester[c] = i)));

    expect(codeToSemester.CS1411).toBeLessThan(codeToSemester.CS1412);
    expect(codeToSemester.CS1412).toBeLessThan(codeToSemester.CS2413);
    semesters.forEach((sem) => expect(sem.length).toBeLessThanOrEqual(2));
  });

  it("skips prereqs already completed", () => {
    const courses = {
      CS1412: { prereq: ["CS1411"], credits: 4 },
    };
    const semesters = scheduleCourses(courses, 4, ["CS1411"]);
    expect(semesters.flat()).toEqual(["CS1412"]);
  });

  it("throws on a prerequisite cycle", () => {
    const courses = {
      A: { prereq: ["B"], credits: 3 },
      B: { prereq: ["A"], credits: 3 },
    };
    expect(() => scheduleCourses(courses, 4, [])).toThrow(/cycle/i);
  });
});
