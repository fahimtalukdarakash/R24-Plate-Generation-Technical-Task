# Components Documentation

This document explains how each component works, how data flows through the app, and the key logic behind features like scaling, tiling, DnD reordering, unit conversion, persistence, and PNG export. It’s written so a new developer can get productive fast.

---

## Table of contents

1. [App.jsx](#appjsx)  
2. [PreviewPanel.jsx](#previewpaneljsx)  
3. [SidebarPanel.jsx](#sidebarpaneljsx)  
4. [PlatesSummary.jsx](#platessummaryjsx)  
5. [MultiPlatePreview.jsx](#multiplatepreviewjsx)  
6. [MotifUploader.jsx](#motifuploaderjsx)  
7. [PlateListDnd.jsx](#platelistdndjsx)  
8. [PlateItem.jsx](#plateitemjsx)  
9. [PlateMeta.jsx (optional)](#platemetajsx-optional)  
10. [Utilities](#utilities)  
11. [Constants](#constants)  
12. [Styling](#styling)  
13. [Data flow & interactions](#data-flow--interactions-at-a-glance)  
14. [Gotchas & tips](#gotchas--tips)

---

## App.jsx

**Role:** Top-level container for app state and composition. Holds global settings (unit), the list of plates, motif management, and persistence. Renders the left `PreviewPanel` and right `SidebarPanel`.

### Key responsibilities
- Hydrate/persist plates using `localStorage`
- Maintain global unit: `"cm" | "in"`
- Provide CRUD operations for plates
- Provide motif helpers (set/reset across all plates)
- Derive useful meta (e.g., `totalWidthCm`) for summary UI

### Helpers
```jsx
const withId = (p) => ({ ...p, id: crypto.randomUUID(), motifUrl: DEFAULT_MOTIF_URL });

const ensureMotif = (list) => (Array.isArray(list) ? list : []).map((p) => ({
  ...p,
  motifUrl:
    typeof p?.motifUrl === 'string' &&
    (p.motifUrl.startsWith('http') || p.motifUrl.startsWith('data:'))
      ? p.motifUrl
      : DEFAULT_MOTIF_URL,
}));
```
#### State initialization
```jsx
const [plates, setPlates] = useState(() => {
  try {
    const savedArray = localStorage.getItem(STORAGE_KEY_PLATES);
    if (savedArray) {
      const list = JSON.parse(savedArray);
      if (Array.isArray(list) && list.length) return ensureMotif(list);
    }
    const single = localStorage.getItem(STORAGE_KEY); // legacy
    if (single) {
      const p = JSON.parse(single);
      return ensureMotif([
        withId({
          widthCm: Number.isFinite(+p?.widthCm) ? +p.widthCm : DEFAULT_PLATE.widthCm,
          heightCm: Number.isFinite(+p?.heightCm) ? +p.heightCm : DEFAULT_PLATE.heightCm,
          motifUrl: typeof p?.motifUrl === 'string' ? p.motifUrl : DEFAULT_MOTIF_URL,
        }),
      ]);
    }
  } catch {}
  return ensureMotif([withId(DEFAULT_PLATE), withId(NEW_PLATE)]);
});
```
#### Persistence
```jsx
useEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY_PLATES, JSON.stringify(plates));
  } catch {}
}, [plates]);
```
#### CRUD + reorder
```jsx
const addPlate = () =>
  setPlates((prev) => (prev.length >= 10 ? prev : [...prev, withId(NEW_PLATE)]));

const removePlate = (id) =>
  setPlates((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p.id !== id)));

const updatePlate = (id, next) =>
  setPlates((prev) => prev.map((p) => (p.id === id ? { ...p, ...next } : p)));

const handleReorder = (nextList) => setPlates(nextList);
```
#### Motif helpers
```jsx
const currentMotif = plates[0]?.motifUrl || DEFAULT_MOTIF_URL;
const setMotifForAll = (url) => setPlates((prev) => prev.map((p) => ({ ...p, motifUrl: url })));
const resetMotif = () => setMotifForAll(DEFAULT_MOTIF_URL);
```
#### Derived meta
```jsx
const totalWidthCm = useMemo(
  () => plates.reduce((s, p) => s + p.widthCm, 0),
  [plates]
);
```
# `PreviewPanel.jsx`

A focused container for the **left column** of the app. It renders the **live preview** of all plates and provides a **PNG export** button. The **MotifUploader** lives just below the preview to keep the original UX flow intact.

---

## What this component does

- Shows a **card** with a “PNG exportieren” button.
- Renders the scaled **visual preview** of plates via `<MultiPlatePreview />`.
- Exposes **motif controls** (upload URL/file & reset) via `<MotifUploader />`.
- Handles **PNG export** of the preview DOM node using the `exportNodeToPng` utility.
- Logs developer-friendly messages (success/failure) via a tiny `Logger`.

There are **no side effects on props**; all app state (plates, motif, unit) remains in `App.jsx`.

---

## Props

| Prop            | Type                    | Required | Description                                                                 |
|-----------------|-------------------------|----------|-----------------------------------------------------------------------------|
| `plates`        | `Array<{ id, widthCm, heightCm, motifUrl }>` | ✅       | The ordered list of plates to render in the preview.                        |
| `motifUrl`      | `string`                | ✅       | The current motif image (URL or DataURL).                                   |
| `onMotifChange` | `(nextUrl: string) => void` | ✅   | Called when user uploads or pastes a new motif. Applies to all plates.      |
| `onMotifReset`  | `() => void`            | ✅       | Resets the motif to `DEFAULT_MOTIF_URL`.                                    |

> The component **does not** manage plates or motif state by itself. It forwards changes up via callbacks.

---

## How the preview/export works (logic)

1. **Ref to the preview DOM node**  
   A `ref` is attached to the card body that contains `<MultiPlatePreview />`. This DOM node is what we export.

2. **Export to PNG**  
   On button click, `exportNodeToPng(previewRef.current, 'Rueckwand-Preview.png')` renders the node to a PNG and triggers a download.  
   - Success → logs `Logger.info('PNG export completed')`.  
   - Failure → logs `Logger.error('PNG export failed', err)`.

3. **Motif handling**  
   Motif controls are delegated to `<MotifUploader />`:
   - `onChange` → calls the provided `onMotifChange` (parent updates all plates’ `motifUrl`).
   - `onReset` → calls the provided `onMotifReset`.

4. **Default safety**  
   If `motifUrl` is falsy, we fall back to `DEFAULT_MOTIF_URL` to prevent broken images.

---

## Render structure

```html
<card.preview-sticky-card>
  <card-header>
    <button> PNG exportieren </button>
  </card-header>
  <card-body ref="previewRef">
    <MultiPlatePreview plates={plates} motifUrl={motifUrl || DEFAULT_MOTIF_URL} />
  </card-body>
</card>

<!-- Spacer only for mobile/tablet when preview is fixed -->
<div class="preview-spacer d-lg-none"></div>

<!-- Motif controls -->
<MotifUploader ... />
```
**Why this order?**

- On mobile/tablet the preview card is fixed to the top; the spacer prevents content from sliding underneath it.  
- The uploader sits right below the preview on all breakpoints (matching original UX).

---

## The component (drop-in code)

```jsx
// File: src/components/PreviewPanel.jsx
import React, { useRef, useCallback } from 'react';
import MultiPlatePreview from './MultiPlatePreview.jsx';
import MotifUploader from './MotifUploader.jsx';
import { exportNodeToPng } from '../utils/exportPng.js';
import { DEFAULT_MOTIF_URL } from '../constants/config.js';
import { Logger } from '../utils/logger.js';

/**
 * PreviewPanel
 * - Renders the preview card with PNG export button
 * - Hosts the motif uploader below the preview
 * - No state of its own; forwards changes up via props
 */
export default function PreviewPanel({ plates, motifUrl, onMotifChange, onMotifReset }) {
  // DOM node that contains the visual preview; we export this node to PNG
  const previewRef = useRef(null);

  // Export the preview as a PNG file; keep UX silent and log for developers
  const handleExportPng = useCallback(async () => {
    try {
      if (!previewRef.current) throw new Error('Preview container not ready');
      await exportNodeToPng(previewRef.current, 'Rueckwand-Preview.png');
      Logger.info('PNG export completed');
    } catch (err) {
      Logger.error('PNG export failed', err);
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

        {/* The exported area — contains the scaled visual preview */}
        <div className="card-body bg-light pt-5 pb-5" ref={previewRef}>
          <MultiPlatePreview plates={plates} motifUrl={motifUrl || DEFAULT_MOTIF_URL} />
        </div>
      </div>

      {/* Spacer only for mobile/tablet when preview is fixed */}
      <div className="preview-spacer d-lg-none" />

      {/* Motif uploader sits below the preview, preserving original UX */}
      <MotifUploader
        value={motifUrl || DEFAULT_MOTIF_URL}
        onChange={onMotifChange}
        onReset={onMotifReset}
        defaultUrl={DEFAULT_MOTIF_URL}
      />
    </>
  );
}
```
## Integration notes

Import and render inside the left column in `App.jsx`:

```jsx
<PreviewPanel
  plates={plates}
  motifUrl={currentMotif}
  onMotifChange={setMotifForAll}
  onMotifReset={resetMotif}
/>
```

## Common pitfalls & how we avoid them

- **Exporting empty node:**  
  Guarded with:  
  ```js
  if (!previewRef.current) throw new Error('Preview container not ready');
  ```
  This ensures the export function doesn’t run until the DOM node is fully mounted
- **CORS issues with remote images:**  
  Images use `crossOrigin="anonymous"` in `MultiPlatePreview`.  
  This prevents canvas tainting during export. If the host does not provide CORS headers, uploading a local image or using a CORS-enabled host is recommended.

- **Big DOM snapshots:**  
  `html-to-image` can be heavy on very large DOM trees.  
  To avoid performance issues, the preview area uses **fixed heights per breakpoint** (mobile, tablet, desktop).  
  This keeps the PNG size predictable and reduces memory + CPU load during export.

# `MultiPlatePreview.jsx`

A visual engine that renders multiple “plates” side-by-side and paints a shared **motif image** across them. It automatically scales cm-based dimensions into pixels to fit the preview frame. When the combined width of all plates exceeds a motif “natural width” (assumed 300 cm), it **mirror-tiles** the motif to avoid visible seams.

---

## Purpose & Responsibilities

- Compute **scales** to map real-world cm to on-screen pixels so that the entire layout fits the preview frame.
- Render each plate as an absolutely positioned box with height aligned to the bottom.
- Draw a **single continuous image** (motif) across all plates; or **mirror-tile** if the total width exceeds the motif span.
- Adapt to **container resizes** (e.g., responsive layout) and reflow smoothly with small motion animations.
- Provide **lightweight developer logs** for debugging unusual states.

---

## Props

| Prop       | Type                                   | Required | Description                                                                 |
|------------|----------------------------------------|----------|-----------------------------------------------------------------------------|
| `plates`   | `Array<{ id, widthCm, heightCm }>`     | ✅       | Ordered list of rectangular plates with dimensions in **cm**.               |
| `motifUrl` | `string`                                | ✅       | Image URL/DataURL used as the shared motif across plates.                   |

> The **source of truth** for sizes is always cm. This component is responsible for cm→px conversion based on the current container size.

---

## High-level Rendering Flow

1. **Measure** the preview container (`boxRef.current.clientWidth/Height`).
2. **Compute scale factors** to map cm → px:
   - Vertical scale ties the physical max-height (from `HEIGHT_MAX`) to the available container height.
   - Horizontal scale fits the total width of plates into the available container width.
   - Use `scaleX = min(vScale, hScale)` and `scaleY = vScale` to guarantee nothing overflows while keeping bottoms aligned.
3. **Compute frame dimensions** in px using the chosen scales (total frame width = `totalWidthCm * scaleX`).
4. **Decide motif strategy**:
   - If `totalWidthCm <= MOTIF_WIDTH_CM` → draw the motif once, stretched across the **entire frame width**.
   - Else → **mirror-tile** the motif horizontally to fill the frame without obvious seams.
5. **Render plates**:
   - Each plate is positioned absolutely with `left` equal to **running sum** of previous widths (converted to px).
   - Each plate displays the **same motif** but with a shifted left offset so the image remains visually continuous across plate boundaries.

---

## Key Constants

- `HEIGHT_MAX` — the maximum allowed plate height in **cm** (used to compute vertical scale).
- `MOTIF_WIDTH_CM = 300` — the **assumed natural visual width** of the motif image in cm. Above this, mirror tiling kicks in.

> Why 300 cm? It’s an application-level assumption: one motif image “represents” roughly 300 cm of horizontal span in the preview. Adjust if your source images represent a different physical span.

---

## Scaling Logic — cm → px

Let:
- `boxW` = container width in px  
- `boxH` = container height in px  
- `totalWidthCm` = sum of all plate widths (in cm)  
- `HEIGHT_MAX` = max plate height (in cm)

We compute:

```js
const vScale = boxH / HEIGHT_MAX;              // vertical scale: cm → px
const hScale = boxW / Math.max(1, totalWidthCm); // horizontal scale: cm → px

setScaleY(vScale);
setScaleX(Math.min(vScale, hScale));
```
### Scaling & Frame Dimensions

- `scaleY = vScale` ensures plate bottoms align in the frame.  
- `scaleX = Math.min(vScale, hScale)` ensures the full width fits without horizontal overflow.  
- Using different `scaleX` and `scaleY` allows us to fit the entire layout while respecting a real-world aspect ceiling (max height).

**Frame dimensions derived from scale:**
```js
const frameH = boxH;                        // effectively the measured container height
const frameW = Math.round(totalWidthCm * scaleX);
```
These are used to size the motif (single stretched image) or to compute tile widths (mirror-tiling).
### Layout of Plates

We place plates left-to-right using a **running cm offset** so each plate’s left position is the sum of widths before it (converted from cm → px with `scaleX`).

```js
let xCm = 0;

plates.map((p, i) => {
  const leftPx = Math.round(xCm * scaleX);      // horizontal offset in px
  const w = Math.round(p.widthCm * scaleX);     // plate width in px
  const h = Math.round(p.heightCm * scaleY);    // plate height in px (bottom-aligned)

  xCm += p.widthCm;                              // advance running offset (in cm)

  // Render absolute-positioned <motion.div> with:
  // { left: leftPx, width: w, height: h, bottom: 0 }
});
```
* Each plate is a ```position: absolute``` box aligned to the bottom (bottom: 0), so all baselines line up.

* We use framer-motion for subtle mount/size transitions, keeping the UI responsive and smooth during layout changes.