export default function MinorSelector({ minors, selectedMinorId, onSelect }) {
  return (
    <div className="card program-selector">
      <div className="section-title" style={{ margin: 0 }}>Minor (optional)</div>
      <select
        className="input"
        style={{ marginTop: "8px", marginBottom: 0, fontWeight: 600 }}
        value={selectedMinorId || ""}
        onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">— None —</option>
        {minors.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      {selectedMinorId && (
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
          {minors.find((m) => m.id === selectedMinorId)?.description}
        </div>
      )}
    </div>
  );
}
