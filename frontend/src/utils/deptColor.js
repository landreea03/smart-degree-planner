// Superseded by utils/categoryColor.js — course chips are now colored by
// requirement category (Major/Math & Science/Gen Ed/Elective/Minor) rather
// than by department prefix, so the same color means the same thing across
// the planner, the GPA panel, and the Course Map. Kept as a thin compat
// export (rather than deleted) in case anything still imports `deptOf`.
export function deptOf(code) {
  return code.split(/[0-9]/)[0];
}

export { categoryColor as deptColor } from "./categoryColor";
