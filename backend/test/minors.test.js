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

test("GET /api/minors returns the general minors", async () => {
  const res = await fetch(`${baseUrl}/api/minors`);
  assert.equal(res.status, 200);
  const minors = await res.json();
  assert.ok(Array.isArray(minors));
  assert.ok(minors.length >= 5, `expected at least 5 minors, got ${minors.length}`);
});

test("GET /api/minors/:id/courses tags every course as category 'Minor' with no dangling prereqs", async () => {
  const minors = await (await fetch(`${baseUrl}/api/minors`)).json();
  assert.ok(minors.length > 0);

  for (const minor of minors) {
    const res = await fetch(`${baseUrl}/api/minors/${minor.id}/courses`);
    assert.equal(res.status, 200);
    const { catalog } = await res.json();
    const codes = Object.keys(catalog);
    assert.ok(codes.length > 0, `${minor.name} has no courses`);

    for (const [code, course] of Object.entries(catalog)) {
      assert.equal(course.category, "Minor", `${code} in ${minor.name} should be tagged category "Minor"`);
      for (const prereq of course.prereq) {
        assert.ok(codes.includes(prereq), `${minor.name}: ${code} lists prereq ${prereq} not in this minor's catalog`);
      }
    }
  }
});

test("GET /api/minors/:id/courses 404s for an unknown minor", async () => {
  const res = await fetch(`${baseUrl}/api/minors/999999/courses`);
  assert.equal(res.status, 404);
});
