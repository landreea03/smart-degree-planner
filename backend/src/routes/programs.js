import { Router } from "express";
import { db } from "../db.js";

const router = Router();

// GET /api/programs — list all degree programs
router.get("/", (req, res) => {
  const programs = db.prepare("SELECT * FROM programs ORDER BY name").all();
  res.json(programs);
});

// GET /api/programs/:id/courses — full catalog (with prereqs) for a program
router.get("/:id/courses", (req, res) => {
  const program = db.prepare("SELECT * FROM programs WHERE id = ?").get(req.params.id);
  if (!program) return res.status(404).json({ error: "Program not found" });

  const courses = db.prepare("SELECT * FROM courses WHERE program_id = ? ORDER BY code").all(program.id);
  const prereqStmt = db.prepare("SELECT prereq_code FROM course_prereqs WHERE course_id = ?");

  const catalog = {};
  for (const c of courses) {
    const prereqs = prereqStmt.all(c.id).map((r) => r.prereq_code);
    catalog[c.code] = {
      name: c.name,
      credits: c.credits,
      description: c.description,
      days: c.days,
      time: c.time,
      mode: c.mode,
      category: c.category,
      yearLevel: c.year_level,
      term: c.term,
      prereq: prereqs,
    };
  }

  res.json({ program, catalog });
});

export default router;
