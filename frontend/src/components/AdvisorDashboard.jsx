import { useEffect, useState } from "react";
import api from "../api";
import { categoryColor } from "../utils/categoryColor";

const STATUS_LABEL = { none: "No status", approved: "Approved", flagged: "Flagged" };
const STATUS_COLOR = { none: "var(--text-tertiary)", approved: "var(--success)", flagged: "var(--danger)" };

function StatCard({ label, value }) {
  return (
    <div className="card" style={{ flex: "1 1 160px" }}>
      <div className="muted" style={{ fontSize: "12px", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: 800 }}>{value ?? "—"}</div>
    </div>
  );
}

function RankedList({ title, items, emptyText }) {
  const max = items.reduce((m, i) => Math.max(m, i.count), 0) || 1;
  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: "10px" }}>{title}</div>
      {items.length === 0 ? (
        <div className="muted" style={{ fontSize: "13px" }}>{emptyText}</div>
      ) : (
        items.map((i) => (
          <div key={i.code} style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "3px" }}>
              <span style={{ fontWeight: 600 }}>{i.code}</span>
              <span className="muted">{i.count}</span>
            </div>
            <div style={{ height: "6px", background: "var(--surface-2)", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${(i.count / max) * 100}%`, height: "100%", background: "var(--accent)" }} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function AnalyticsView() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getAdvisorAnalytics().then(setAnalytics).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="card" style={{ color: "var(--danger)" }}>Couldn't load analytics: {error}</div>;
  if (!analytics) return <div className="card">Loading analytics…</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        <StatCard label="Total saved plans" value={analytics.totalPlans} />
        <StatCard label="Total students" value={analytics.totalStudents} />
        <StatCard label="Avg. semesters to graduate" value={analytics.avgSemestersToGraduate ?? "—"} />
        <StatCard label="Flagged plans" value={analytics.plansByStatus.flagged} />
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ flex: "1 1 280px" }}>
          <RankedList
            title="📈 Most common courses across all plans"
            items={analytics.mostCommonCourses}
            emptyText="No plans saved yet."
          />
        </div>
        <div style={{ flex: "1 1 280px" }}>
          <RankedList
            title="⚠️ At-risk courses (D/F grades on record)"
            items={analytics.atRiskCourses}
            emptyText="No at-risk grades on record."
          />
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: "10px" }}>Plans by program</div>
        {analytics.plansByProgram.length === 0 ? (
          <div className="muted" style={{ fontSize: "13px" }}>No plans saved yet.</div>
        ) : (
          analytics.plansByProgram.map((p) => (
            <div key={p.program} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0" }}>
              <span>{p.program}</span>
              <span className="muted">{p.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PlanDetail({ planId, onBack, onStatusChanged }) {
  const [plan, setPlan] = useState(null);
  const [catalog, setCatalog] = useState({});
  const [error, setError] = useState(null);
  const [noteBody, setNoteBody] = useState("");
  const [noteCourse, setNoteCourse] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const load = () => {
    api
      .getAdvisorPlan(planId)
      .then((p) => {
        setPlan(p);
        return api.getProgramCatalog(p.programId);
      })
      .then(({ catalog: c }) => setCatalog(c))
      .catch((err) => setError(err.message));
  };

  useEffect(load, [planId]);

  const handleAddNote = async () => {
    if (!noteBody.trim()) return;
    setSavingNote(true);
    try {
      await api.addPlanNote(planId, { body: noteBody.trim(), courseCode: noteCourse || undefined });
      setNoteBody("");
      setNoteCourse("");
      load();
    } catch (err) {
      alert(`Couldn't add note: ${err.message}`);
    } finally {
      setSavingNote(false);
    }
  };

  const handleSetStatus = async (status) => {
    setSavingStatus(true);
    try {
      await api.setPlanStatus(planId, status);
      load();
      onStatusChanged?.();
    } catch (err) {
      alert(`Couldn't update status: ${err.message}`);
    } finally {
      setSavingStatus(false);
    }
  };

  if (error) return <div className="card" style={{ color: "var(--danger)" }}>Couldn't load plan: {error}</div>;
  if (!plan) return <div className="card">Loading plan…</div>;

  return (
    <div>
      <button type="button" className="btn btn-ghost" style={{ marginBottom: "12px" }} onClick={onBack}>
        ← Back to students
      </button>

      <div className="card" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px" }}>{plan.name}</div>
            <div className="muted" style={{ fontSize: "13px" }}>
              {plan.ownerName || plan.ownerEmail} &nbsp;·&nbsp; {plan.programName}
            </div>
          </div>
          <span className="badge" style={{ background: "var(--surface-2)", color: STATUS_COLOR[plan.advisorStatus] }}>
            <span className="badge-dot" style={{ background: STATUS_COLOR[plan.advisorStatus] }} />
            {STATUS_LABEL[plan.advisorStatus]}
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button type="button" className="btn" disabled={savingStatus} onClick={() => handleSetStatus("approved")}>
            ✅ Approve
          </button>
          <button type="button" className="btn btn-danger-soft" disabled={savingStatus} onClick={() => handleSetStatus("flagged")}>
            🚩 Flag
          </button>
          <button type="button" className="btn btn-ghost" disabled={savingStatus} onClick={() => handleSetStatus("none")}>
            Clear status
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "16px" }}>
        <div style={{ fontWeight: 700, marginBottom: "10px" }}>Semesters</div>
        {plan.semesters.length === 0 ? (
          <div className="muted" style={{ fontSize: "13px" }}>No semesters scheduled yet.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {plan.semesters.map((sem, i) => (
              <div key={i} style={{ minWidth: "180px", flex: "1 1 180px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "8px 10px" }}>
                <div style={{ fontWeight: 700, fontSize: "12.5px", marginBottom: "6px" }}>Semester {i + 1}</div>
                {sem.length === 0 && <div className="muted" style={{ fontSize: "12px" }}>Empty</div>}
                {sem.map((code) => {
                  const course = catalog[code];
                  const color = categoryColor(course?.category);
                  return (
                    <div key={code} style={{ fontSize: "12px", padding: "3px 0", borderLeft: `3px solid ${color.accent}`, paddingLeft: "6px", marginBottom: "3px" }}>
                      <b>{code}</b> {course?.name ? `— ${course.name}` : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: "10px" }}>Advisor notes</div>

        {plan.notes.length === 0 && <div className="muted" style={{ fontSize: "13px", marginBottom: "10px" }}>No notes yet.</div>}

        {plan.notes.map((n) => (
          <div key={n.id} style={{ padding: "8px 10px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", marginBottom: "6px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700 }}>
              {n.authorName} {n.courseCode && <span className="muted" style={{ fontWeight: 500 }}>· {n.courseCode}</span>}
            </div>
            <div style={{ fontSize: "13px", marginTop: "2px" }}>{n.body}</div>
            <div className="muted" style={{ fontSize: "11px", marginTop: "3px" }}>{new Date(n.createdAt).toLocaleString()}</div>
          </div>
        ))}

        <div style={{ marginTop: "10px" }}>
          <select className="input" value={noteCourse} onChange={(e) => setNoteCourse(e.target.value)}>
            <option value="">General note (no specific course)</option>
            {plan.semesters.flat().map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <textarea
            className="input"
            placeholder="Leave a note for this student…"
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
          />
          <button type="button" className="btn btn-primary" disabled={savingNote || !noteBody.trim()} onClick={handleAddNote}>
            💬 Add note
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentsView({ selectedStudentId, setSelectedStudentId, selectedPlanId, setSelectedPlanId }) {
  const [students, setStudents] = useState([]);
  const [studentPlans, setStudentPlans] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getStudents().then(setStudents).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStudentPlans(null);
      return;
    }
    api.getStudentPlans(selectedStudentId).then(setStudentPlans).catch((err) => setError(err.message));
  }, [selectedStudentId]);

  if (error) return <div className="card" style={{ color: "var(--danger)" }}>Couldn't load: {error}</div>;

  if (selectedPlanId) {
    return (
      <PlanDetail
        planId={selectedPlanId}
        onBack={() => setSelectedPlanId(null)}
        onStatusChanged={() => api.getStudentPlans(selectedStudentId).then(setStudentPlans)}
      />
    );
  }

  if (selectedStudentId && studentPlans) {
    return (
      <div>
        <button type="button" className="btn btn-ghost" style={{ marginBottom: "12px" }} onClick={() => setSelectedStudentId(null)}>
          ← Back to all students
        </button>
        <div className="card" style={{ marginBottom: "12px" }}>
          <div style={{ fontWeight: 700 }}>{studentPlans.student.name || studentPlans.student.email}</div>
          <div className="muted" style={{ fontSize: "13px" }}>{studentPlans.student.email}</div>
        </div>

        {studentPlans.plans.length === 0 ? (
          <div className="card muted">This student hasn't saved any plans yet.</div>
        ) : (
          studentPlans.plans.map((p) => (
            <div
              key={p.id}
              className="card"
              style={{ marginBottom: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onClick={() => setSelectedPlanId(p.id)}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "13.5px" }}>{p.name}</div>
                <div className="muted" style={{ fontSize: "12px" }}>{p.programName} · updated {new Date(p.updatedAt).toLocaleDateString()}</div>
              </div>
              <span className="badge" style={{ background: "var(--surface-2)", color: STATUS_COLOR[p.advisorStatus] }}>
                <span className="badge-dot" style={{ background: STATUS_COLOR[p.advisorStatus] }} />
                {STATUS_LABEL[p.advisorStatus]}
              </span>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div>
      {students.length === 0 ? (
        <div className="card muted">No students yet.</div>
      ) : (
        students.map((s) => (
          <div
            key={s.id}
            className="card"
            style={{ marginBottom: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            onClick={() => setSelectedStudentId(s.id)}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: "13.5px" }}>{s.name || s.email}</div>
              <div className="muted" style={{ fontSize: "12px" }}>{s.email}</div>
            </div>
            <span className="muted" style={{ fontSize: "12.5px" }}>{s.planCount} plan{s.planCount === 1 ? "" : "s"}</span>
          </div>
        ))
      )}
    </div>
  );
}

export default function AdvisorDashboard() {
  const [tab, setTab] = useState("students");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  return (
    <div>
      <div className="tabs" style={{ marginBottom: "12px" }}>
        <button className={`tab-btn ${tab === "students" ? "active" : ""}`} onClick={() => setTab("students")}>
          🧑‍🎓 Students
        </button>
        <button className={`tab-btn ${tab === "analytics" ? "active" : ""}`} onClick={() => setTab("analytics")}>
          📊 Analytics
        </button>
      </div>

      {tab === "students" ? (
        <StudentsView
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}
          selectedPlanId={selectedPlanId}
          setSelectedPlanId={setSelectedPlanId}
        />
      ) : (
        <AnalyticsView />
      )}
    </div>
  );
}
