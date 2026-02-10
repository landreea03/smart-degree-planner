export default function PlannerBoard({ plan, conflicts }) {
    if (!plan || plan.length === 0) return null;
  
    return (
      <div className="planner-grid">
        {plan.map((sem, i) => (
          <div key={i} className="card semester-card">
            <div style={{ fontWeight: "700", marginBottom: "8px" }}>
              Semester {i + 1}
            </div>
  
            {/* ⚠️ Conflict warning */}
            {conflicts?.[i]?.size > 0 && (
              <div
                style={{
                  background: "#fee2e2",
                  color: "#991b1b",
                  padding: "8px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "8px"
                }}
              >
                ⚠️ Time conflict detected in this semester
              </div>
            )}
  
            {/* Courses */}
            {sem.map(courseCode => {
              const dept = courseCode.split(/[0-9]/)[0];
              const isConflict = conflicts?.[i]?.has(courseCode);
  
              return (
                <div
                  key={courseCode}
                  className={`course-chip ${dept}`}
                  style={{
                    marginBottom: "8px",
                    textAlign: "center",
                    border: isConflict ? "2px solid red" : undefined,
                    background: isConflict ? "#fee2e2" : undefined
                  }}
                >
                  {courseCode}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }
  