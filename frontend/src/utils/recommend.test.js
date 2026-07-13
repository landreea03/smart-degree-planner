import { describe, it, expect } from "vitest";
import { recommendNextSemester } from "./recommend";

describe("recommendNextSemester", () => {
  it("prioritizes a course that unlocks more future courses", () => {
    const catalog = {
      GATEKEEPER: { prereq: [], credits: 3, category: "Major" }, // unlocks 2 courses below
      LEAF: { prereq: [], credits: 3, category: "Major" }, // unlocks nothing
      DOWNSTREAM1: { prereq: ["GATEKEEPER"], credits: 3, category: "Major" },
      DOWNSTREAM2: { prereq: ["GATEKEEPER"], credits: 3, category: "Major" },
    };
    const recs = recommendNextSemester(catalog, [], [], { maxPerSemester: 1 });
    expect(recs[0].code).toBe("GATEKEEPER");
    expect(recs[0].reasons.join(" ")).toMatch(/unlocks 2/i);
  });

  it("prioritizes a category that's furthest behind", () => {
    const catalog = {
      MAJ1: { prereq: [], credits: 3, category: "Major" },
      MAJ2: { prereq: [], credits: 3, category: "Major" }, // Major already 1/2 done
      GENED1: { prereq: [], credits: 3, category: "Gen Ed" }, // Gen Ed 0% done — furthest behind
    };
    const recs = recommendNextSemester(catalog, ["MAJ1"], [], { maxPerSemester: 1 });
    expect(recs[0].code).toBe("GENED1");
    expect(recs[0].reasons.join(" ")).toMatch(/gen ed/i);
  });

  it("excludes completed and already-scheduled courses", () => {
    const catalog = {
      A: { prereq: [], credits: 3, category: "Major" },
      B: { prereq: [], credits: 3, category: "Major" },
      C: { prereq: [], credits: 3, category: "Major" },
    };
    const recs = recommendNextSemester(catalog, ["A"], ["B"], { maxPerSemester: 5 });
    const codes = recs.map((r) => r.code);
    expect(codes).not.toContain("A");
    expect(codes).not.toContain("B");
    expect(codes).toContain("C");
  });

  it("excludes courses whose prerequisites aren't met yet", () => {
    const catalog = {
      A: { prereq: [], credits: 3, category: "Major" },
      B: { prereq: ["A"], credits: 3, category: "Major" },
    };
    const recs = recommendNextSemester(catalog, [], [], { maxPerSemester: 5 });
    const codes = recs.map((r) => r.code);
    expect(codes).toContain("A");
    expect(codes).not.toContain("B");
  });

  it("never returns more than maxPerSemester recommendations", () => {
    const catalog = {};
    for (let i = 0; i < 10; i++) catalog[`C${i}`] = { prereq: [], credits: 3, category: "Elective" };
    const recs = recommendNextSemester(catalog, [], [], { maxPerSemester: 3 });
    expect(recs.length).toBe(3);
  });

  it("returns an empty list when nothing is eligible", () => {
    const catalog = { A: { prereq: [], credits: 3, category: "Major" } };
    const recs = recommendNextSemester(catalog, ["A"], [], { maxPerSemester: 4 });
    expect(recs).toEqual([]);
  });

  it("always gives every recommendation at least one reason", () => {
    const catalog = { A: { prereq: [], credits: 3, category: "Elective" } };
    const recs = recommendNextSemester(catalog, [], [], { maxPerSemester: 1 });
    expect(recs[0].reasons.length).toBeGreaterThan(0);
  });
});
