import { computeGpa, categoryProgress } from "../utils/gpa";

const CATEGORY_COLOR = {
  Major: "#2563eb",
  "Math & Science": "#7c3aed",
  "Gen Ed": "#ca8a04",
  Elective: "#16a34a",
};

export default function GpaPanel({ completedCourses, grades, catalog }) {
  const { gpa, gpaCredits } = computeGpa(completedCourses, grades, catalog);
  const categories = categoryProgress(completedCourses, catalog);

  return (
    <div className="card" style={{ marginBottom: "12px" }}>
      <div style={{ fontWeight: 700, marginBottom: "8px" }}>📊 GPA & Requirements</div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
        <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
          {gpa !== null ? gpa.toFixed(2) : "—"}
        </div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>
          {gpa !== null ? `cumulative GPA over ${gpaCredits} graded credits` : "no graded courses yet"}
        </div>
      </div>

      {categories.map((c) => (
        <div key={c.category} style={{ marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
            <span style={{ fontWeight: 600 }}>{c.category}</span>
            <span style={{ color: "#64748b" }}>{c.completed} / {c.total} cr</span>
          </div>
          <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
            <div
              style={{
                width: `${c.percent}%`,
                height: "100%",
                background: CATEGORY_COLOR[c.category] || "#2563eb",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
