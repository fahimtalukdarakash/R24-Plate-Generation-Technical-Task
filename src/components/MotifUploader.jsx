// File: src/components/MotifUploader.jsx
import React, { useRef, useState } from "react";
import { Logger } from "../utils/logger.js";
import './MotifUploader.css';


/**
 * MotifUploader
 * - Lets the user upload an image (stored as DataURL) or paste an image URL.
 * - Calls `onChange(newUrl)` with the chosen URL/DataURL.
 * - `onReset()` resets to `defaultUrl`.
 *
 * Notes for devs:
 * - We keep UX identical to the original: no blocking validations or alerts.
 * - Errors are logged to console via Logger for future debugging.
 */
export default function MotifUploader({ value, onChange, onReset, defaultUrl }) {
  const fileRef = useRef(null);
  const [urlInput, setUrlInput] = useState("");

  // --- Helpers ---------------------------------------------------------------

  const isLikelyUrl = (str) => {
    if (typeof str !== "string") return false;
    const s = str.trim();
    return s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:");
  };

  const safeOnChange = (nextUrl, meta = {}) => {
    try {
      if (typeof onChange === "function") {
        onChange(nextUrl);
        Logger.info("Motif updated", { source: meta.source, length: nextUrl?.length, ...meta });
      } else {
        Logger.warn("MotifUploader: onChange prop is not a function");
      }
    } catch (err) {
      Logger.error("MotifUploader: onChange threw", err);
    }
  };

  // --- Handlers --------------------------------------------------------------

  function handleFile(e) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Keep UX: Convert to DataURL and pass upwards.
      const reader = new FileReader();

      reader.onload = () => {
        const dataUrl = reader.result; // "data:image/...;base64,..."
        if (typeof dataUrl === "string") {
          safeOnChange(dataUrl, { source: "file", fileName: file.name, fileSize: file.size });
        } else {
          Logger.warn("MotifUploader: FileReader returned non-string result");
        }
      };

      reader.onerror = (err) => {
        Logger.error("MotifUploader: FileReader error", err);
      };

      reader.readAsDataURL(file);

      // Reset input so selecting the same file again still triggers change
      e.target.value = "";
    } catch (err) {
      Logger.error("MotifUploader: handleFile failed", err);
    }
  }

  function applyUrl() {
    const raw = urlInput.trim();
    if (!raw) return;

    // Soft validation: log if the string doesn't look like a URL/DataURL,
    // but still proceed to keep existing behavior stable.
    if (!isLikelyUrl(raw)) {
      Logger.warn("MotifUploader: provided string does not look like a URL/DataURL", { raw });
    }

    safeOnChange(raw, { source: "url" });
    setUrlInput("");
  }

  function handleReset() {
    try {
      if (typeof onReset === "function") {
        onReset();
        Logger.info("Motif reset to default", { defaultUrl });
      } else {
        // Fallback: if onReset not provided, still set default
        safeOnChange(defaultUrl, { source: "reset-fallback" });
      }
    } catch (err) {
      Logger.error("MotifUploader: onReset failed", err);
    }
  }

  // --- Render ----------------------------------------------------------------

  const isCustom = value?.startsWith("data:");
  const currentLabel = isCustom ? "Benutzerdefiniertes Bild (hochgeladen)" : value;

  return (
    <div className="card shadow-sm motif-uploader">
      <div className="card-header bg-white">
        <strong>Motiv (Bild)</strong>
      </div>

      <div className="card-body d-flex flex-column gap-2">
        {/* Current preview */}
        <div className="d-flex align-items-center gap-3">
          <div
            style={{
              width: 64,
              height: 40,
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              backgroundImage: `url(${value})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            aria-label="Aktuelles Motiv"
            title="Aktuelles Motiv"
          />
          <small className="text-muted text-truncate" style={{ maxWidth: "220px" }}>
            {currentLabel}
          </small>
        </div>

        {/* Upload from device */}
        <div className="d-flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="form-control"
            aria-label="Bild vom Gerät hochladen"
          />
        </div>

        {/* Or paste image URL */}
        <div className="input-group">
          <input
            type="url"
            className="form-control"
            placeholder="https://example.com/bild.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            aria-label="Bild-URL einfügen"
          />
          <button className="btn btn-outline-secondary" onClick={applyUrl}>
            Übernehmen
          </button>
        </div>

        {/* Reset to default */}
        <div>
          <button className="px-3 py-1 btn-green" onClick={handleReset}>
            Auf Standardmotiv zurücksetzen
          </button>
        </div>

        <small className="text-muted">
          Du kannst ein Bild hochladen (bleibt gespeichert) oder eine Bild-URL einfügen.
        </small>
      </div>
    </div>
  );
}
