import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requireAdvisor } from "../auth.js";

const router = Router();

// Every route here is for advisors looking at students' data, not their own.
router.use(requireAuth, requireAdvisor);

function serializePlan(row) {
  return {
    id: row.id,
    programId: row.program_id,
    name: row.name,
    maxPerSemester: row.max_per_semester,
    semesters: JSON.parse(row.semesters_json),
    completedCourses: JSON.parse(row.completed_json),
    grades: JSON.parse(row.grades_json),
    advisorStatus: row.advisor_status || "none",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/advisor/students — every student account, with how many plans
// each has saved, so an advisor can see who to check in on.
router.get("/students", (req, res) => {
  const students = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.created_at, COUNT(p.id) AS plan_count
       FROM users u
       LEFT JOIN plans p ON p.user_id = u.id
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY u.name, u.email`
    )
    .all();

  res.json(
    students.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      createdAt: s.created_at,
      planCount: s.plan_count,
    }))
  );
});

// GET /api/advisor/students/:id/plans — a specific student's saved plans.
router.get("/students/:id/plans", (req, res) => {
  const student = db.prepare("SELECT id, email, name FROM users WHERE id = ? AND role = 'student'").get(req.params.id);
  if (!student) return res.status(404).json({ error: "Student not found" });

  const plans = db
    .prepare(
      `SELECT p.*, pr.name AS program_name
       FROM plans p
       JOIN programs pr ON pr.id = p.program_id
       WHERE p.user_id = ?
       ORDER BY p.updated_at DESC`
    )
    .all(req.params.id);

  res.json({
    student,
    plans: plans.map((p) => ({ ...serializePlan(p), programName: p.program_name })),
  });
});

// GET /api/advisor/plans/:id — any single plan (not scoped to the advisor's
// own account), plus its owner, program, and advisor notes.
router.get("/plans/:id", (req, res) => {
  const row = db
    .prepare(
      `SELECT p.*, u.email AS owner_email, u.name AS owner_name, pr.name AS program_name
       FROM plans p
       JOIN users u ON u.id = p.user_id
       JOIN programs pr ON pr.id = p.program_id
       WHERE p.id = ?`
    )
    .get(req.params.id);

  if (!row) return res.status(404).json({ error: "Plan not found" });

  const notes = db
    .prepare("SELECT * FROM plan_notes WHERE plan_id = ? ORDER BY created_at ASC")
    .all(req.params.id);

  res.json({
    ...serializePlan(row),
    ownerEmail: row.owner_email,
    ownerName: row.owner_name,
    programName: row.program_name,
    notes: notes.map((n) => ({
      id: n.id,
      authorName: n.author_name,
      courseCode: n.course_code,
      semesterIndex: n.semester_index,
      body: n.body,
      createdAt: n.created_at,
    })),
  });
});

// POST /api/advisor/plans/:id/notes — leave a note on a plan, optionally
// tied to a specific course or semester.
router.post("/plans/:id/notes", (req, res) => {
  const plan = db.prepare("SELECT id FROM plans WHERE id = ?").get(req.params.id);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  const { body, courseCode, semesterIndex } = req.body || {};
  if (!body || !body.trim()) return res.status(400).json({ error: "Note body is required" });

  const author = db.prepare("SELECT name, email FROM users WHERE id = ?").get(req.user.id);
  const authorName = author?.name || author?.email || "Advisor";

  const result = db
    .prepare(
      `INSERT INTO plan_notes (plan_id, author_id, author_name, course_code, semester_index, body)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.params.id, req.user.id, authorName, courseCode || "", semesterIndex ?? null, body.trim());

  const note = db.prepare("SELECT * FROM plan_notes WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({
    id: note.id,
    authorName: note.author_name,
    courseCode: note.course_code,
    semesterIndex: note.semester_index,
    body: note.body,
    createdAt: note.created_at,
  });
});

const VALID_STATUSES = new Set(["none", "approved", "flagged"]);

// PUT /api/advisor/plans/:id/status — mark a plan approved/flagged/none.
router.put("/plans/:id/status", (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: "status must be 'none', 'approved', or 'flagged'" });
  }

  const result = db.prepare("UPDATE plans SET advisor_status = ? WHERE id = ?").run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Plan not found" });

  res.json({ id: Number(req.params.id), advisorStatus: status });
});

// GET /api/advisor/analytics — cross-plan aggregates: the kind of thing an
// actual registrar's office tracks (which courses show up on the most
// plans, which ones students struggle with, how long people take to
// graduate, how plans are trending status-wise).
router.get("/analytics", (req, res) => {
  const plans = db.prepare("SELECT * FROM plans").all();
  const programs = db.prepare("SELECT id, name FROM programs").all();
  const programNameById = Object.fromEntries(programs.map((p) => [p.id, p.name]));

  const totalStudents = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'student'").get().n;

  const semesterCounts = [];
  const courseFrequency = {};
  const atRiskGrades = new Set(["D+", "D", "D-", "F"]);
  const atRiskFrequency = {};
  const statusCounts = { none: 0, approved: 0, flagged: 0 };
  const programCounts = {};

  for (const row of plans) {
    const semesters = JSON.parse(row.semesters_json || "[]");
    const grades = JSON.parse(row.grades_json || "{}");

    if (semesters.length > 0) semesterCounts.push(semesters.length);

    semesters.flat().forEach((code) => {
      courseFrequency[code] = (courseFrequency[code] || 0) + 1;
    });

    Object.entries(grades).forEach(([code, grade]) => {
      if (atRiskGrades.has(grade)) atRiskFrequency[code] = (atRiskFrequency[code] || 0) + 1;
    });

    const status = VALID_STATUSES.has(row.advisor_status) ? row.advisor_status : "none";
    statusCounts[status] += 1;

    const programName = programNameById[row.program_id] || `Program ${row.program_id}`;
    programCounts[programName] = (programCounts[programName] || 0) + 1;
  }

  const toSortedList = (freq, limit = 10) =>
    Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([code, count]) => ({ code, count }));

  const avgSemestersToGraduate =
    semesterCounts.length > 0
      ? Math.round((semesterCounts.reduce((a, b) => a + b, 0) / semesterCounts.length) * 10) / 10
      : null;

  res.json({
    totalPlans: plans.length,
    totalStudents,
    avgSemestersToGraduate,
    mostCommonCourses: toSortedList(courseFrequency),
    atRiskCourses: toSortedList(atRiskFrequency),
    plansByStatus: statusCounts,
    plansByProgram: Object.entries(programCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([program, count]) => ({ program, count })),
  });
});

export default router;
