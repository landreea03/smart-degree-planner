import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import PlannerBoard from "./components/PlannerBoard";
import CourseDetails from "./components/CourseDetails";
import ProgramSelector from "./components/ProgramSelector";
import MinorSelector from "./components/MinorSelector";
import GpaPanel from "./components/GpaPanel";
import SavedPlans from "./components/SavedPlans";
import YearSelector from "./components/YearSelector";
import CourseMap from "./components/CourseMap";
import ThemeToggle from "./components/ThemeToggle";
import AuthPanel from "./components/AuthPanel";
import GraduationForecast from "./components/GraduationForecast";
import RecommendationsPanel from "./components/RecommendationsPanel";
import AdvisorDashboard from "./components/AdvisorDashboard";
import api from "./api";
import {
  detectConflicts,
  scheduleCourses,
  sumCredits,
  totalCatalogCredits,
  computeBlocked,
  coursesBeforeYear,
  termLabel,
  mergeCatalogs,
} from "./utils/scheduler";

function getInitialTheme() {
  const saved = typeof window !== "undefined" && localStorage.getItem("sdp-theme");
  if (saved === "light" || saved === "dark") return saved;
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function App() {
  // ----- theme -----
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sdp-theme", theme);
  }, [theme]);

  // ----- programs / minors / catalog -----
  const [programs, setPrograms] = useState([]);
  const [minors, setMinors] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [selectedMinorId, setSelectedMinorId] = useState(null);
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

  // ----- auth -----
  const [currentUser, setCurrentUser] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  // Advisors can switch between their own planner and the advisor dashboard.
  const [topLevelView, setTopLevelView] = useState("planner");

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
  const inPlanCodes = new Set([...board.unscheduled, ...board.semesters.flat()]);

  // ----- initial load: programs + minors -----
  useEffect(() => {
    api
      .getPrograms()
      .then((data) => {
        setPrograms(data);
        if (data.length > 0) setSelectedProgramId(data[0].id);
      })
      .catch((err) => setApiError(err.message));

    api.getMinors().then(setMinors).catch(() => {
      // Minors are a nice-to-have; don't block the app if this fails.
    });

    // Restore an existing login session (if the auth cookie is still valid).
    api.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  // ----- load catalog whenever the program or minor changes -----
  useEffect(() => {
    if (!selectedProgramId) return;
    // Loading flag for the fetch this effect kicks off below — intentionally
    // synchronous so the "Loading catalog…" state shows on the same render
    // the selection changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCatalogLoading(true);
    setApiError(null);

    Promise.all([
      api.getProgramCatalog(selectedProgramId),
      selectedMinorId ? api.getMinorCatalog(selectedMinorId) : Promise.resolve({ catalog: {} }),
    ])
      .then(([{ catalog: programCatalog }, { catalog: minorCatalog }]) => {
        const catalog = mergeCatalogs(programCatalog, minorCatalog);
        setMasterCatalog(catalog);
        setCourses(structuredClone(catalog));
        setCompletedCourses([]);
        setGrades({});
        setBoard({ unscheduled: Object.keys(catalog), semesters: [] });
        setConflicts({});
        setSelectedCourse(null);
        setActivePlanId(null);
        setStartYear(1);
        setIncludeSummer(false);
      })
      .catch((err) => setApiError(err.message))
      .finally(() => setCatalogLoading(false));
  }, [selectedProgramId, selectedMinorId]);

  // ----- keep saved plans in sync with the signed-in user + selected program -----
  useEffect(() => {
    if (!selectedProgramId || !currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedPlans([]);
      return;
    }
    api
      .listPlans(selectedProgramId)
      .then(setSavedPlans)
      .catch(() => setSavedPlans([]));
  }, [selectedProgramId, currentUser]);

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

  // Turns a set of recommended course codes into a brand-new scheduled
  // semester in one click, pulling those codes out of the unscheduled pool.
  const handleAddRecommendedSemester = (codes) => {
    setBoard((b) => {
      const nextSemesters = [...b.semesters, codes];
      recomputeConflicts(nextSemesters);
      return {
        unscheduled: b.unscheduled.filter((c) => !codes.includes(c)),
        semesters: nextSemesters,
      };
    });
    setActivePlanId(null);
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

  // Adds `code` to the unscheduled pool if it isn't already placed somewhere
  // on the board (avoids ever putting the same code in two columns, which
  // would break drag-and-drop's uniqueness assumption).
  const addCourseToBoard = (code) => {
    setBoard((b) => {
      const alreadyPlaced = b.unscheduled.includes(code) || b.semesters.some((s) => s.includes(code));
      if (alreadyPlaced) return b;
      return { ...b, unscheduled: [...b.unscheduled, code] };
    });
  };

  // Explicit "add to plan" action (Sidebar's + button, and right after a
  // course is created/edited): puts the course on the board and selects it
  // so there's visible feedback that something happened. Callers are
  // trusted to pass a real code — this deliberately doesn't gate on the
  // `courses` closure, since saveCourse() calls this in the same tick as
  // setCourses(), before that state update has actually re-rendered.
  const handleAddToPlan = (code) => {
    if (!code) return;
    addCourseToBoard(code);
    setSelectedCourse(code);
  };

  const toggleCompleted = (code) => {
    const isCompleting = !completedCourses.includes(code);
    setCompletedCourses((prev) => (isCompleting ? [...prev, code] : prev.filter((c) => c !== code)));

    if (isCompleting) {
      // Completed courses don't need scheduling — pull them off the board.
      setBoard((b) => ({
        unscheduled: b.unscheduled.filter((c) => c !== code),
        semesters: b.semesters.map((s) => s.filter((c) => c !== code)),
      }));
    } else {
      // Un-completing: put it back in the unscheduled pool so it can be
      // scheduled again, instead of leaving it in limbo off the board.
      addCourseToBoard(code);
    }
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

  const handleLogin = async (email, password) => {
    setAuthBusy(true);
    try {
      const user = await api.login(email, password);
      setCurrentUser(user);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignup = async (email, password, name) => {
    setAuthBusy(true);
    try {
      const user = await api.signup(email, password, name);
      setCurrentUser(user);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    setAuthBusy(true);
    try {
      await api.logout();
    } catch {
      // Clear local state regardless — the cookie may already be gone.
    } finally {
      setCurrentUser(null);
      setActivePlanId(null);
      setTopLevelView("planner");
      setAuthBusy(false);
    }
  };

  const handleExportPdf = async () => {
    if (!boardRef.current) return;
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#f6f6f8";
    const canvas = await html2canvas(boardRef.current, { backgroundColor: bg, scale: 2 });
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
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">🎓</span>
            Smart Degree Planner
          </div>
          <div className="topbar-actions">
            {currentUser?.role === "advisor" && (
              <button
                className="btn btn-ghost"
                onClick={() => setTopLevelView((v) => (v === "advisor" ? "planner" : "advisor"))}
              >
                {topLevelView === "advisor" ? "🗂 My Planner" : "🧑‍🏫 Advisor Dashboard"}
              </button>
            )}
            {topLevelView === "planner" && (
              <button className="btn btn-ghost" onClick={handleExportPdf}>
                ⬇ Export PDF
              </button>
            )}
            <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
            <AuthPanel
              user={currentUser}
              onLogin={handleLogin}
              onSignup={handleSignup}
              onLogout={handleLogout}
              busy={authBusy}
            />
          </div>
        </div>
      </div>

      {apiError && (
        <div className="page-shell" style={{ paddingBottom: 0 }}>
          <div style={{ padding: "12px 14px", background: "var(--danger-soft)", color: "var(--danger)", borderRadius: "var(--radius)", border: "1px solid var(--danger)", fontSize: "13.5px" }}>
            Couldn't reach the API ({apiError}). Is the backend running? See README for setup.
          </div>
        </div>
      )}

      {topLevelView === "advisor" && currentUser?.role === "advisor" ? (
        <div className="page-shell">
          <AdvisorDashboard />
        </div>
      ) : (
      <div className="page-shell">
        <div className="main-layout">
          <div className="sidebar-col">
            <ProgramSelector programs={programs} selectedProgramId={selectedProgramId} onSelect={setSelectedProgramId} />

            <MinorSelector minors={minors} selectedMinorId={selectedMinorId} onSelect={setSelectedMinorId} />

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
              onToggleCompleted={toggleCompleted}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              inPlanCodes={inPlanCodes}
              onAddToPlan={handleAddToPlan}
            />
          </div>

          <div className="content">
            <div className="card" style={{ marginBottom: "12px" }}>
              <div style={{ fontWeight: "700" }}>🎓 Graduation Progress</div>
              <div className="muted" style={{ marginTop: "6px", fontSize: "13.5px" }}>
                Completed: {completedCredits} / {totalRequiredCredits} &nbsp;·&nbsp; Planned: {plannedCredits} &nbsp;·&nbsp; Remaining: {remainingCredits}
              </div>
              <div style={{ marginTop: "8px", height: "8px", background: "var(--surface-2)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${progressPercent}%`, height: "100%", background: "var(--accent)", transition: "width 0.3s ease" }} />
              </div>
            </div>

            <div className="tabs" style={{ marginBottom: "12px" }}>
              <button className={`tab-btn ${view === "planner" ? "active" : ""}`} onClick={() => setView("planner")}>
                🗂 My Plan
              </button>
              <button className={`tab-btn ${view === "map" ? "active" : ""}`} onClick={() => setView("map")}>
                🗺 Course Map
              </button>
              <button className={`tab-btn ${view === "forecast" ? "active" : ""}`} onClick={() => setView("forecast")}>
                🎯 Forecast
              </button>
            </div>

            {view === "planner" && (
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px", alignItems: "center" }}>
                <button className="btn btn-success" onClick={handleGenerate} disabled={catalogLoading}>
                  ⚡ Generate Plan
                </button>
                <label className="muted" style={{ fontSize: "13px" }}>
                  Max courses / semester{" "}
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={maxPerSemester}
                    onChange={(e) => setMaxPerSemester(Number(e.target.value))}
                    style={{ width: "56px" }}
                    className="input"
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
                  onSelectCourse={setSelectedCourse}
                  semesterLabel={(i) => termLabel(i, { startYear, includeSummer })}
                />
              </div>
            )}

            {!catalogLoading && view === "map" && <CourseMap catalog={masterCatalog} />}

            {!catalogLoading && view === "forecast" && (
              <GraduationForecast
                catalog={masterCatalog}
                completedCourses={completedCourses}
                maxPerSemester={maxPerSemester}
                startYear={startYear}
                includeSummer={includeSummer}
              />
            )}
          </div>

          <div className="details-panel">
            <GpaPanel completedCourses={completedCourses} grades={grades} catalog={masterCatalog} />

            {!catalogLoading && (
              <RecommendationsPanel
                catalog={courses}
                completedCourses={completedCourses}
                scheduledCourses={board.semesters.flat()}
                maxPerSemester={maxPerSemester}
                onAddAsSemester={handleAddRecommendedSemester}
              />
            )}

            <SavedPlans
              plans={savedPlans}
              activePlanId={activePlanId}
              onSave={handleSavePlan}
              onLoad={handleLoadPlan}
              onDelete={handleDeletePlan}
              saving={saving}
              currentUser={currentUser}
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
      )}
    </div>
  );
}
