import { estimateGraduation } from "../utils/scheduler";
import { categoryColor } from "../utils/categoryColor";

export default function GraduationForecast({ catalog, completedCourses, maxPerSemester, startYear, includeSummer }) {
  const forecast = estimateGraduation(catalog, {
    maxPerSemester,
    startYear,
    includeSummer,
    completedCourses,
  });

  const allDone = Object.keys(catalog).length > 0 && forecast.totalSemesters === 0 && forecast.unresolved.length === 0;

  return (
    <div>
      <div className="card" style={{ marginBottom: "16px" }}>
        <div style={{ fontWeight: 700, marginBottom: "10px" }}>🎯 Graduation Forecast</div>

        {allDone ? (
          <div style={{ fontSize: "14px" }}>🎉 Every requirement is already completed.</div>
        ) : (
          <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
            <div>
              <div className="muted" style={{ fontSize: "12px", marginBottom: "2px" }}>Projected graduation</div>
              <div style={{ fontSize: "22px", fontWeight: 800 }}>
                {forecast.projectedGraduation || "—"}
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: "12px", marginBottom: "2px" }}>Semesters remaining</div>
              <div style={{ fontSize: "22px", fontWeight: 800 }}>{forecast.totalSemesters}</div>
            </div>
          </div>
        )}

        <div className="muted" style={{ fontSize: "12px", marginTop: "10px" }}>
          Simulated by scheduling every remaining course as early as prerequisites and term availability allow —
          not every course is offered every semester, so this can land later than a naive "credits ÷ max-per-semester" estimate.
        </div>
      </div>

      {forecast.unresolved.length > 0 && (
        <div
          className="card"
          style={{ marginBottom: "16px", background: "var(--danger-soft)", border: "1px solid var(--danger)" }}
        >
          <div style={{ fontWeight: 700, marginBottom: "6px", color: "var(--danger)" }}>
            ⚠️ {forecast.unresolved.length} course{forecast.unresolved.length === 1 ? "" : "s"} can never be scheduled
          </div>
          <div style={{ fontSize: "13px", marginBottom: "6px" }}>
            These have a prerequisite that's missing from the catalog, or sit in a prerequisite cycle — check their
            prereqs in the Course Editor.
          </div>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>{forecast.unresolved.join(", ")}</div>
        </div>
      )}

      {forecast.bottlenecks.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: "10px" }}>🚧 Bottleneck courses</div>
          <div className="muted" style={{ fontSize: "12px", marginBottom: "10px" }}>
            Delaying any of these pushes your graduation date back — they either anchor your longest prerequisite
            chain, or are only offered once a year.
          </div>

          {forecast.bottlenecks.map((b) => {
            const course = catalog[b.code];
            const color = categoryColor(course?.category);
            return (
              <div
                key={b.code}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-2)",
                  marginBottom: "6px",
                  borderLeft: `3px solid ${color.accent}`,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "13px", minWidth: "76px" }}>{b.code}</div>
                <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                  {course?.name && <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{course.name} — </span>}
                  {b.reason}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
