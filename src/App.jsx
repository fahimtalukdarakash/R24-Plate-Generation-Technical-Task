import React, { useEffect, useMemo, useState } from "react";
import PreviewPanel from "./components/PreviewPanel.jsx";
import SidebarPanel from "./components/SidebarPanel.jsx";
import {
  DEFAULT_PLATE,
  NEW_PLATE,
  DEFAULT_MOTIF_URL,
  STORAGE_KEY,
  STORAGE_KEY_PLATES,
} from "./constants/config.js";
import { Logger } from "./utils/logger.js";
import './App.css';

// --- Local helpers (kept close for clarity) ---
const withId = (p) => ({
  ...p,
  id: crypto.randomUUID(),
  motifUrl: DEFAULT_MOTIF_URL,
});

const ensureMotif = (list) =>
  (Array.isArray(list) ? list : []).map((p) => ({
    ...p,
    motifUrl:
      typeof p?.motifUrl === "string" &&
      (p.motifUrl.startsWith("http") || p.motifUrl.startsWith("data:"))
        ? p.motifUrl
        : DEFAULT_MOTIF_URL,
  }));

export default function App() {
  // Global unit state: "cm" | "in"
  const [unit, setUnit] = useState("cm");

  // Plates state (hydrated from localStorage)
  const [plates, setPlates] = useState(() => {
    try {
      const savedArray = localStorage.getItem(STORAGE_KEY_PLATES);
      if (savedArray) {
        const list = JSON.parse(savedArray);
        if (Array.isArray(list) && list.length) {
          Logger.info("Hydrated plates from STORAGE_KEY_PLATES", {
            count: list.length,
          });
          return ensureMotif(list);
        }
      }
      const single = localStorage.getItem(STORAGE_KEY);
      if (single) {
        const p = JSON.parse(single);
        Logger.warn(
          "Found legacy single plate storage; migrating to plates array"
        );
        return ensureMotif([
          withId({
            widthCm: Number.isFinite(+p?.widthCm)
              ? +p.widthCm
              : DEFAULT_PLATE.widthCm,
            heightCm: Number.isFinite(+p?.heightCm)
              ? +p.heightCm
              : DEFAULT_PLATE.heightCm,
            motifUrl:
              typeof p?.motifUrl === "string" ? p.motifUrl : DEFAULT_MOTIF_URL,
          }),
        ]);
      }
    } catch (err) {
      Logger.error("Failed to hydrate plates from localStorage", err);
    }
    Logger.info("Using default plates");
    return ensureMotif([withId(DEFAULT_PLATE), withId(NEW_PLATE)]);
  });

  // Persist to localStorage whenever plates change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLATES, JSON.stringify(plates));
    } catch (err) {
      Logger.error("Failed to persist plates to localStorage", err);
    }
  }, [plates]);

  // ---- CRUD operations ----
  const addPlate = () => {
    setPlates((prev) => {
      if (prev.length >= 10) {
        Logger.warn("Attempted to add plate beyond limit", {
          count: prev.length,
        });
        return prev;
      }
      return [...prev, withId(NEW_PLATE)];
    });
  };

  const removePlate = (id) => {
    setPlates((prev) => {
      if (prev.length <= 1) {
        Logger.warn("Attempted to remove last remaining plate");
        return prev;
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const updatePlate = (id, next) => {
    setPlates((prev) => {
      const exists = prev.some((p) => p.id === id);
      if (!exists) Logger.warn("updatePlate called with unknown id", { id });
      return prev.map((p) => (p.id === id ? { ...p, ...next } : p));
    });
  };

  const handleReorder = (nextList) => setPlates(nextList);

  // Shared motif helpers (current motif = from first plate)
  const currentMotif = plates[0]?.motifUrl || DEFAULT_MOTIF_URL;
  const setMotifForAll = (url) =>
    setPlates((prev) => prev.map((p) => ({ ...p, motifUrl: url })));
  const resetMotif = () => setMotifForAll(DEFAULT_MOTIF_URL);

  // Derived meta (kept for potential future use)
  const { totalWidthCm, maxHeightCm } = useMemo(
    () => ({
      totalWidthCm: plates.reduce((s, p) => s + p.widthCm, 0),
      maxHeightCm: plates.reduce((m, p) => Math.max(m, p.heightCm), 0),
    }),
    [plates]
  );

  return (
    <div className="container py-4">
      <div className="row g-4">
        {/* Left: preview + uploader */}
        <div className="col-12 col-lg-8">
          <PreviewPanel
            plates={plates}
            motifUrl={currentMotif}
            onMotifChange={setMotifForAll}
            onMotifReset={resetMotif}
          />
        </div>

        {/* Right: controls + list */}
        <div className="col-12 col-lg-4">
          <SidebarPanel
            unit={unit}
            setUnit={setUnit}
            plates={plates}
            onReorder={handleReorder}
            onCommit={(id, next) => updatePlate(id, next)}
            onRemove={(id) => removePlate(id)}
            onAdd={addPlate}
            canAdd={plates.length < 10}
            totalWidthCm={totalWidthCm}
          />
        </div>
      </div>
    </div>
  );
}
