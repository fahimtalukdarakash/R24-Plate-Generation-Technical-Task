import React, { useMemo } from "react";

/**
 * PlatesSummary
 * Read-only card that displays the total width of all plates.
 * - Shows value in the current unit (cm | in)
 * - Also shows the converted value in the other unit for convenience
 */
export default function PlatesSummary({ totalWidthCm, unit }) {
  const CM_PER_IN = 2.54;

  // Compute display values once per change
  const { inCm, inInches, mainValue, mainUnit, subValue, subUnit } = useMemo(() => {
    const cm = Number(totalWidthCm) || 0;
    const inches = cm / CM_PER_IN;

    // round helper
    const round2 = (n) => Math.round(n * 100) / 100;

    if (unit === "in") {
      return {
        inCm: round2(cm),
        inInches: round2(inches),
        mainValue: round2(inches),
        mainUnit: "in",
        subValue: round2(cm),
        subUnit: "cm",
      };
    }
    // default: cm
    return {
      inCm: round2(cm),
      inInches: round2(inches),
      mainValue: round2(cm),
      mainUnit: "cm",
      subValue: round2(inches),
      subUnit: "in",
    };
  }, [totalWidthCm, unit]);

  return (
    <div className="card border-0 mt-3">
      <div className="card-body">
        <div className="d-flex align-items-baseline justify-content-between">
          <span className="text-muted">Gesamtbreite</span>
          <strong className="h5 mb-0">
            {mainValue} {mainUnit}
          </strong>
        </div>
        <small className="text-muted">
          ({subValue} {subUnit})
        </small>
      </div>
    </div>
  );
}
