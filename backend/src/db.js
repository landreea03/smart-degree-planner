import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Uses Node's built-in SQLite module (stable since Node 22.5, no native
// compilation/prebuilt binaries required) so the app has zero native deps.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || "./data/planner.db";
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(__dirname, "..", dbPath);

fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

export const db = new DatabaseSync(resolvedPath);
db.exec("PRAGMA foreign_keys = ON");

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      degree_type TEXT DEFAULT 'B.S.'
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      credits INTEGER NOT NULL DEFAULT 3,
      description TEXT DEFAULT '',
      days TEXT DEFAULT '',
      time TEXT DEFAULT '',
      mode TEXT DEFAULT 'In-Person',
      category TEXT DEFAULT 'Elective',
      year_level INTEGER NOT NULL DEFAULT 1,
      term TEXT NOT NULL DEFAULT 'Fall',
      UNIQUE(program_id, code)
    );

    CREATE TABLE IF NOT EXISTS course_prereqs (
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      prereq_code TEXT NOT NULL,
      PRIMARY KEY (course_id, prereq_code)
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      max_per_semester INTEGER NOT NULL DEFAULT 4,
      semesters_json TEXT NOT NULL DEFAULT '[]',
      completed_json TEXT NOT NULL DEFAULT '[]',
      grades_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  migrate();
}

/**
 * `CREATE TABLE IF NOT EXISTS` only creates a table the first time — it does
 * nothing to a table that already exists with an older shape. So when a
 * column gets added to the schema after someone already has a database file
 * on disk (e.g. `year_level`/`term`, added after the first release), it has
 * to be backfilled here explicitly or every existing DB stays stale forever.
 */
function migrate() {
  const existing = new Set(db.prepare("PRAGMA table_info(courses)").all().map((c) => c.name));

  if (!existing.has("year_level")) {
    db.exec("ALTER TABLE courses ADD COLUMN year_level INTEGER NOT NULL DEFAULT 1");
  }
  if (!existing.has("term")) {
    db.exec("ALTER TABLE courses ADD COLUMN term TEXT NOT NULL DEFAULT 'Fall'");
  }
}

/** Run `fn` inside a BEGIN/COMMIT block, rolling back on error. */
export function transaction(fn) {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export default db;
