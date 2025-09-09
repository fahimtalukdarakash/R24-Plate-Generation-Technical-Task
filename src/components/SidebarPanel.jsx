import React from 'react';
import PlateListDnd from './PlateListDnd.jsx';
import PlatesSummary from './PlatesSummary.jsx';

/**
 * SidebarPanel
 * - Right column: unit toggle + plates list with DnD + add/remove controls
 * - Read-only summary card showing total width
 * - Stateless container — all state lives in App
 */
export default function SidebarPanel({
  unit,
  setUnit,
  plates,
  onReorder,
  onCommit,
  onRemove,
  onAdd,
  canAdd,
  totalWidthCm, // <-- NEW
}) {
  return (
    <div className="right-panel">
      {/* Header with global unit toggle */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <p className="h4 mb-0">
          <strong>Maße. </strong>Eingeben.
        </p>
        <div className="btn-group btn-group-sm" role="group" aria-label="Einheiten">
          <button
            type="button"
            className={`btn ${unit === 'cm' ? 'btn-dark' : 'btn-outline-dark'}`}
            onClick={() => setUnit('cm')}
          >
            cm
          </button>
          <button
            type="button"
            className={`btn ${unit === 'in' ? 'btn-dark' : 'btn-outline-dark'}`}
            onClick={() => setUnit('in')}
          >
            in
          </button>
        </div>
      </div>

      {/* Scrollable list area on desktop (normal flow on mobile/tablet) */}
      <div className="plate-list-scroll">
        <PlateListDnd
          plates={plates}
          onReorder={onReorder}
          onCommit={(id, next) => onCommit(id, next)}
          onRemove={(id) => onRemove(id)}
          unit={unit}
        />

        <div className="btn-side">
          <button className="btn-green" onClick={onAdd} disabled={!canAdd}>
            Rückwand hinzufügen +
          </button>
        </div>
        {!canAdd && (
          <small className="text-muted d-block text-end">
            Maximal 10 Rückwände. Entferne eine, um eine neue hinzuzufügen.
          </small>
        )}

        {/* Read-only total width summary */}
        <PlatesSummary totalWidthCm={totalWidthCm} unit={unit} />
      </div>
    </div>
  );
}
