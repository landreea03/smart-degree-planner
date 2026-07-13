import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from "../auth.js";

const router = Router();

function publicUser(row) {
  return { id: row.id, email: row.email, name: row.name, role: row.role || "student" };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/signup", async (req, res) => {
  // Deliberately not reading `role` from the request body: letting the
  // client choose its own role would mean anyone could self-promote to
  // "advisor" and read every other user's saved plans. Every account
  // starts as a student; promoting one to advisor is a deliberate,
  // out-of-band action (see backend/src/promoteAdvisor.js), not something
  // exposed over the public API.
  const { email, password, name } = req.body || {};

  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: "A valid email is required" });
  if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: "An account with that email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const result = db
    .prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'student')")
    .run(email.toLowerCase(), passwordHash, name || "");

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
  setAuthCookie(res, signToken(user));
  res.status(201).json(publicUser(user));
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  setAuthCookie(res, signToken(user));
  res.json(publicUser(user));
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  res.json(publicUser(user));
});

export default router;
