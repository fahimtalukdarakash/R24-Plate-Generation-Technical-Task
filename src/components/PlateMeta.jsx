import React, { useMemo } from "react";

const CM_PER_IN = 2.54;

/**
 * PlateMeta
 * Read-only details for a single plate.
 * - Shows width/height in the selected unit and the converted unit in parentheses.
 * - Keeps original props (storageKey, onReset) for backward compatibility.
 */
export default function PlateMeta({ plate, storageKey, onReset, unit = "cm" }) {
  const toDisplay = useMemo(() => {
    const widthCm = Number(plate?.widthCm) || 0;
    const heightCm = Number(plate?.heightCm) || 0;

    const round2 = (n) => Math.round(n * 100) / 100;
    const asIn = (cm) => round2(cm / CM_PER_IN);

    if (unit === "in") {
      return {
        widthMain: asIn(widthCm),
        heightMain: asIn(heightCm),
        mainUnit: "in",
        widthSub: round2(widthCm),
        heightSub: round2(heightCm),
        subUnit: "cm",
      };
    }
    return {
      widthMain: round2(widthCm),
      heightMain: round2(heightCm),
      mainUnit: "cm",
      widthSub: asIn(widthCm),
      heightSub: asIn(heightCm),
      subUnit: "in",
    };
  }, [plate, unit]);

  return (
    <div>
      <h2 className="h6">Rückwand (Read-only)</h2>
      <dl className="row mb-0">
        <dt className="col-5">Breite</dt>
        <dd className="col-7">
          {toDisplay.widthMain} {toDisplay.mainUnit}{" "}
          <small className="text-muted">
            ({toDisplay.widthSub} {toDisplay.subUnit})
          </small>
        </dd>

        <dt className="col-5">Höhe</dt>
        <dd className="col-7">
          {toDisplay.heightMain} {toDisplay.mainUnit}{" "}
          <small className="text-muted">
            ({toDisplay.heightSub} {toDisplay.subUnit})
          </small>
        </dd>
      </dl>

      {typeof onReset === "function" && (
        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={onReset}>
            Reset to defaults
          </button>
        </div>
      )}

      {storageKey && (
        <>
          <hr />
          <small className="text-muted d-block">
            Persisted key: <code>{storageKey}</code>
          </small>
        </>
      )}
    </div>
  );
}
