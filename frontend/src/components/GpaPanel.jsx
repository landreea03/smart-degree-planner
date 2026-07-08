import { computeGpa, categoryProgress } from "../utils/gpa";
import { categoryColor } from "../utils/categoryColor";

export default function GpaPanel({ completedCourses, grades, catalog }) {
  const { gpa, gpaCredits } = computeGpa(completedCourses, grades, catalog);
  const categories = categoryProgress(completedCourses, catalog);

  return (
    <div className="card" style={{ marginBottom: "12px" }}>
      <div style={{ fontWeight: 700, marginBottom: "8px" }}>📊 GPA & Requirements</div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
        <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)" }}>
          {gpa !== null ? gpa.toFixed(2) : "—"}
        </div>
        <div className="muted" style={{ fontSize: "12px" }}>
          {gpa !== null ? `cumulative GPA over ${gpaCredits} graded credits` : "no graded courses yet"}
        </div>
      </div>

      {categories.map((c) => (
        <div key={c.category} style={{ marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
            <span style={{ fontWeight: 600 }}>{c.category}</span>
            <span className="muted">{c.completed} / {c.total} cr</span>
          </div>
          <div style={{ height: "6px", background: "var(--surface-2)", borderRadius: "999px", overflow: "hidden" }}>
            <div
              style={{
                width: `${c.percent}%`,
                height: "100%",
                background: categoryColor(c.category).accent,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
