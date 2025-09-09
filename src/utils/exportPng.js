// src/utils/exportPng.js
import { toPng } from "html-to-image";

/**
 * Export a DOM node to PNG (crisp on HiDPI).
 * - node: DOM element to snapshot
 * - filename: downloaded file name
 */
export async function exportNodeToPng(node, filename = "preview.png") {
  if (!node) return;
  const dataUrl = await toPng(node, {
    pixelRatio: Math.max(2, window.devicePixelRatio || 1), // sharper export
    cacheBust: true,
    backgroundColor: "#ffffff",
  });

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
