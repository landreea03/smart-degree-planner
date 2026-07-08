import { useState } from "react";

export default function Sidebar({
  courses,
  setCourses,
  masterCatalog,
  selectedCourse,
  setSelectedCourse,
  completedCourses,
  setCompletedCourses
}) {

  const toggleCompleted = code => {
    setCompletedCourses(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const [search, setSearch] = useState("");

  const emptyCourse = {
    code: "",
    name: "",
    credits: 3,
    description: "",
    days: "",
    time: "",
    mode: "In-Person",
    category: "Elective",
    prereq: []
  };

  const [draft, setDraft] = useState(emptyCourse);

  // 🔎 Search in MASTER catalog so deleted courses still appear
  const filtered = Object.entries(masterCatalog).filter(([code, c]) =>
    code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const startNew = () => {
    setSelectedCourse(null);
    setDraft(emptyCourse);
  };

  // ✅ FIXED: Safe edit function
  const editCourse = code => {
    // If course was deleted, restore it from master catalog
    if (!courses[code] && masterCatalog[code]) {
      setCourses(prev => ({
        ...prev,
        [code]: { ...masterCatalog[code] }
      }));
    }

    setSelectedCourse(code);
    setDraft({ code, ...(courses[code] || masterCatalog[code]) });
  };

  const saveCourse = () => {
    if (!draft.code.trim()) return alert("Course must have a code.");

    const code = draft.code.trim().toUpperCase();

    const copy = { ...courses };

    copy[code] = {
      name: draft.name || code,
      credits: Number(draft.credits) || 3,
      description: draft.description || "",
      prereq: draft.prereq || [],
      days: draft.days || "",
      time: draft.time || "",
      mode: draft.mode || "In-Person",
      category: draft.category || "Elective"
    };

    setCourses(copy);
    setSelectedCourse(code);
  };

  const deleteCourse = () => {
    if (!selectedCourse) return;

    const copy = { ...courses };
    delete copy[selectedCourse];

    // Remove from prerequisites everywhere
    Object.values(copy).forEach(c => {
      c.prereq = c.prereq.filter(p => p !== selectedCourse);
    });

    setCourses(copy);
    setSelectedCourse(null);
    setDraft(emptyCourse);
  };

  const togglePrereq = p => {
    setDraft(d => ({
      ...d,
      prereq: d.prereq.includes(p)
        ? d.prereq.filter(x => x !== p)
        : [...d.prereq, p]
    }));
  };

  return (
    <div className="sidebar">

      {/* ===== COURSE LIST ===== */}
      <div className="section-title">Courses</div>

      <input
        className="input"
        placeholder="Search courses..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{ maxHeight: "220px", overflowY: "auto", marginBottom: "12px" }}>
        {filtered.map(([code, c]) => (
          <div
            key={code}
            className={`course-item ${selectedCourse === code ? "selected" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <input
              type="checkbox"
              checked={completedCourses.includes(code)}
              onChange={() => toggleCompleted(code)}
            />

            <div onClick={() => editCourse(code)} style={{ cursor: "pointer" }}>
              <b>{code}</b>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>{c.name}</div>
            </div>
          </div>
        ))}
      </div>

      <button className="btn" style={{ width: "100%" }} onClick={startNew}>
        ➕ New Course
      </button>

      {/* ===== COURSE EDITOR ===== */}
      <div className="section-title" style={{ marginTop: "12px" }}>
        Course Editor
      </div>

      {/* CODE with AUTOCOMPLETE */}
      <input
        className="input"
        placeholder="Course Code (e.g. CS1411)"
        list="course-codes"
        value={draft.code}
        onChange={e => setDraft(d => ({ ...d, code: e.target.value.toUpperCase() }))}
      />

      <datalist id="course-codes">
        {Object.keys(masterCatalog).map(c => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <input
        className="input"
        placeholder="Course Name"
        value={draft.name}
        onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
      />

      <input
        className="input"
        type="number"
        placeholder="Credits"
        value={draft.credits}
        onChange={e => setDraft(d => ({ ...d, credits: e.target.value }))}
      />

      <input
        className="input"
        placeholder="Days (MWF / TR)"
        value={draft.days}
        onChange={e => setDraft(d => ({ ...d, days: e.target.value }))}
      />

      <input
        className="input"
        placeholder="Time (09:00 - 09:50)"
        value={draft.time}
        onChange={e => setDraft(d => ({ ...d, time: e.target.value }))}
      />

      <select
        className="input"
        value={draft.mode}
        onChange={e => setDraft(d => ({ ...d, mode: e.target.value }))}
      >
        <option>In-Person</option>
        <option>Hybrid</option>
        <option>Online</option>
      </select>

      <select
        className="input"
        value={draft.category || "Elective"}
        onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
      >
        <option>Major</option>
        <option>Math & Science</option>
        <option>Gen Ed</option>
        <option>Elective</option>
      </select>

      <textarea
        className="input"
        placeholder="Description"
        value={draft.description}
        onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
      />

      {/* ===== PREREQUISITES ===== */}
      <div style={{ fontSize: "12px", marginTop: "6px", marginBottom: "4px" }}>
        Prerequisites
      </div>

      <div style={{ maxHeight: "120px", overflowY: "auto" }}>
        {Object.keys(courses).map(c => (
          <label key={c} style={{ display: "block", fontSize: "12px" }}>
            <input
              type="checkbox"
              checked={draft.prereq.includes(c)}
              onChange={() => togglePrereq(c)}
            />{" "}
            {c}
          </label>
        ))}
      </div>

      <button
        className="btn btn-primary"
        style={{ width: "100%", marginTop: "10px" }}
        onClick={saveCourse}
      >
        💾 Save Course
      </button>

      {selectedCourse && (
        <button
          className="btn"
          style={{ width: "100%", marginTop: "6px", background: "#fee2e2" }}
          onClick={deleteCourse}
        >
          🗑 Delete Course
        </button>
      )}

    </div>
  );
}
