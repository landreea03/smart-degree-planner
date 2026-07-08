import { GRADE_OPTIONS } from "../utils/gpa";
import { categoryColor } from "../utils/categoryColor";

export default function CourseDetails({ selectedCourse, courses, onDelete, isCompleted, grade, onGradeChange }) {

  if (!selectedCourse || !courses[selectedCourse]) {
    return (
      <div className="card">
        <div className="muted">
          Select a course to see details
        </div>
      </div>
    );
  }

  const course = courses[selectedCourse];
  const color = categoryColor(course.category);

  return (
    <div className="card">
      <h2 style={{ fontSize: "17px" }}>{selectedCourse} — {course.name}</h2>

      {course.category && (
        <span
          className="badge"
          style={{
            background: color.soft,
            color: color.accent,
            marginBottom: "8px",
          }}
        >
          <span className="badge-dot" />
          {course.category}
        </span>
      )}

      <div className="muted" style={{ marginBottom: "8px", fontSize: "13.5px" }}>
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
        className="btn btn-danger-soft"
        style={{ marginTop: "12px" }}
        onClick={onDelete}
      >
        🗑 Delete Course
      </button>
    </div>
  );
}
