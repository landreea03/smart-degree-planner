import { useState } from "react";

export default function SavedPlans({ plans, activePlanId, onSave, onLoad, onDelete, saving }) {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    setName("");
  };

  return (
    <div className="card" style={{ marginBottom: "12px" }}>
      <div style={{ fontWeight: 700, marginBottom: "8px" }}>💾 Saved Plans</div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input
          className="input"
          style={{ marginBottom: 0 }}
          placeholder="Plan name (e.g. Fall 2026 draft)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>
          Save
        </button>
      </div>

      {plans.length === 0 && (
        <div className="muted" style={{ fontSize: "13px" }}>No saved plans for this program yet.</div>
      )}

      {plans.map((p) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 10px",
            borderRadius: "10px",
            marginBottom: "6px",
            background: p.id === activePlanId ? "var(--accent-soft)" : "var(--surface-2)",
            border: p.id === activePlanId ? "1px solid var(--accent-soft-strong)" : "1px solid transparent",
          }}
        >
          <div style={{ cursor: "pointer", flex: 1 }} onClick={() => onLoad(p.id)}>
            <div style={{ fontWeight: 600, fontSize: "13px" }}>{p.name}</div>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
              updated {new Date(p.updatedAt).toLocaleString()}
            </div>
          </div>
          <button
            className="btn btn-danger-soft"
            style={{ padding: "6px 10px", fontSize: "12px" }}
            onClick={() => onDelete(p.id)}
          >
            🗑
          </button>
        </div>
      ))}
    </div>
  );
}
