import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import PlateItem from "./PlateItem.jsx";
import { Logger } from "../utils/logger.js";

// Stable helper: reorder items after drag
function reorder(list, startIndex, endIndex) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

/**
 * PlateListDnd
 * Draggable list of plates.
 * - Purely presentational; state lives in parent.
 * - Emits onReorder(nextList), onCommit(id, next), onRemove(id).
 */
export default function PlateListDnd({ plates, onReorder, onCommit, onRemove, unit }) {
  function onDragEnd(result) {
    const { destination, source } = result || {};
    if (!destination) return;
    if (destination.index === source.index) return;
    try {
      const next = reorder(plates, source.index, destination.index);
      onReorder(next);
    } catch (err) {
      Logger.error("PlateListDnd: onDragEnd failed", err);
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="plates-droppable">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {plates.map((p, idx) => (
              <Draggable draggableId={p.id} index={idx} key={p.id}>
                {(draggableProvided, snapshot) => (
                  <div
                    ref={draggableProvided.innerRef}
                    {...draggableProvided.draggableProps}
                    style={{
                      ...draggableProvided.draggableProps.style,
                      opacity: snapshot.isDragging ? 0.9 : 1,
                    }}
                  >
                    <PlateItem
                      index={idx}
                      plate={p}
                      unit={unit}
                      onCommit={(next) => onCommit(p.id, next)}
                      onRemove={() => onRemove(p.id)}
                      canRemove={plates.length > 1}
                      dragHandleProps={draggableProvided.dragHandleProps}
                      isLast={idx === plates.length - 1}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
