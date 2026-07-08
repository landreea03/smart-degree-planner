import "./setupEnv.js";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { startTestServer, firstCookiePair } from "./helpers/testServer.js";

let server, baseUrl;

before(async () => {
  const app = createApp();
  ({ server, baseUrl } = await startTestServer(app));
});

after(() => server.close());

const EMAIL = "andreea@example.com";
const PASSWORD = "hunter2222";

test("POST /api/auth/signup rejects a weak password", async () => {
  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "weak@example.com", password: "short" }),
  });
  assert.equal(res.status, 400);
});

test("POST /api/auth/signup rejects an invalid email", async () => {
  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", password: PASSWORD }),
  });
  assert.equal(res.status, 400);
});

test("POST /api/auth/signup creates an account, sets a session cookie, and hides the password hash", async () => {
  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: "Andreea" }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.email, EMAIL);
  assert.equal(body.name, "Andreea");
  assert.equal(body.password_hash, undefined);
  assert.ok(firstCookiePair(res), "expected a Set-Cookie header on signup");
});

test("POST /api/auth/signup rejects a duplicate email", async () => {
  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  assert.equal(res.status, 409);
});

test("POST /api/auth/login rejects a wrong password", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: "wrong-password" }),
  });
  assert.equal(res.status, 401);
});

test("POST /api/auth/login succeeds with correct credentials and GET /api/auth/me returns the session", async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  assert.equal(loginRes.status, 200);
  const cookie = firstCookiePair(loginRes);
  assert.ok(cookie);

  const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(meRes.status, 200);
  const me = await meRes.json();
  assert.equal(me.email, EMAIL);
});

test("GET /api/auth/me returns 401 without a session cookie", async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(res.status, 401);
});

test("POST /api/auth/logout clears the session", async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const cookie = firstCookiePair(loginRes);

  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST", headers: { Cookie: cookie } });
  assert.equal(logoutRes.status, 204);
  const clearedCookie = firstCookiePair(logoutRes);
  assert.ok(clearedCookie, "logout should send a Set-Cookie clearing the session");
});
