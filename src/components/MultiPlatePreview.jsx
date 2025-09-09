import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HEIGHT_MAX } from "../constants/limits.js";
import { Logger } from "../utils/logger.js";
import './MultiPlatePreview.css';


/**
 * MultiPlatePreview
 * Renders a horizontal set of plates scaled to fit the preview frame.
 * The motif image spans across all plates; if the total width exceeds
 * the motif's natural width (in cm), it mirrors tiles to avoid seams.
 */
export default function MultiPlatePreview({ plates, motifUrl }) {
  const boxRef = useRef(null);

  // Scale factors from cm -> px (X and Y can differ due to aspect constraints)
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);

  // --- Derived values (recomputed when inputs change) ---
  const totalWidthCm = useMemo(
    () =>
      (Array.isArray(plates) ? plates : []).reduce(
        (s, p) => s + (Number(p?.widthCm) || 0),
        0
      ) || 1,
    [plates]
  );

  // Compute frame (preview) width/height in pixels for current scale
  const frameDims = useMemo(() => {
    const el = boxRef.current;
    const frameH = el ? el.clientHeight : 360;
    const frameW = Math.max(1, Math.round(totalWidthCm * scaleX));
    return { frameW, frameH };
  }, [totalWidthCm, scaleX]);

  // --- Layout computation: fit all plates into the preview box ---
  useEffect(() => {
    let rafId;

    const compute = () => {
      try {
        const el = boxRef.current;
        if (!el) return;

        const boxW = Math.max(1, el.clientWidth);
        const boxH = Math.max(1, el.clientHeight);

        // Vertical scale: map HEIGHT_MAX cm to available height (px)
        const vScale = boxH / HEIGHT_MAX;

        // Horizontal scale: map total width cm to available width (px)
        const hScale = boxW / Math.max(1, totalWidthCm);

        // Use the smaller so nothing overflows horizontally,
        // but keep Y consistent so bottoms align.
        setScaleY(vScale);
        setScaleX(Math.min(vScale, hScale));
      } catch (err) {
        Logger.error("MultiPlatePreview: compute layout failed", err);
      }
    };

    // Compute once now
    compute();

    // Recompute on resize using rAF to batch updates
    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(compute);
    };
    window.addEventListener("resize", onResize);

    // One more frame in case fonts/layout settle later
    rafId = requestAnimationFrame(compute);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
    };
  }, [totalWidthCm]);

  // --- Motif tiling / mirroring logic ---
  // Assumption: the source motif image represents ~300 cm of width visually.
  // If we need more than that, mirror-tile to fill the remainder.
  const MOTIF_WIDTH_CM = 300;
  const needMirror = totalWidthCm > MOTIF_WIDTH_CM;

  const tile = useMemo(() => {
    const tileW = Math.max(1, Math.round(MOTIF_WIDTH_CM * scaleX));
    const tileCount = Math.max(1, Math.ceil(frameDims.frameW / tileW));
    return { tileW, tileCount };
  }, [scaleX, frameDims.frameW]);

  // Basic sanity check to help future developers debugging odd inputs
  useEffect(() => {
    if (!Array.isArray(plates) || plates.length === 0) {
      Logger.warn("MultiPlatePreview: received empty or invalid plates", { plates });
    }
    if (typeof motifUrl !== "string" || motifUrl.length === 0) {
      Logger.warn("MultiPlatePreview: motifUrl is empty or invalid", { motifUrl });
    }
  }, [plates, motifUrl]);

  // Render
  let xCm = 0; // running offset across plates (cm)
  return (
    <div ref={boxRef} className="w-100 position-relative preview-box">
      {plates.map((p, i) => {
        const widthCm = Number(p?.widthCm) || 0;
        const heightCm = Number(p?.heightCm) || 0;

        // Convert to px using current scales
        const w = Math.max(1, Math.round(widthCm * scaleX));
        const h = Math.max(1, Math.round(heightCm * scaleY));
        const leftPx = Math.round(xCm * scaleX);
        xCm += widthCm;

        return (
          <motion.div
            key={p.id}
            className="position-absolute"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, width: w, height: h, left: leftPx }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            style={{
              bottom: 0,
              overflow: "hidden",
              boxShadow: "0 2px 6px rgba(0,0,0,.06)",
            }}
          >
            {!needMirror ? (
              // Single stretched image spanning the whole frame width
              <img
                crossOrigin="anonymous"
                src={motifUrl}
                alt={`plate-${i + 1}`}
                style={{
                  position: "absolute",
                  left: -leftPx,
                  bottom: 0,
                  width: frameDims.frameW,
                  height: frameDims.frameH,
                  objectFit: "cover",
                  objectPosition: "center center",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            ) : (
              // Mirror-tiling to cover > MOTIF_WIDTH_CM
              <div
                style={{
                  position: "absolute",
                  left: -leftPx,
                  bottom: 0,
                  width: frameDims.frameW,
                  height: frameDims.frameH,
                  display: "flex",
                }}
                className="plate-image"
              >
                {Array.from({ length: tile.tileCount }).map((_, idx) => (
                  <img
                    crossOrigin="anonymous"
                    key={idx}
                    src={motifUrl}
                    alt={`motif-tile-${idx}`}
                    style={{
                      width: tile.tileW,
                      height: frameDims.frameH,
                      objectFit: "cover",
                      objectPosition: "center center",
                      transform: idx % 2 === 1 ? "scaleX(-1)" : "none",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
