import React, { useRef, useCallback } from "react";
import MultiPlatePreview from "./MultiPlatePreview.jsx";
import MotifUploader from "./MotifUploader.jsx";
import { exportNodeToPng } from "../utils/exportPng.js";
import { DEFAULT_MOTIF_URL } from "../constants/config.js";
import { Logger } from "../utils/logger.js";

/**
 * PreviewPanel
 * - Renders the preview card with PNG export button
 * - Hosts the motif uploader below the preview on mobile/desktop as in original UX
 */
export default function PreviewPanel({
  plates,
  motifUrl,
  onMotifChange,
  onMotifReset,
}) {
  const previewRef = useRef(null);

  const handleExportPng = useCallback(async () => {
    try {
      if (!previewRef.current) throw new Error("Preview container not ready");
      await exportNodeToPng(previewRef.current, "Rueckwand-Preview.png");
      Logger.info("PNG export completed");
    } catch (err) {
      Logger.error("PNG export failed", err);
      // Note: intentionally no alert — UX remains unchanged; devs see console
    }
  }, []);

  return (
    <>
      <div className="card shadow-sm preview-card preview-sticky-card border-0 h-auto">
        <div className="card-header d-flex justify-content-between align-items-center border-0">
          <button className="btn btn-sm btn-green" onClick={handleExportPng}>
            PNG exportieren
          </button>
        </div>
        <div className="card-body bg-light pt-5 pb-5" ref={previewRef}>
          <MultiPlatePreview
            plates={plates}
            motifUrl={motifUrl || DEFAULT_MOTIF_URL}
          />
        </div>
      </div>

      {/* Spacer only for mobile/tablet when preview is fixed */}
      <div className="preview-spacer d-lg-none" />

      {/* Uploader follows preview (keeps original layout behavior) */}
      <MotifUploader
        value={motifUrl || DEFAULT_MOTIF_URL}
        onChange={onMotifChange}
        onReset={onMotifReset}
        defaultUrl={DEFAULT_MOTIF_URL}
      />
    </>
  );
}
