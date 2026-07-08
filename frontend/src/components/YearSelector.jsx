import { YEAR_LEVELS } from "../utils/scheduler";

export default function YearSelector({ startYear, onChangeStartYear, includeSummer, onToggleSummer }) {
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div className="section-title" style={{ margin: 0 }}>What year are you?</div>

      <select
        className="input"
        style={{ marginTop: "8px", marginBottom: "8px", fontWeight: 700 }}
        value={startYear}
        onChange={(e) => onChangeStartYear(Number(e.target.value))}
      >
        {YEAR_LEVELS.map((y) => (
          <option key={y.level} value={y.level}>{y.label}</option>
        ))}
      </select>

      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "8px" }}>
        Marks earlier-year courses as completed and starts your plan from here.
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
        <input type="checkbox" checked={includeSummer} onChange={(e) => onToggleSummer(e.target.checked)} />
        Include summer terms
      </label>
    </div>
  );
}
