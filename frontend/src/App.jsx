import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import PlannerBoard from "./components/PlannerBoard";
import CourseDetails from "./components/CourseDetails";
import ProgramSelector from "./components/ProgramSelector";
import GpaPanel from "./components/GpaPanel";
import SavedPlans from "./components/SavedPlans";
import YearSelector from "./components/YearSelector";
import CourseMap from "./components/CourseMap";
import api from "./api";
import {
  detectConflicts,
  scheduleCourses,
  sumCredits,
  totalCatalogCredits,
  computeBlocked,
  coursesBeforeYear,
  termLabel,
} from "./utils/scheduler";

export default function App() {
  // ----- programs / catalog -----
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [masterCatalog, setMasterCatalog] = useState({});
  const [courses, setCourses] = useState({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // ----- plan state -----
  const [completedCourses, setCompletedCourses] = useState([]);
  const [grades, setGrades] = useState({});
  const [maxPerSemester, setMaxPerSemester] = useState(4);
  const [board, setBoard] = useState({ unscheduled: [], semesters: [] });
  const [conflicts, setConflicts] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [startYear, setStartYear] = useState(1);
  const [includeSummer, setIncludeSummer] = useState(false);
  const [view, setView] = useState("planner");

  // ----- saved plans -----
  const [savedPlans, setSavedPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [saving, setSaving] = useState(false);

  const boardRef = useRef(null);

  const totalRequiredCredits = totalCatalogCredits(masterCatalog);
  const activeCourses = Object.fromEntries(
    Object.keys(courses).filter((c) => !completedCourses.includes(c)).map((c) => [c, courses[c]])
  );

  const completedCredits = sumCredits(completedCourses, courses);
  const plannedCredits = sumCredits(board.semesters.flat(), courses);
  const progressPercent = totalRequiredCredits
    ? Math.min(100, Math.round((completedCredits / totalRequiredCredits) * 100))
    : 0;
  const remainingCredits = totalRequiredCredits - completedCredits;
  const blocked = computeBlocked(board.unscheduled, board.semesters, courses, completedCourses);

  // ----- initial load: programs -----
  useEffect(() => {
    api
      .getPrograms()
      .then((data) => {
        setPrograms(data);
        if (data.length > 0) setSelectedProgramId(data[0].id);
      })
      .catch((err) => setApiError(err.message));
  }, []);

  // ----- load catalog + saved plans whenever the program changes -----
  useEffect(() => {
    if (!selectedProgramId) return;
    // Loading flag for the fetch this effect kicks off below — intentionally
    // synchronous so the "Loading catalog…" state shows on the same render
    // the program selection changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCatalogLoading(true);
    setApiError(null);

    Promise.all([api.getProgramCatalog(selectedProgramId), api.listPlans(selectedProgramId)])
      .then(([{ catalog }, plans]) => {
        setMasterCatalog(catalog);
        setCourses(structuredClone(catalog));
        setCompletedCourses([]);
        setGrades({});
        setBoard({ unscheduled: Object.keys(catalog), semesters: [] });
        setConflicts({});
        setSelectedCourse(null);
        setSavedPlans(plans);
        setActivePlanId(null);
        setStartYear(1);
        setIncludeSummer(false);
      })
      .catch((err) => setApiError(err.message))
      .finally(() => setCatalogLoading(false));
  }, [selectedProgramId]);

  const recomputeConflicts = useCallback(
    (semesters) => {
      const next = {};
      semesters.forEach((sem, i) => {
        next[i] = detectConflicts(sem, courses);
      });
      setConflicts(next);
    },
    [courses]
  );

  const handleGenerate = () => {
    try {
      const semesters = scheduleCourses(activeCourses, maxPerSemester, completedCourses);
      setBoard({ unscheduled: [], semesters });
      recomputeConflicts(semesters);
      setActivePlanId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddSemester = () => {
    setBoard((b) => ({ ...b, semesters: [...b.semesters, []] }));
  };

  const handleRemoveSemester = (index) => {
    setBoard((b) => {
      const semesters = b.semesters.filter((_, i) => i !== index);
      recomputeConflicts(semesters);
      return { ...b, semesters };
    });
  };

  const listFor = (b, droppableId) =>
    droppableId === "unscheduled" ? b.unscheduled : b.semesters[Number(droppableId.split("-")[1])];

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setBoard((b) => {
      const next = { unscheduled: [...b.unscheduled], semesters: b.semesters.map((s) => [...s]) };
      const sourceList = listFor(next, source.droppableId);
      sourceList.splice(source.index, 1);
      const destList = listFor(next, destination.droppableId);
      destList.splice(destination.index, 0, draggableId);
      recomputeConflicts(next.semesters);
      return next;
    });
    setActivePlanId(null);
  };

  const toggleCompleted = (code) => {
    setCompletedCourses((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      return next;
    });
    // Pull the course off the board either way — completed courses don't need scheduling.
    setBoard((b) => ({
      unscheduled: b.unscheduled.filter((c) => c !== code),
      semesters: b.semesters.map((s) => s.filter((c) => c !== code)),
    }));
  };

  const handleStartYearChange = (year) => {
    setStartYear(year);
    const toComplete = coursesBeforeYear(masterCatalog, year).filter((c) => !completedCourses.includes(c));
    if (toComplete.length === 0) return;

    setCompletedCourses((prev) => [...prev, ...toComplete]);
    setBoard((b) => ({
      unscheduled: b.unscheduled.filter((c) => !toComplete.includes(c)),
      semesters: b.semesters.map((s) => s.filter((c) => !toComplete.includes(c))),
    }));
  };

  const handleGradeChange = (code, grade) => {
    setGrades((g) => ({ ...g, [code]: grade }));
  };

  const handleDeleteCourse = () => {
    if (!selectedCourse) return;
    const copy = { ...courses };
    delete copy[selectedCourse];
    Object.values(copy).forEach((c) => {
      c.prereq = c.prereq.filter((p) => p !== selectedCourse);
    });
    setCourses(copy);
    setCompletedCourses((prev) => prev.filter((c) => c !== selectedCourse));
    setBoard((b) => ({
      unscheduled: b.unscheduled.filter((c) => c !== selectedCourse),
      semesters: b.semesters.map((s) => s.filter((c) => c !== selectedCourse)),
    }));
    setSelectedCourse(null);
  };

  const currentPlanPayload = (name) => ({
    programId: selectedProgramId,
    name,
    maxPerSemester,
    semesters: board.semesters,
    completedCourses,
    grades,
  });

  const handleSavePlan = async (name) => {
    setSaving(true);
    try {
      const created = await api.createPlan(currentPlanPayload(name));
      setSavedPlans((prev) => [created, ...prev]);
      setActivePlanId(created.id);
    } catch (err) {
      alert(`Couldn't save plan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!activePlanId) return;
    setSaving(true);
    try {
      const existing = savedPlans.find((p) => p.id === activePlanId);
      const updated = await api.updatePlan(activePlanId, currentPlanPayload(existing?.name || "Untitled plan"));
      setSavedPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      alert(`Couldn't update plan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadPlan = async (id) => {
    try {
      const plan = await api.getPlan(id);
      const placed = new Set(plan.semesters.flat());
      const unscheduled = Object.keys(courses).filter(
        (c) => !placed.has(c) && !plan.completedCourses.includes(c)
      );
      setBoard({ unscheduled, semesters: plan.semesters });
      setCompletedCourses(plan.completedCourses);
      setGrades(plan.grades);
      setMaxPerSemester(plan.maxPerSemester);
      setActivePlanId(plan.id);
      recomputeConflicts(plan.semesters);
    } catch (err) {
      alert(`Couldn't load plan: ${err.message}`);
    }
  };

  const handleDeletePlan = async (id) => {
    try {
      await api.deletePlan(id);
      setSavedPlans((prev) => prev.filter((p) => p.id !== id));
      if (activePlanId === id) setActivePlanId(null);
    } catch (err) {
      alert(`Couldn't delete plan: ${err.message}`);
    }
  };

  const handleExportPdf = async () => {
    if (!boardRef.current) return;
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const canvas = await html2canvas(boardRef.current, { backgroundColor: "#f8fafc", scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 20, pageWidth, pageHeight);

    const programName = programs.find((p) => p.id === selectedProgramId)?.name || "degree-plan";
    pdf.save(`${programName.replace(/[^\w]+/g, "-")}.pdf`);
  };

  return (
    <div className="app-root">
      <div className="topbar">
        <span>🎓 Smart Degree Planner</span>
        <button className="btn" style={{ background: "rgba(255,255,255,0.15)", color: "white" }} onClick={handleExportPdf}>
          ⬇ Export PDF
        </button>
      </div>

      {apiError && (
        <div style={{ margin: "12px 20px", padding: "12px", background: "#fee2e2", color: "#991b1b", borderRadius: "10px" }}>
          Couldn't reach the API ({apiError}). Is the backend running? See README for setup.
        </div>
      )}

      <div className="main-layout">
        <div className="sidebar-col">
          <ProgramSelector programs={programs} selectedProgramId={selectedProgramId} onSelect={setSelectedProgramId} />

          <YearSelector
            startYear={startYear}
            onChangeStartYear={handleStartYearChange}
            includeSummer={includeSummer}
            onToggleSummer={setIncludeSummer}
          />

          <Sidebar
            courses={courses}
            setCourses={setCourses}
            masterCatalog={masterCatalog}
            completedCourses={completedCourses}
            setCompletedCourses={toggleCompleted}
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
          />
        </div>

        <div className="content">
          <div className="card" style={{ marginBottom: "12px" }}>
            <div style={{ fontWeight: "700" }}>🎓 Graduation Progress</div>
            <div style={{ marginTop: "6px" }}>
              Completed: {completedCredits} / {totalRequiredCredits} | Planned: {plannedCredits} | Remaining: {remainingCredits}
            </div>
            <div style={{ marginTop: "6px", height: "12px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${progressPercent}%`, height: "100%", background: "linear-gradient(90deg,#2563eb,#22c55e)" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <button
              className="btn"
              style={{ background: view === "planner" ? "#2563eb" : "#f1f5f9", color: view === "planner" ? "white" : "#334155" }}
              onClick={() => setView("planner")}
            >
              🗂 My Plan
            </button>
            <button
              className="btn"
              style={{ background: view === "map" ? "#2563eb" : "#f1f5f9", color: view === "map" ? "white" : "#334155" }}
              onClick={() => setView("map")}
            >
              🗺 Course Map
            </button>
          </div>

          {view === "planner" && (
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px", alignItems: "center" }}>
              <button className="btn btn-success" onClick={handleGenerate} disabled={catalogLoading}>
                ⚡ Generate Plan
              </button>
              <label style={{ fontSize: "13px", color: "#475569" }}>
                Max courses / semester{" "}
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={maxPerSemester}
                  onChange={(e) => setMaxPerSemester(Number(e.target.value))}
                  style={{ width: "60px" }}
                />
              </label>
            </div>
          )}

          {catalogLoading && (
            <div className="card">Loading catalog…</div>
          )}

          {!catalogLoading && view === "planner" && (
            <div ref={boardRef}>
              <PlannerBoard
                unscheduled={board.unscheduled}
                semesters={board.semesters}
                catalog={courses}
                conflicts={conflicts}
                blocked={blocked}
                onDragEnd={handleDragEnd}
                onAddSemester={handleAddSemester}
                onRemoveSemester={handleRemoveSemester}
                semesterLabel={(i) => termLabel(i, { startYear, includeSummer })}
              />
            </div>
          )}

          {!catalogLoading && view === "map" && <CourseMap catalog={masterCatalog} />}
        </div>

        <div className="details-panel">
          <GpaPanel completedCourses={completedCourses} grades={grades} catalog={masterCatalog} />

          <SavedPlans
            plans={savedPlans}
            activePlanId={activePlanId}
            onSave={handleSavePlan}
            onLoad={handleLoadPlan}
            onDelete={handleDeletePlan}
            saving={saving}
          />

          {activePlanId && (
            <button className="btn btn-primary" style={{ width: "100%", marginBottom: "12px" }} onClick={handleUpdatePlan} disabled={saving}>
              💾 Update "{savedPlans.find((p) => p.id === activePlanId)?.name}"
            </button>
          )}

          <CourseDetails
            selectedCourse={selectedCourse}
            courses={courses}
            isCompleted={completedCourses.includes(selectedCourse)}
            grade={grades[selectedCourse]}
            onGradeChange={handleGradeChange}
            onDelete={handleDeleteCourse}
          />
        </div>
      </div>
    </div>
  );
}
