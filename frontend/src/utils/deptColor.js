// Deterministic pastel color per course department prefix (e.g. "CS", "BUS"),
// so any degree program's catalog gets consistent, readable chip colors
// without having to hand-enumerate department codes in CSS.
const PALETTE = [
  { bg: "linear-gradient(135deg, #dbeafe, #bfdbfe)", border: "#2563eb" }, // blue
  { bg: "linear-gradient(135deg, #dcfce7, #bbf7d0)", border: "#16a34a" }, // green
  { bg: "linear-gradient(135deg, #ede9fe, #ddd6fe)", border: "#7c3aed" }, // purple
  { bg: "linear-gradient(135deg, #fef9c3, #fef08a)", border: "#ca8a04" }, // yellow
  { bg: "linear-gradient(135deg, #fee2e2, #fecaca)", border: "#dc2626" }, // red
  { bg: "linear-gradient(135deg, #cffafe, #a5f3fc)", border: "#0891b2" }, // cyan
  { bg: "linear-gradient(135deg, #fce7f3, #fbcfe8)", border: "#db2777" }, // pink
  { bg: "linear-gradient(135deg, #ffedd5, #fed7aa)", border: "#ea580c" }, // orange
];

export function deptOf(code) {
  return code.split(/[0-9]/)[0];
}

export function deptColor(code) {
  const dept = deptOf(code);
  let hash = 0;
  for (let i = 0; i < dept.length; i++) hash = (hash * 31 + dept.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
