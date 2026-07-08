export default function ProgramSelector({ programs, selectedProgramId, onSelect }) {
  if (!programs || programs.length === 0) return null;

  return (
    <div className="card program-selector">
      <div className="section-title" style={{ margin: 0 }}>Degree Program</div>
      <select
        className="input"
        style={{ marginTop: "8px", marginBottom: 0, fontWeight: 700 }}
        value={selectedProgramId || ""}
        onChange={(e) => onSelect(Number(e.target.value))}
      >
        {programs.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {programs.find((p) => p.id === selectedProgramId)?.description && (
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
          {programs.find((p) => p.id === selectedProgramId).description}
        </div>
      )}
    </div>
  );
}
