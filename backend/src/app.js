import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initSchema } from "./db.js";
import { seed } from "./seedData.js";
import { attachUser } from "./auth.js";
import authRouter from "./routes/auth.js";
import programsRouter from "./routes/programs.js";
import minorsRouter from "./routes/minors.js";
import plansRouter from "./routes/plans.js";

/**
 * Builds the configured Express app without starting a listener, so tests
 * can drive it directly (or on an ephemeral port) instead of needing a
 * fixed PORT to be free.
 */
export function createApp() {
  initSchema();
  seed(); // no-op if the database already has data

  const app = express();
  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim());

  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(attachUser);

  app.get("/api/health", (req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRouter);
  app.use("/api/programs", programsRouter);
  app.use("/api/minors", minorsRouter);
  app.use("/api/plans", plansRouter);

  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

export default createApp;
