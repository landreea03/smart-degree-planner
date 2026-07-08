import "./setupEnv.js";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { startTestServer, firstCookiePair } from "./helpers/testServer.js";

let server, baseUrl, programId;

async function signup(email, password = "hunter2222") {
  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(res.status, 201);
  return firstCookiePair(res);
}

before(async () => {
  const app = createApp();
  ({ server, baseUrl } = await startTestServer(app));
  const programs = await (await fetch(`${baseUrl}/api/programs`)).json();
  programId = programs[0].id;
});

after(() => server.close());

test("POST /api/plans requires a signed-in user", async () => {
  const res = await fetch(`${baseUrl}/api/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ programId, name: "No auth plan" }),
  });
  assert.equal(res.status, 401);
});

test("a signed-in user can create, list, update, and delete their own plan", async () => {
  const cookie = await signup("plans-owner@example.com");

  const createRes = await fetch(`${baseUrl}/api/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ programId, name: "Draft plan", maxPerSemester: 5, semesters: [["CS1411"]], completedCourses: [], grades: {} }),
  });
  assert.equal(createRes.status, 201);
  const plan = await createRes.json();
  assert.equal(plan.name, "Draft plan");
  assert.equal(plan.maxPerSemester, 5);

  const listRes = await fetch(`${baseUrl}/api/plans?programId=${programId}`, { headers: { Cookie: cookie } });
  const list = await listRes.json();
  assert.ok(list.some((p) => p.id === plan.id));

  const updateRes = await fetch(`${baseUrl}/api/plans/${plan.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ name: "Renamed plan" }),
  });
  assert.equal(updateRes.status, 200);
  const updated = await updateRes.json();
  assert.equal(updated.name, "Renamed plan");

  const deleteRes = await fetch(`${baseUrl}/api/plans/${plan.id}`, { method: "DELETE", headers: { Cookie: cookie } });
  assert.equal(deleteRes.status, 204);

  const getRes = await fetch(`${baseUrl}/api/plans/${plan.id}`, { headers: { Cookie: cookie } });
  assert.equal(getRes.status, 404);
});

test("one user cannot read, update, or delete another user's plan", async () => {
  const ownerCookie = await signup("plans-victim@example.com");
  const intruderCookie = await signup("plans-intruder@example.com");

  const createRes = await fetch(`${baseUrl}/api/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ownerCookie },
    body: JSON.stringify({ programId, name: "Private plan" }),
  });
  const plan = await createRes.json();

  const getRes = await fetch(`${baseUrl}/api/plans/${plan.id}`, { headers: { Cookie: intruderCookie } });
  assert.equal(getRes.status, 404);

  const updateRes = await fetch(`${baseUrl}/api/plans/${plan.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: intruderCookie },
    body: JSON.stringify({ name: "Hijacked" }),
  });
  assert.equal(updateRes.status, 404);

  const deleteRes = await fetch(`${baseUrl}/api/plans/${plan.id}`, { method: "DELETE", headers: { Cookie: intruderCookie } });
  assert.equal(deleteRes.status, 404);

  const listRes = await fetch(`${baseUrl}/api/plans?programId=${programId}`, { headers: { Cookie: intruderCookie } });
  const list = await listRes.json();
  assert.ok(!list.some((p) => p.id === plan.id), "intruder's plan list should not include another user's plan");
});
