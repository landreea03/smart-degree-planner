import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { categoryColor } from "../utils/categoryColor";

function CourseChip({ code, index, catalog, isConflict, isBlocked, wrap }) {
  const course = catalog[code];
  const color = categoryColor(course?.category);

  return (
    <Draggable draggableId={code} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="course-chip"
          style={{
            "--chip-accent": isConflict ? "var(--danger)" : isBlocked ? "var(--warning)" : color.accent,
            background: isConflict ? "var(--danger-soft)" : "var(--surface)",
            borderLeftStyle: isBlocked ? "dashed" : "solid",
            boxShadow: snapshot.isDragging ? "var(--shadow-lg)" : undefined,
            cursor: "grab",
            width: wrap ? "156px" : "auto",
            marginBottom: wrap ? 0 : undefined,
            ...provided.draggableProps.style,
          }}
          title={course ? `${course.name} (${course.credits} cr)` : code}
        >
          <div style={{ fontSize: "13px" }}>{code}</div>
          {course && <div className="muted" style={{ fontSize: "11px", fontWeight: 500 }}>{course.credits} cr</div>}
          {isBlocked && <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--warning)", marginTop: "2px" }}>⚠ prereq not yet met</div>}
        </div>
      )}
    </Draggable>
  );
}

function Column({ droppableId, title, courses, catalog, conflictSet, blockedSet, onRemove, headerRight, wrap }) {
  return (
    <div className="card semester-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ fontWeight: 700, fontSize: "13.5px" }}>{title}</div>
        {headerRight}
        {onRemove && (
          <button
            className="btn btn-icon"
            style={{ width: "24px", height: "24px", fontSize: "11px" }}
            onClick={onRemove}
            title="Remove empty semester"
          >
            ✕
          </button>
        )}
      </div>

      {conflictSet?.size > 0 && (
        <div
          style={{
            background: "var(--danger-soft)",
            color: "var(--danger)",
            padding: "8px",
            borderRadius: "var(--radius-sm)",
            fontSize: "12px",
            marginBottom: "8px",
            fontWeight: 600,
          }}
        >
          ⚠️ Time conflict detected in this semester
        </div>
      )}

      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              minHeight: "56px",
              borderRadius: "var(--radius-sm)",
              background: snapshot.isDraggingOver ? "var(--accent-soft)" : "transparent",
              transition: "background 0.15s",
              padding: "2px",
              display: wrap ? "flex" : "block",
              flexWrap: wrap ? "wrap" : undefined,
              gap: wrap ? "8px" : undefined,
            }}
          >
            {courses.length === 0 && (
              <div className="muted" style={{ fontSize: "12px", padding: "8px", textAlign: "center" }}>
                Drop courses here
              </div>
            )}
            {courses.map((code, i) => (
              <CourseChip
                key={code}
                code={code}
                index={i}
                catalog={catalog}
                isConflict={conflictSet?.has(code)}
                isBlocked={blockedSet?.has(code)}
                wrap={wrap}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function PlannerBoard({
  unscheduled,
  semesters,
  catalog,
  conflicts,
  blocked,
  onDragEnd,
  onAddSemester,
  onRemoveSemester,
  semesterLabel,
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Column
        droppableId="unscheduled"
        title="🗂 Unscheduled Courses"
        courses={unscheduled}
        catalog={catalog}
        blockedSet={blocked?.unscheduled}
        wrap
      />

      <div className="planner-grid" style={{ marginTop: "16px" }}>
        {semesters.map((sem, i) => (
          <Column
            key={i}
            droppableId={`sem-${i}`}
            title={semesterLabel ? semesterLabel(i) : `Semester ${i + 1}`}
            courses={sem}
            catalog={catalog}
            conflictSet={conflicts?.[i]}
            blockedSet={blocked?.[`sem-${i}`]}
            onRemove={sem.length === 0 ? () => onRemoveSemester(i) : undefined}
          />
        ))}

        <button
          className="btn"
          style={{
            minHeight: "120px",
            border: "1.5px dashed var(--border-strong)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontWeight: 700,
          }}
          onClick={onAddSemester}
        >
          ➕ Add Semester
        </button>
      </div>
    </DragDropContext>
  );
}
