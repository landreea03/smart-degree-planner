import { useMemo, useState } from "react";

const TERM_ORDER = { Fall: 0, Spring: 1, Summer: 2 };

const CATEGORY_COLOR = {
  Major: { fill: "#dbeafe", stroke: "#2563eb" },
  "Math & Science": { fill: "#ede9fe", stroke: "#7c3aed" },
  "Gen Ed": { fill: "#fef9c3", stroke: "#ca8a04" },
  Elective: { fill: "#dcfce7", stroke: "#16a34a" },
};

const NODE_W = 168;
const NODE_H = 60;
const COL_GAP = 64;
const ROW_GAP = 18;
const COL_HEADER_H = 40;
const PADDING = 24;

export default function CourseMap({ catalog }) {
  const [activeCode, setActiveCode] = useState(null);

  const { columns, positions, width, height, edges } = useMemo(() => {
    const codes = Object.keys(catalog);

    // Distinct (year, term) slots actually used, sorted chronologically.
    const slotSet = new Map();
    codes.forEach((code) => {
      const c = catalog[code];
      const year = c.yearLevel || 1;
      const term = c.term || "Fall";
      const key = `${year}-${term}`;
      if (!slotSet.has(key)) slotSet.set(key, { year, term });
    });
    const slots = [...slotSet.values()].sort(
      (a, b) => a.year - b.year || (TERM_ORDER[a.term] ?? 0) - (TERM_ORDER[b.term] ?? 0)
    );
    const slotIndex = new Map(slots.map((s, i) => [`${s.year}-${s.term}`, i]));

    // Group codes into columns, sorted alphabetically within a column for determinism.
    const columnCodes = slots.map(() => []);
    codes
      .sort()
      .forEach((code) => {
        const c = catalog[code];
        const key = `${c.yearLevel || 1}-${c.term || "Fall"}`;
        columnCodes[slotIndex.get(key)].push(code);
      });

    const positions = {};
    columnCodes.forEach((colCodes, colIdx) => {
      colCodes.forEach((code, rowIdx) => {
        positions[code] = {
          x: PADDING + colIdx * (NODE_W + COL_GAP),
          y: PADDING + COL_HEADER_H + rowIdx * (NODE_H + ROW_GAP),
        };
      });
    });

    const maxRows = Math.max(1, ...columnCodes.map((c) => c.length));
    const width = PADDING * 2 + slots.length * NODE_W + (slots.length - 1) * COL_GAP;
    const height = PADDING * 2 + COL_HEADER_H + maxRows * (NODE_H + ROW_GAP);

    const edges = [];
    codes.forEach((code) => {
      const c = catalog[code];
      (c.prereq || []).forEach((p) => {
        if (positions[p] && positions[code]) edges.push({ from: p, to: code });
      });
    });

    return { columns: slots, positions, width, height, edges };
  }, [catalog]);

  if (Object.keys(catalog).length === 0) {
    return <div className="card">No courses to map yet.</div>;
  }

  const isHighlighted = (code) =>
    activeCode &&
    (code === activeCode ||
      edges.some((e) => e.from === activeCode && e.to === code) ||
      edges.some((e) => e.to === activeCode && e.from === code));

  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: "14px", marginBottom: "10px", flexWrap: "wrap", fontSize: "12px" }}>
        {Object.entries(CATEGORY_COLOR).map(([cat, col]) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: col.fill, border: `1px solid ${col.stroke}`, display: "inline-block" }} />
            {cat}
          </div>
        ))}
        <div style={{ color: "#94a3b8" }}>Click a course to trace its prerequisite chain.</div>
      </div>

      <svg width={width} height={height} style={{ display: "block" }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
          </marker>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
          </marker>
        </defs>

        {columns.map((slot, i) => (
          <text
            key={`${slot.year}-${slot.term}`}
            x={PADDING + i * (NODE_W + COL_GAP) + NODE_W / 2}
            y={PADDING + 16}
            textAnchor="middle"
            fontSize="12"
            fontWeight="800"
            fill="#475569"
          >
            Year {slot.year} · {slot.term}
          </text>
        ))}

        {edges.map((e, i) => {
          const from = positions[e.from];
          const to = positions[e.to];
          const x1 = from.x + NODE_W;
          const y1 = from.y + NODE_H / 2;
          const x2 = to.x;
          const y2 = to.y + NODE_H / 2;
          const midX = (x1 + x2) / 2;
          const active = activeCode && (e.from === activeCode || e.to === activeCode);
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke={active ? "#2563eb" : "#cbd5e1"}
              strokeWidth={active ? 2.5 : 1.5}
              markerEnd={active ? "url(#arrow-active)" : "url(#arrow)"}
              opacity={activeCode && !active ? 0.25 : 1}
            />
          );
        })}

        {Object.entries(positions).map(([code, pos]) => {
          const c = catalog[code];
          const color = CATEGORY_COLOR[c.category] || CATEGORY_COLOR.Elective;
          const highlighted = isHighlighted(code);
          const dimmed = activeCode && !highlighted;
          return (
            <g
              key={code}
              transform={`translate(${pos.x}, ${pos.y})`}
              style={{ cursor: "pointer" }}
              opacity={dimmed ? 0.35 : 1}
              onClick={() => setActiveCode(activeCode === code ? null : code)}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                rx="10"
                fill={color.fill}
                stroke={code === activeCode ? "#1d4ed8" : color.stroke}
                strokeWidth={code === activeCode ? 3 : 1.5}
              />
              <text x="10" y="22" fontSize="12" fontWeight="800" fill="#0f172a">{code}</text>
              <text x="10" y="38" fontSize="10.5" fill="#334155">
                {c.name.length > 22 ? `${c.name.slice(0, 21)}…` : c.name}
              </text>
              <text x="10" y="52" fontSize="10" fill="#64748b">{c.credits} cr</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
