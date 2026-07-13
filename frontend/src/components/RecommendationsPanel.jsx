import { recommendNextSemester } from "../utils/recommend";
import { categoryColor } from "../utils/categoryColor";

export default function RecommendationsPanel({ catalog, completedCourses, scheduledCourses, maxPerSemester, onAddAsSemester }) {
  const recs = recommendNextSemester(catalog, completedCourses, scheduledCourses, { maxPerSemester });

  return (
    <div className="card" style={{ marginBottom: "12px" }}>
      <div style={{ fontWeight: 700, marginBottom: "8px" }}>💡 Recommended Next Semester</div>

      {recs.length === 0 ? (
        <div className="muted" style={{ fontSize: "13px" }}>
          Nothing left to recommend — everything eligible is already scheduled, or you're all caught up.
        </div>
      ) : (
        <>
          <div className="muted" style={{ fontSize: "12px", marginBottom: "10px" }}>
            Rules-based picks: courses that unlock the most future classes, weighted toward requirement categories
            you're furthest behind on.
          </div>

          {recs.map((r) => {
            const course = catalog[r.code];
            const color = categoryColor(course?.category);
            return (
              <div
                key={r.code}
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-2)",
                  marginBottom: "6px",
                  borderLeft: `3px solid ${color.accent}`,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "13px" }}>
                  {r.code}{course?.name ? ` — ${course.name}` : ""}
                </div>
                <div className="muted" style={{ fontSize: "11.5px", marginTop: "2px" }}>
                  {r.reasons.join(" · ")}
                </div>
              </div>
            );
          })}

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "6px" }}
            onClick={() => onAddAsSemester(recs.map((r) => r.code))}
          >
            ➕ Add these as a new semester
          </button>
        </>
      )}
    </div>
  );
}
