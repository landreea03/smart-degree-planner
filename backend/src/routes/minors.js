import { Router } from "express";
import { db } from "../db.js";

const router = Router();

// GET /api/minors — list all minors
router.get("/", (req, res) => {
  const minors = db.prepare("SELECT * FROM minors ORDER BY name").all();
  res.json(minors);
});

// GET /api/minors/:id/courses — full catalog (with prereqs) for a minor
router.get("/:id/courses", (req, res) => {
  const minor = db.prepare("SELECT * FROM minors WHERE id = ?").get(req.params.id);
  if (!minor) return res.status(404).json({ error: "Minor not found" });

  const courses = db.prepare("SELECT * FROM minor_courses WHERE minor_id = ? ORDER BY code").all(minor.id);
  const prereqStmt = db.prepare("SELECT prereq_code FROM minor_course_prereqs WHERE course_id = ?");

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
      category: "Minor",
      yearLevel: c.year_level,
      term: c.term,
      offeredTerms: c.offered_terms ? c.offered_terms.split(",") : ["Fall", "Spring", "Summer"],
      prereq: prereqs,
    };
  }

  res.json({ minor, catalog });
});

export default router;
