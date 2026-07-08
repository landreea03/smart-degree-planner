// Requirement-category color tokens, defined in App.css as CSS variables
// (--cat-major, --cat-mathsci, --cat-genEd, --cat-elective, --cat-minor) so
// they repaint automatically with the light/dark theme toggle. This is the
// single source of truth for category color used by the planner chips, the
// GPA/requirement panel, and the Course Map, so the same category always
// reads as the same color everywhere in the app.
export const CATEGORY_COLOR = {
  Major: { accent: "var(--cat-major)", soft: "var(--cat-major-soft)" },
  "Math & Science": { accent: "var(--cat-mathsci)", soft: "var(--cat-mathsci-soft)" },
  "Gen Ed": { accent: "var(--cat-genEd)", soft: "var(--cat-genEd-soft)" },
  Elective: { accent: "var(--cat-elective)", soft: "var(--cat-elective-soft)" },
  Minor: { accent: "var(--cat-minor)", soft: "var(--cat-minor-soft)" },
};

export function categoryColor(category) {
  return CATEGORY_COLOR[category] || CATEGORY_COLOR.Elective;
}
