import { GRADE_OPTIONS } from "../utils/gpa";

export default function CourseDetails({ selectedCourse, courses, onDelete, isCompleted, grade, onGradeChange }) {

  if (!selectedCourse || !courses[selectedCourse]) {
    return (
      <div className="card">
        <div style={{ color: "#64748b" }}>
          Select a course to see details
        </div>
      </div>
    );
  }

  const course = courses[selectedCourse];

  return (
    <div className="card">
      <h2>{selectedCourse} — {course.name}</h2>

      {course.category && (
        <span
          style={{
            display: "inline-block",
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "999px",
            background: "#eef2ff",
            color: "#4338ca",
            marginBottom: "8px",
          }}
        >
          {course.category}
        </span>
      )}

      <div style={{ marginBottom: "8px", color: "#475569" }}>
        {course.description}
      </div>

      <div style={{ fontSize: "14px", lineHeight: "1.8" }}>
        <div><b>Credits:</b> {course.credits}</div>
        <div><b>Days:</b> {course.days}</div>
        <div><b>Time:</b> {course.time}</div>
        <div><b>Mode:</b> {course.mode}</div>
      </div>

      {/* ✅ PREREQUISITES */}
      <div style={{ marginTop: "12px" }}>
        <b>Prerequisites:</b>
        <div style={{ marginTop: "6px", fontSize: "14px" }}>
          {course.prereq.length === 0
            ? "None"
            : course.prereq.join(", ")}
        </div>
      </div>

      {isCompleted && (
        <div style={{ marginTop: "12px" }}>
          <b>Grade earned:</b>
          <select
            className="input"
            style={{ marginTop: "6px" }}
            value={grade || ""}
            onChange={(e) => onGradeChange(selectedCourse, e.target.value)}
          >
            <option value="">— not graded —</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      )}

      <button
        className="btn"
        style={{ marginTop: "12px", background: "#fee2e2" }}
        onClick={onDelete}
      >
        🗑 Delete Course
      </button>
    </div>
  );
}
