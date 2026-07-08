import "dotenv/config";
import express from "express";
import cors from "cors";
import { initSchema } from "./db.js";
import { seed } from "./seedData.js";
import programsRouter from "./routes/programs.js";
import plansRouter from "./routes/plans.js";

initSchema();
seed(); // no-op if the database already has data

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/programs", programsRouter);
app.use("/api/plans", plansRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Smart Degree Planner API listening on http://localhost:${PORT}`);
});
