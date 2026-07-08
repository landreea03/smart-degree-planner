import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

// Every route here requires a signed-in user, and every query is scoped to
// req.user.id — one person's plans are never visible to another.
router.use(requireAuth);

function serialize(row) {
  if (!row) return null;
  return {
    id: row.id,
    programId: row.program_id,
    name: row.name,
    maxPerSemester: row.max_per_semester,
    semesters: JSON.parse(row.semesters_json),
    completedCourses: JSON.parse(row.completed_json),
    grades: JSON.parse(row.grades_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/plans?programId=1 — list the current user's saved plans (optionally filtered by program)
router.get("/", (req, res) => {
  const { programId } = req.query;
  const rows = programId
    ? db.prepare("SELECT * FROM plans WHERE user_id = ? AND program_id = ? ORDER BY updated_at DESC").all(req.user.id, programId)
    : db.prepare("SELECT * FROM plans WHERE user_id = ? ORDER BY updated_at DESC").all(req.user.id);
  res.json(rows.map(serialize));
});

// GET /api/plans/:id
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM plans WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: "Plan not found" });
  res.json(serialize(row));
});

// POST /api/plans — create a new saved plan owned by the current user
router.post("/", (req, res) => {
  const { programId, name, maxPerSemester, semesters, completedCourses, grades } = req.body;

  if (!programId || !name) {
    return res.status(400).json({ error: "programId and name are required" });
  }

  const stmt = db.prepare(`
    INSERT INTO plans (user_id, program_id, name, max_per_semester, semesters_json, completed_json, grades_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    req.user.id,
    programId,
    name,
    maxPerSemester || 4,
    JSON.stringify(semesters || []),
    JSON.stringify(completedCourses || []),
    JSON.stringify(grades || {})
  );

  const row = db.prepare("SELECT * FROM plans WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(serialize(row));
});

// PUT /api/plans/:id — update an existing saved plan (must be owned by the current user)
router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM plans WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Plan not found" });

  const { name, maxPerSemester, semesters, completedCourses, grades } = req.body;

  db.prepare(`
    UPDATE plans SET
      name = COALESCE(?, name),
      max_per_semester = COALESCE(?, max_per_semester),
      semesters_json = COALESCE(?, semesters_json),
      completed_json = COALESCE(?, completed_json),
      grades_json = COALESCE(?, grades_json),
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(
    name ?? null,
    maxPerSemester ?? null,
    semesters ? JSON.stringify(semesters) : null,
    completedCourses ? JSON.stringify(completedCourses) : null,
    grades ? JSON.stringify(grades) : null,
    req.params.id,
    req.user.id
  );

  const row = db.prepare("SELECT * FROM plans WHERE id = ?").get(req.params.id);
  res.json(serialize(row));
});

// DELETE /api/plans/:id
router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM plans WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: "Plan not found" });
  res.status(204).end();
});

export default router;
