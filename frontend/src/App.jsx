import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import PlannerBoard from "./components/PlannerBoard";
import CourseDetails from "./components/CourseDetails";

/* =======================
   MASTER CATALOG
======================= */

const MASTER_CATALOG = {
  CS1411: { name: "Programming I", credits: 4, description: "Intro to programming.", prereq: [], days: "MWF", time: "09:00 - 09:50", mode: "In-Person" },
  CS1412: { name: "Programming II", credits: 4, description: "OOP and data structures.", prereq: ["CS1411"], days: "MWF", time: "10:00 - 10:50", mode: "In-Person" },
  CS1382: { name: "Discrete Structures", credits: 3, description: "Logic and graphs.", prereq: ["CS1411"], days: "TR", time: "11:00 - 12:15", mode: "In-Person" },
  CS2413: { name: "Data Structures", credits: 3, description: "Trees, lists, graphs.", prereq: ["CS1412"], days: "TR", time: "09:30 - 10:45", mode: "In-Person" },
  CS2365: { name: "OOP", credits: 3, description: "Advanced OOP.", prereq: ["CS2413"], days: "MWF", time: "11:00 - 11:50", mode: "In-Person" },
  CS3364: { name: "Algorithms", credits: 3, description: "Algorithm analysis.", prereq: ["CS2413","CS1382"], days: "TR", time: "13:00 - 14:15", mode: "In-Person" },
  CS3375: { name: "Software Engineering", credits: 3, description: "Team software dev.", prereq: ["CS2365"], days: "MWF", time: "12:00 - 12:50", mode: "Hybrid" },
  CS3383: { name: "Automata Theory", credits: 3, description: "Formal languages.", prereq: ["CS3364"], days: "TR", time: "14:30 - 15:45", mode: "In-Person" },
  CS4352: { name: "Operating Systems", credits: 3, description: "OS internals.", prereq: ["CS3364"], days: "MWF", time: "13:00 - 13:50", mode: "In-Person" },
  CS4354: { name: "Database Systems", credits: 3, description: "SQL and DB design.", prereq: ["CS2413"], days: "Online", time: "Asynchronous", mode: "Online" },
  MATH1451: { name: "Calculus I", credits: 4, description: "Derivatives.", prereq: [], days: "MWF", time: "08:00 - 08:50", mode: "In-Person" },
  MATH1452: { name: "Calculus II", credits: 4, description: "Integrals.", prereq: ["MATH1451"], days: "MWF", time: "09:00 - 09:50", mode: "In-Person" },
  ENGL1301: { name: "Rhetoric I", credits: 3, description: "Composition.", prereq: [], days: "Online", time: "Asynchronous", mode: "Online" },
  ENGL1302: { name: "Rhetoric II", credits: 3, description: "Advanced writing.", prereq: ["ENGL1301"], days: "TR", time: "12:30 - 13:45", mode: "Hybrid" },
  PHYS1408: { name: "Physics I", credits: 4, description: "Mechanics.", prereq: ["MATH1451"], days: "MWF", time: "14:00 - 14:50", mode: "In-Person" },
  PHYS2401: { name: "Physics II", credits: 4, description: "Electricity.", prereq: ["PHYS1408","MATH1452"], days: "MWF", time: "15:00 - 15:50", mode: "In-Person" }
};

const totalRequiredCredits = totalCatalogCredits(MASTER_CATALOG);


/* =======================
   CONFLICT ENGINE
======================= */

function parseTime(t) {
  if (!t || t === "Asynchronous" || t === "TBD") return null;
  const [s, e] = t.split("-").map(x => x.trim());
  const toMin = x => {
    const [h, m] = x.split(":").map(Number);
    return h * 60 + m;
  };
  return [toMin(s), toMin(e)];
}

function daysOverlap(a, b) {
  if (!a || !b) return false;
  for (let c of a) if (b.includes(c)) return true;
  return false;
}

function timeOverlap(a, b) {
  if (!a || !b) return false;
  return a[0] < b[1] && b[0] < a[1];
}

function detectConflicts(semester, courses) {
  const conflicts = new Set();

  for (let i = 0; i < semester.length; i++) {
    for (let j = i + 1; j < semester.length; j++) {
      const c1 = courses[semester[i]];
      const c2 = courses[semester[j]];

      if (!c1 || !c2) continue;
      if (c1.mode === "Online" || c2.mode === "Online") continue;

      if (
        daysOverlap(c1.days, c2.days) &&
        timeOverlap(parseTime(c1.time), parseTime(c2.time))
      ) {
        conflicts.add(semester[i]);
        conflicts.add(semester[j]);
      }
    }
  }

  return conflicts;
}

function totalCatalogCredits(catalog) {
  return Object.values(catalog).reduce((sum, c) => sum + (c.credits || 0), 0);
}



/* =======================
   HELPERS
======================= */

function sumCredits(courseList, catalog) {
  return courseList.reduce((sum, c) => sum + (catalog[c]?.credits || 0), 0);
}

function scheduleCourses(courses, maxPerSem) {
  const graph = {}, indeg = {};
  Object.keys(courses).forEach(k => { graph[k] = []; indeg[k] = 0; });

  Object.entries(courses).forEach(([c, v]) => {
    v.prereq.forEach(p => {
      if (!graph[p]) return;
      graph[p].push(c);
      indeg[c]++;
    });
  });

  const ready = Object.keys(indeg).filter(k => indeg[k] === 0);
  const semesters = [];
  let taken = 0;

  while (ready.length) {
    const sem = ready.splice(0, maxPerSem);
    semesters.push(sem);
    sem.forEach(c => {
      taken++;
      graph[c].forEach(n => {
        indeg[n]--;
        if (indeg[n] === 0) ready.push(n);
      });
    });
  }

  if (taken !== Object.keys(courses).length) {
    throw new Error("Impossible schedule: prerequisite cycle detected.");
  }

  return semesters;
}

/* =======================
   APP
======================= */

export default function App() {
  const [courses, setCourses] = useState({ ...MASTER_CATALOG });
  const [completedCourses, setCompletedCourses] = useState([]);
  const [maxPerSemester, setMaxPerSemester] = useState(4);
  const [plan, setPlan] = useState([]);
  const [conflicts, setConflicts] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);

  const activeCourses = Object.fromEntries(
    Object.keys(courses)
      .filter(c => !completedCourses.includes(c))
      .map(c => [c, courses[c]])
  );

  const completedCredits = sumCredits(completedCourses, courses);
  const plannedCredits = sumCredits(plan.flat(), courses);

  const progressPercent = Math.min(
    100,
    Math.round((completedCredits / totalRequiredCredits) * 100)
  );
  
  const remainingCredits = totalRequiredCredits - completedCredits;
  

  return (
    <div className="app-root">
      <div className="topbar">🎓 Smart Degree Planner</div>

      <div className="main-layout">

        <Sidebar
          courses={courses}
          setCourses={setCourses}
          masterCatalog={MASTER_CATALOG}
          completedCourses={completedCourses}
          setCompletedCourses={setCompletedCourses}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
        />

        <div className="content">

          {/* PROGRESS */}
          <div className="card" style={{ marginBottom: "12px" }}>
            <div style={{ fontWeight: "700" }}>🎓 Graduation Progress</div>
            <div style={{ marginTop: "6px" }}>
            Completed: {completedCredits} / {totalRequiredCredits} | Planned: {plannedCredits} | Remaining: {remainingCredits}

            </div>
            <div style={{ marginTop: "6px", height: "12px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${progressPercent}%`, height: "100%", background: "linear-gradient(90deg,#2563eb,#22c55e)" }} />
            </div>
          </div>

          {/* CONTROLS */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <button
              className="btn btn-success"
              onClick={() => {
                const newPlan = scheduleCourses(activeCourses, maxPerSemester);

                const newConf = {};
                newPlan.forEach((sem, i) => {
                  newConf[i] = detectConflicts(sem, courses);
                });

                setPlan(newPlan);
                setConflicts(newConf);
              }}
            >
              Generate Plan
            </button>

            <input
              type="number"
              min="1"
              max="8"
              value={maxPerSemester}
              onChange={e => setMaxPerSemester(Number(e.target.value))}
              style={{ width: "80px" }}
            />
          </div>

          {plan.length === 0 && (
            <div className="card">
              <h2>Welcome 👋</h2>
              <p>Select completed courses on the left and generate your plan.</p>
            </div>
          )}

          <PlannerBoard plan={plan} conflicts={conflicts} />

        </div>

        <div className="details-panel">
          <CourseDetails
            selectedCourse={selectedCourse}
            courses={courses}
            onDelete={() => {
              if (!selectedCourse) return;

              const copy = { ...courses };
              delete copy[selectedCourse];

              Object.values(copy).forEach(c => {
                c.prereq = c.prereq.filter(p => p !== selectedCourse);
              });

              setCourses(copy);
              setSelectedCourse(null);
              setPlan([]);
              setConflicts({});
            }}
          />
        </div>

      </div>
    </div>
  );
}
