import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { deptColor } from "../utils/deptColor";

function CourseChip({ code, index, catalog, isConflict, isBlocked, wrap }) {
  const course = catalog[code];
  const color = deptColor(code);

  return (
    <Draggable draggableId={code} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="course-chip"
          style={{
            background: isConflict ? "#fee2e2" : color.bg,
            border: isConflict ? "2px solid #dc2626" : isBlocked ? "2px dashed #f59e0b" : `1px solid ${color.border}`,
            boxShadow: snapshot.isDragging ? "0 8px 20px rgba(0,0,0,0.18)" : undefined,
            cursor: "grab",
            width: wrap ? "150px" : "auto",
            marginBottom: wrap ? 0 : undefined,
            ...provided.draggableProps.style,
          }}
          title={course ? `${course.name} (${course.credits} cr)` : code}
        >
          <div>{code}</div>
          {course && <div style={{ fontSize: "11px", fontWeight: 500, opacity: 0.75 }}>{course.credits} cr</div>}
          {isBlocked && <div style={{ fontSize: "10px", fontWeight: 700, color: "#b45309" }}>⚠ prereq not yet met</div>}
        </div>
      )}
    </Draggable>
  );
}

function Column({ droppableId, title, courses, catalog, conflictSet, blockedSet, onRemove, headerRight, wrap }) {
  return (
    <div className="card semester-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        {headerRight}
        {onRemove && (
          <button
            className="btn"
            style={{ padding: "2px 8px", fontSize: "12px", background: "#f1f5f9" }}
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
            background: "#fee2e2",
            color: "#991b1b",
            padding: "8px",
            borderRadius: "8px",
            fontSize: "12px",
            marginBottom: "8px",
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
              borderRadius: "10px",
              background: snapshot.isDraggingOver ? "rgba(37,99,235,0.08)" : "transparent",
              transition: "background 0.15s",
              padding: "2px",
              display: wrap ? "flex" : "block",
              flexWrap: wrap ? "wrap" : undefined,
              gap: wrap ? "8px" : undefined,
            }}
          >
            {courses.length === 0 && (
              <div style={{ fontSize: "12px", color: "#94a3b8", padding: "8px", textAlign: "center" }}>
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
            border: "2px dashed #cbd5e1",
            background: "transparent",
            color: "#64748b",
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
