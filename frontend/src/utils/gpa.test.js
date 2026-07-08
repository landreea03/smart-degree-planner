import { describe, it, expect } from "vitest";
import { computeGpa, categoryProgress, GRADE_POINTS, GRADE_OPTIONS } from "./gpa";

describe("GRADE_POINTS / GRADE_OPTIONS", () => {
  it("covers the standard A-F scale", () => {
    expect(GRADE_POINTS.A).toBe(4.0);
    expect(GRADE_POINTS.F).toBe(0.0);
    expect(GRADE_OPTIONS).toContain("B+");
    expect(GRADE_OPTIONS.length).toBe(Object.keys(GRADE_POINTS).length);
  });
});

describe("computeGpa", () => {
  const catalog = {
    CS1411: { credits: 4 },
    ENGL1301: { credits: 3 },
    UNIV1000: { credits: 1 },
  };

  it("computes a credit-weighted GPA", () => {
    const { gpa, gpaCredits } = computeGpa(
      ["CS1411", "ENGL1301"],
      { CS1411: "A", ENGL1301: "B" },
      catalog
    );
    // (4.0*4 + 3.0*3) / 7 = 25/7
    expect(gpa).toBeCloseTo(25 / 7, 5);
    expect(gpaCredits).toBe(7);
  });

  it("returns null gpa when nothing is graded", () => {
    const { gpa, gpaCredits } = computeGpa(["CS1411"], {}, catalog);
    expect(gpa).toBeNull();
    expect(gpaCredits).toBe(0);
  });

  it("excludes ungraded completed courses from the average but not from being valid input", () => {
    const { gpa, gpaCredits } = computeGpa(
      ["CS1411", "UNIV1000"],
      { CS1411: "A" },
      catalog
    );
    expect(gpaCredits).toBe(4);
    expect(gpa).toBe(4.0);
  });

  it("ignores an invalid/unknown grade value", () => {
    const { gpa, gpaCredits } = computeGpa(["CS1411"], { CS1411: "Z" }, catalog);
    expect(gpa).toBeNull();
    expect(gpaCredits).toBe(0);
  });
});

describe("categoryProgress", () => {
  const catalog = {
    CS1411: { credits: 4, category: "Major" },
    CS1412: { credits: 4, category: "Major" },
    ENGL1301: { credits: 3, category: "Gen Ed" },
    ARTS2301: { credits: 3 }, // no category -> defaults to Elective
  };

  it("tracks completed vs. total credits per category", () => {
    const progress = categoryProgress(["CS1411", "ENGL1301"], catalog);
    const major = progress.find((p) => p.category === "Major");
    const genEd = progress.find((p) => p.category === "Gen Ed");
    const elective = progress.find((p) => p.category === "Elective");

    expect(major).toEqual({ category: "Major", completed: 4, total: 8, percent: 50 });
    expect(genEd).toEqual({ category: "Gen Ed", completed: 3, total: 3, percent: 100 });
    expect(elective).toEqual({ category: "Elective", completed: 0, total: 3, percent: 0 });
  });

  it("caps percent at 100 even if somehow over-completed", () => {
    const tinyCatalog = { A: { credits: 3, category: "Major" } };
    const progress = categoryProgress(["A", "A"], tinyCatalog);
    expect(progress[0].percent).toBe(100);
  });
});
