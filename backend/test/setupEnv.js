import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

// Each test file (node:test runs one child process per file) gets its own
// throwaway SQLite database in the OS tmpdir, so tests never see each
// other's data and never touch the real dev database.
process.env.DB_PATH = path.join(os.tmpdir(), `sdp-test-${crypto.randomUUID()}.db`);
process.env.JWT_SECRET = "test-secret-do-not-use-in-production";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.NODE_ENV = "test";
