import { useState } from "react";

// Preset options for the course editor's dropdowns — grounded in the values
// actually used across the seeded catalogs, plus a couple of sensible
// fallbacks (TBD) for genuinely new courses.
const DAY_OPTIONS = ["MWF", "TR", "MW", "Online", "TBD"];
const TIME_OPTIONS = [
  "08:00 - 08:50",
  "09:00 - 09:50",
  "09:00 - 11:30",
  "09:30 - 10:45",
  "10:00 - 10:50",
  "10:00 - 11:15",
  "11:00 - 11:50",
  "11:00 - 12:15",
  "12:00 - 12:50",
  "12:30 - 13:45",
  "13:00 - 13:50",
  "13:00 - 14:15",
  "13:00 - 15:00",
  "14:00 - 14:50",
  "14:00 - 15:30",
  "14:30 - 15:45",
  "15:00 - 15:50",
  "16:00 - 17:15",
  "Asynchronous",
  "TBD",
];
const CREDIT_OPTIONS = [1, 2, 3, 4, 5];

// Keeps a preset option list usable even when the current draft has a value
// outside the presets (e.g. an older custom course) — it gets added to the
// front of the list instead of silently disappearing from the dropdown.
function withCurrentValue(options, current) {
  if (!current || options.includes(current)) return options;
  return [current, ...options];
}

export default function Sidebar({
  courses,
  setCourses,
  masterCatalog,
  selectedCourse,
  setSelectedCourse,
  completedCourses,
  onToggleCompleted,
  inPlanCodes,
  onAddToPlan,
}) {
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
    yearLevel: 1,
    term: "Fall",
    prereq: [],
  };

  const [draft, setDraft] = useState(emptyCourse);

  // The working catalog (`courses`) reflects edits and brand-new custom
  // courses; `masterCatalog` is the original, untouched fetch — used so a
  // deleted course still shows up here (grayed-out-by-absence, restorable
  // by clicking it) instead of vanishing entirely. Merging them means both
  // deleted originals AND new custom courses are visible in this list.
  const displayCatalog = { ...masterCatalog, ...courses };

  const filtered = Object.entries(displayCatalog).filter(
    ([code, c]) =>
      code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  const startNew = () => {
    setSelectedCourse(null);
    setDraft(emptyCourse);
  };

  const editCourse = (code) => {
    // If the course was deleted, restore it from the master catalog so it's
    // editable again.
    if (!courses[code] && masterCatalog[code]) {
      setCourses((prev) => ({
        ...prev,
        [code]: { ...masterCatalog[code] },
      }));
    }

    setSelectedCourse(code);
    setDraft({ code, ...(courses[code] || masterCatalog[code]) });
  };

  // Restores a deleted course (if needed) and puts it on the plan — used by
  // the list's + button, which can target a course that only still exists
  // in the master catalog.
  const addToPlan = (code) => {
    if (!courses[code] && masterCatalog[code]) {
      setCourses((prev) => ({
        ...prev,
        [code]: { ...masterCatalog[code] },
      }));
    }
    onAddToPlan(code);
  };

  // Selecting/typing a course code that already exists (in the working
  // catalog, or the original catalog if it was deleted) auto-fills the rest
  // of the form from that course's real data, instead of making the user
  // re-type days/time/credits by hand.
  const handleCodeChange = (value) => {
    const code = value.toUpperCase();
    const match = courses[code] || masterCatalog[code];

    if (match) {
      setDraft({ code, ...match, prereq: match.prereq || [] });
    } else {
      setDraft((d) => ({ ...d, code }));
    }
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
      category: draft.category || "Elective",
      yearLevel: Number(draft.yearLevel) || 1,
      term: draft.term || "Fall",
    };

    setCourses(copy);
    setSelectedCourse(code);
    // Make sure the course a person just saved actually shows up somewhere
    // they can schedule it — otherwise it's saved to the catalog but
    // invisible on the planner board and can never end up in a saved plan.
    onAddToPlan(code);
  };

  const deleteCourse = () => {
    if (!selectedCourse) return;

    const copy = { ...courses };
    delete copy[selectedCourse];

    // Remove from prerequisites everywhere
    Object.values(copy).forEach((c) => {
      c.prereq = c.prereq.filter((p) => p !== selectedCourse);
    });

    setCourses(copy);
    setSelectedCourse(null);
    setDraft(emptyCourse);
  };

  const togglePrereq = (p) => {
    setDraft((d) => ({
      ...d,
      prereq: d.prereq.includes(p) ? d.prereq.filter((x) => x !== p) : [...d.prereq, p],
    }));
  };

  const dayOptions = withCurrentValue(DAY_OPTIONS, draft.days);
  const timeOptions = withCurrentValue(TIME_OPTIONS, draft.time);
  const creditOptions = withCurrentValue(CREDIT_OPTIONS, Number(draft.credits));

  return (
    <div className="sidebar">
      {/* ===== COURSE LIST ===== */}
      <div className="section-title">Courses</div>

      <input
        className="input"
        placeholder="Search courses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={{ maxHeight: "220px", overflowY: "auto", marginBottom: "12px" }}>
        {filtered.map(([code, c]) => {
          const isCompleted = completedCourses.includes(code);
          const inPlan = inPlanCodes?.has(code);

          return (
            <div
              key={code}
              className={`course-item ${selectedCourse === code ? "selected" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={() => onToggleCompleted(code)}
              />

              <div onClick={() => editCourse(code)} style={{ cursor: "pointer", flex: 1, minWidth: 0 }}>
                <b>{code}</b>
                <div className="muted" style={{ fontSize: "12px" }}>{c.name}</div>
              </div>

              {!isCompleted && (
                <button
                  type="button"
                  className="btn btn-icon"
                  style={{ width: "24px", height: "24px", fontSize: "12px", flexShrink: 0, opacity: inPlan ? 0.4 : 1 }}
                  disabled={inPlan}
                  title={inPlan ? "Already in your plan" : "Add to plan"}
                  onClick={() => addToPlan(code)}
                >
                  {inPlan ? "✓" : "+"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn" style={{ width: "100%" }} onClick={startNew}>
        ➕ New Course
      </button>

      {/* ===== COURSE EDITOR ===== */}
      <div className="section-title" style={{ marginTop: "12px" }}>
        Course Editor
      </div>

      {/* CODE with AUTOCOMPLETE — selecting/typing an existing code
          auto-fills the rest of the fields below. */}
      <input
        className="input"
        placeholder="Course Code (e.g. CS1411)"
        list="course-codes"
        value={draft.code}
        onChange={(e) => handleCodeChange(e.target.value)}
      />

      <datalist id="course-codes">
        {Object.keys(displayCatalog).map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <input
        className="input"
        placeholder="Course Name"
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
      />

      <select
        className="input"
        value={Number(draft.credits) || 3}
        onChange={(e) => setDraft((d) => ({ ...d, credits: Number(e.target.value) }))}
      >
        {creditOptions.map((c) => (
          <option key={c} value={c}>
            {c} credit{c === 1 ? "" : "s"}
          </option>
        ))}
      </select>

      <select
        className="input"
        value={draft.days}
        onChange={(e) => setDraft((d) => ({ ...d, days: e.target.value }))}
      >
        <option value="">Select days…</option>
        {dayOptions.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select
        className="input"
        value={draft.time}
        onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
      >
        <option value="">Select time…</option>
        {timeOptions.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <select
        className="input"
        value={draft.mode}
        onChange={(e) => setDraft((d) => ({ ...d, mode: e.target.value }))}
      >
        <option>In-Person</option>
        <option>Hybrid</option>
        <option>Online</option>
      </select>

      <select
        className="input"
        value={draft.category || "Elective"}
        onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
      >
        <option>Major</option>
        <option>Math & Science</option>
        <option>Gen Ed</option>
        <option>Elective</option>
        <option>Minor</option>
      </select>

      <div style={{ display: "flex", gap: "8px" }}>
        <select
          className="input"
          value={draft.yearLevel || 1}
          onChange={(e) => setDraft((d) => ({ ...d, yearLevel: Number(e.target.value) }))}
        >
          <option value={1}>Freshman year</option>
          <option value={2}>Sophomore year</option>
          <option value={3}>Junior year</option>
          <option value={4}>Senior year</option>
        </select>

        <select
          className="input"
          value={draft.term || "Fall"}
          onChange={(e) => setDraft((d) => ({ ...d, term: e.target.value }))}
        >
          <option>Fall</option>
          <option>Spring</option>
          <option>Summer</option>
        </select>
      </div>

      <textarea
        className="input"
        placeholder="Description"
        value={draft.description}
        onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
      />

      {/* ===== PREREQUISITES ===== */}
      <div className="muted" style={{ fontSize: "12px", marginTop: "6px", marginBottom: "4px", fontWeight: 600 }}>
        Prerequisites
      </div>

      <div style={{ maxHeight: "120px", overflowY: "auto" }}>
        {Object.keys(courses).map((c) => (
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
          className="btn btn-danger-soft"
          style={{ width: "100%", marginTop: "6px" }}
          onClick={deleteCourse}
        >
          🗑 Delete Course
        </button>
      )}
    </div>
  );
}
