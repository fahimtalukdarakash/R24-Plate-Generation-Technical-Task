import React, { useEffect, useState } from "react";
import { WIDTH_MIN, WIDTH_MAX, HEIGHT_MIN, HEIGHT_MAX } from "../constants/limits.js";
import { parseLocaleNumber, formatNumber } from "../utils/number.js";
import { Logger } from "../utils/logger.js";
import './PlateItem.css';

const CM_PER_IN = 2.54;

// Convert cm -> current unit (cm|in)
const cmToUnit = (cm, unit) =>
  unit === "in" ? parseFloat((cm / CM_PER_IN).toFixed(2)) : parseFloat(cm.toFixed(2));

// Convert current unit -> cm
const unitToCm = (val, unit) =>
  unit === "in" ? parseFloat((val * CM_PER_IN).toFixed(2)) : parseFloat(val.toFixed(2));

// Build a display range in the chosen unit
function formatRange(minCm, maxCm, unit) {
  const toUnit = (cm) => (unit === "in" ? (cm / CM_PER_IN).toFixed(2) : cm);
  return `${toUnit(minCm)}–${toUnit(maxCm)} ${unit}`;
}

/**
 * PlateItem
 * Single list row for entering width/height for a plate.
 * - Keeps string inputs locally, commits validated numbers on blur.
 * - Shows helpful ranges & mm hints and light inline errors.
 */
export default function PlateItem({
  index,
  plate,
  unit,                 // "cm" | "in" (global toggle)
  onCommit,             // fn(nextPlate)
  onRemove,             // fn()
  canRemove,
  dragHandleProps = {},
  isLast,
}) {
  const [wInput, setWInput] = useState(formatNumber(cmToUnit(plate.widthCm, unit)));
  const [hInput, setHInput] = useState(formatNumber(cmToUnit(plate.heightCm, unit)));

  const [wErr, setWErr] = useState("");
  const [hErr, setHErr] = useState("");

  // Refresh inputs when backing cm values or unit change
  useEffect(() => {
    setWInput(formatNumber(cmToUnit(plate.widthCm, unit)));
    setWErr("");
  }, [plate.widthCm, unit]);

  useEffect(() => {
    setHInput(formatNumber(cmToUnit(plate.heightCm, unit)));
    setHErr("");
  }, [plate.heightCm, unit]);

  function commitWidth() {
    const nUnit = parseLocaleNumber(wInput);
    if (!Number.isFinite(nUnit)) {
      setWErr("Bitte Zahl eingeben.");
      setWInput(formatNumber(cmToUnit(plate.widthCm, unit)));
      Logger.warn("PlateItem: non-numeric width", { wInput });
      return;
    }
    const nCm = unitToCm(nUnit, unit);
    if (nCm < WIDTH_MIN || nCm > WIDTH_MAX) {
      setWErr(`Erlaubt ${formatRange(WIDTH_MIN, WIDTH_MAX, unit)}`);
      setWInput(formatNumber(cmToUnit(plate.widthCm, unit)));
      Logger.warn("PlateItem: width out of range", { nCm, unit });
      return;
    }
    setWErr("");
    onCommit({ ...plate, widthCm: nCm });
  }

  function commitHeight() {
    const nUnit = parseLocaleNumber(hInput);
    if (!Number.isFinite(nUnit)) {
      setHErr("Bitte Zahl eingeben.");
      setHInput(formatNumber(cmToUnit(plate.heightCm, unit)));
      Logger.warn("PlateItem: non-numeric height", { hInput });
      return;
    }
    const nCm = unitToCm(nUnit, unit);
    if (nCm < HEIGHT_MIN || nCm > HEIGHT_MAX) {
      setHErr(`Erlaubt ${formatRange(HEIGHT_MIN, HEIGHT_MAX, unit)}`);
      setHInput(formatNumber(cmToUnit(plate.heightCm, unit)));
      Logger.warn("PlateItem: height out of range", { nCm, unit });
      return;
    }
    setHErr("");
    onCommit({ ...plate, heightCm: nCm });
  }

  const widthMm  = Math.round((plate.widthCm ?? 0) * 10);
  const heightMm = Math.round((plate.heightCm ?? 0) * 10);

  return (
    <div className="plate-row plate-row--corners">
      {/* Drag handle / index */}
      <span
        className={`plate-corner-badge plate-index ${isLast ? "plate-index-dark" : ""}`}
        {...dragHandleProps}
        title="Ziehen zum Neuordnen"
      >
        {index + 1}
      </span>

      {/* Inline width × height inputs */}
      <div className="plate-inline-inputs">
        {/* WIDTH */}
        <div className="plate-field">
          <div className="field-head">
            <span className="plate-label">Breite</span>
            <span className="plate-range">{formatRange(WIDTH_MIN, WIDTH_MAX, unit)}</span>
          </div>

          <div className={`input-wrap input-wrap--underline ${wErr ? "error" : ""}`}>
            <input
              type="text"
              value={wInput}
              onChange={(e) => setWInput(e.target.value)}
              onBlur={commitWidth}
              aria-invalid={!!wErr}
              placeholder={unit === "cm" ? "250" : "98.43"}
            />
            <span className="unit">{unit}</span>
          </div>
          {wErr ? (
            <div className="error-text">{wErr}</div>
          ) : (
            <div className="mm-hint">{widthMm} mm</div>
          )}
        </div>

        <span className="times">×</span>

        {/* HEIGHT */}
        <div className="plate-field">
          <div className="field-head">
            <span className="plate-label">Höhe</span>
            <span className="plate-range">{formatRange(HEIGHT_MIN, HEIGHT_MAX, unit)}</span>
          </div>

          <div className={`input-wrap input-wrap--underline ${hErr ? "error" : ""}`}>
            <input
              type="text"
              value={hInput}
              onChange={(e) => setHInput(e.target.value)}
              onBlur={commitHeight}
              aria-invalid={!!hErr}
              placeholder={unit === "cm" ? "128" : "50.39"}
            />
            <span className="unit">{unit}</span>
          </div>
          {hErr ? (
            <div className="error-text">{hErr}</div>
          ) : (
            <div className="mm-hint">{heightMm} mm</div>
          )}
        </div>
      </div>

      {/* Remove plate */}
      <button
        className={`btn-remove btn-remove-fab ${!canRemove ? "disabled" : ""}`}
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Rückwand entfernen"
      >
        –
      </button>
    </div>
  );
}
