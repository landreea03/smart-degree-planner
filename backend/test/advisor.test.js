import "./setupEnv.js";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { db } from "../src/db.js";
import { startTestServer, firstCookiePair } from "./helpers/testServer.js";

let server, baseUrl, programId;

// The public signup route always creates a student (see routes/auth.js) —
// deliberately, so nobody can self-promote to advisor. To test advisor
// behavior, sign up normally and then patch the role directly in the test
// database, the same way the real promoteAdvisor.js script would. A fresh
// login afterward is required because the role is baked into the JWT at
// sign time, not looked up per-request.
async function signup(email, role = "student", password = "hunter2222") {
  const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(signupRes.status, 201);
  const signupBody = await signupRes.json();
  assert.equal(signupBody.role, "student");

  if (role === "student") {
    return { cookie: firstCookiePair(signupRes), user: signupBody };
  }

  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, signupBody.id);

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(loginRes.status, 200);
  const loginBody = await loginRes.json();
  assert.equal(loginBody.role, role);

  return { cookie: firstCookiePair(loginRes), user: loginBody };
}

before(async () => {
  const app = createApp();
  ({ server, baseUrl } = await startTestServer(app));
  const programs = await (await fetch(`${baseUrl}/api/programs`)).json();
  programId = programs[0].id;
});

after(() => server.close());

test("signup always creates a student account, even if the client asks for 'advisor'", async () => {
  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "sneaky@example.com", password: "hunter2222", role: "advisor" }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.role, "student");

  // And that account genuinely can't reach advisor routes.
  const cookie = firstCookiePair(res);
  const advisorRes = await fetch(`${baseUrl}/api/advisor/students`, { headers: { Cookie: cookie } });
  assert.equal(advisorRes.status, 403);
});

test("advisor routes require authentication", async () => {
  const res = await fetch(`${baseUrl}/api/advisor/students`);
  assert.equal(res.status, 401);
});

test("advisor routes reject a signed-in student", async () => {
  const { cookie } = await signup("student-only@example.com", "student");
  const res = await fetch(`${baseUrl}/api/advisor/students`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 403);
});

test("an advisor can list students and see their plan counts", async () => {
  const { cookie: studentCookie } = await signup("student-a@example.com", "student");
  await fetch(`${baseUrl}/api/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ programId, name: "Student A's plan", semesters: [["CS1411"]] }),
  });

  const { cookie: advisorCookie } = await signup("advisor-a@example.com", "advisor");
  const res = await fetch(`${baseUrl}/api/advisor/students`, { headers: { Cookie: advisorCookie } });
  assert.equal(res.status, 200);
  const students = await res.json();
  const studentA = students.find((s) => s.email === "student-a@example.com");
  assert.ok(studentA);
  assert.equal(studentA.planCount, 1);
});

test("an advisor can view a specific student's plans, view a single plan, add a note, and set status", async () => {
  const { cookie: studentCookie, user: student } = await signup("student-b@example.com", "student");
  const createRes = await fetch(`${baseUrl}/api/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ programId, name: "Student B's plan", semesters: [["CS1411", "MATH1451"]] }),
  });
  const plan = await createRes.json();

  const { cookie: advisorCookie } = await signup("advisor-b@example.com", "advisor");

  const studentPlansRes = await fetch(`${baseUrl}/api/advisor/students/${student.id}/plans`, {
    headers: { Cookie: advisorCookie },
  });
  assert.equal(studentPlansRes.status, 200);
  const studentPlansBody = await studentPlansRes.json();
  assert.equal(studentPlansBody.student.email, "student-b@example.com");
  assert.equal(studentPlansBody.plans.length, 1);

  const planRes = await fetch(`${baseUrl}/api/advisor/plans/${plan.id}`, { headers: { Cookie: advisorCookie } });
  assert.equal(planRes.status, 200);
  const planBody = await planRes.json();
  assert.equal(planBody.ownerEmail, "student-b@example.com");
  assert.deepEqual(planBody.notes, []);

  const noteRes = await fetch(`${baseUrl}/api/advisor/plans/${plan.id}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: advisorCookie },
    body: JSON.stringify({ body: "Consider swapping MATH1451 to spring.", courseCode: "MATH1451" }),
  });
  assert.equal(noteRes.status, 201);
  const note = await noteRes.json();
  assert.equal(note.courseCode, "MATH1451");

  const statusRes = await fetch(`${baseUrl}/api/advisor/plans/${plan.id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: advisorCookie },
    body: JSON.stringify({ status: "flagged" }),
  });
  assert.equal(statusRes.status, 200);
  const statusBody = await statusRes.json();
  assert.equal(statusBody.advisorStatus, "flagged");

  const rejectedStatusRes = await fetch(`${baseUrl}/api/advisor/plans/${plan.id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: advisorCookie },
    body: JSON.stringify({ status: "not-a-real-status" }),
  });
  assert.equal(rejectedStatusRes.status, 400);

  const planAfterRes = await fetch(`${baseUrl}/api/advisor/plans/${plan.id}`, { headers: { Cookie: advisorCookie } });
  const planAfter = await planAfterRes.json();
  assert.equal(planAfter.advisorStatus, "flagged");
  assert.equal(planAfter.notes.length, 1);
});

test("advisor analytics aggregates across plans", async () => {
  const { cookie: studentCookie } = await signup("student-c@example.com", "student");
  await fetch(`${baseUrl}/api/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      programId,
      name: "Analytics plan",
      semesters: [["CS1411"], ["CS1412"]],
      completedCourses: ["CS1411"],
      grades: { CS1411: "F" },
    }),
  });

  const { cookie: advisorCookie } = await signup("advisor-c@example.com", "advisor");
  const res = await fetch(`${baseUrl}/api/advisor/analytics`, { headers: { Cookie: advisorCookie } });
  assert.equal(res.status, 200);
  const analytics = await res.json();

  assert.ok(analytics.totalPlans >= 1);
  assert.ok(analytics.totalStudents >= 1);
  assert.ok(Array.isArray(analytics.mostCommonCourses));
  assert.ok(analytics.mostCommonCourses.some((c) => c.code === "CS1411"));
  assert.ok(analytics.atRiskCourses.some((c) => c.code === "CS1411" && c.count >= 1));
  assert.ok(typeof analytics.plansByStatus.none === "number");
  assert.ok(Array.isArray(analytics.plansByProgram));
});
