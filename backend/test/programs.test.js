import "./setupEnv.js";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { startTestServer } from "./helpers/testServer.js";

let server, baseUrl;

before(async () => {
  const app = createApp();
  ({ server, baseUrl } = await startTestServer(app));
});

after(() => server.close());

test("GET /api/programs returns a healthy list of degree programs", async () => {
  const res = await fetch(`${baseUrl}/api/programs`);
  assert.equal(res.status, 200);
  const programs = await res.json();
  assert.ok(Array.isArray(programs));
  // The portfolio pitch is "8-10 majors" — guard against that regressing.
  assert.ok(programs.length >= 8, `expected at least 8 programs, got ${programs.length}`);
  for (const p of programs) {
    assert.ok(p.id && p.code && p.name, `program missing id/code/name: ${JSON.stringify(p)}`);
  }
});

test("GET /api/programs/:id/courses returns a catalog with no dangling prerequisites", async () => {
  const programs = await (await fetch(`${baseUrl}/api/programs`)).json();
  assert.ok(programs.length > 0);

  for (const program of programs) {
    const res = await fetch(`${baseUrl}/api/programs/${program.id}/courses`);
    assert.equal(res.status, 200);
    const { catalog } = await res.json();
    const codes = Object.keys(catalog);
    assert.ok(codes.length > 0, `${program.name} has no courses`);

    for (const [code, course] of Object.entries(catalog)) {
      assert.ok(course.credits >= 1 && course.credits <= 5, `${code} has implausible credits: ${course.credits}`);
      assert.ok([1, 2, 3, 4].includes(course.yearLevel), `${code} has invalid yearLevel: ${course.yearLevel}`);
      assert.ok(["Fall", "Spring", "Summer"].includes(course.term), `${code} has invalid term: ${course.term}`);
      for (const prereq of course.prereq) {
        assert.ok(
          codes.includes(prereq),
          `${program.name}: ${code} lists prereq ${prereq}, which isn't in this program's catalog`
        );
      }
    }
  }
});

test("GET /api/programs/:id/courses 404s for an unknown program", async () => {
  const res = await fetch(`${baseUrl}/api/programs/999999/courses`);
  assert.equal(res.status, 404);
});
