# Rückwand Preview Builder

A lightweight React app to preview multiple wall panels (“Rückwände”) side-by-side, set sizes in cm/in, apply a shared motif image, drag to reorder, and export a PNG preview.

---

## Tech stack

- **Vite 7**
- **React 19**
- **Bootstrap 5** (CDN)
- **@hello-pangea/dnd** for drag & drop
- **framer-motion** for micro-animations
- **html-to-image** for PNG export

---

## Requirements

- **Node.js ≥ 18** (Vite 7 requires Node 18+).  
  **Recommended:** **Node 20 LTS** (and npm 10+).

> If your Node is older than 18, follow the upgrade steps below.

---

## Quick start

```bash
# 1) Clone
git clone <your-repo-url> rueckwand-preview
cd rueckwand-preview

# 2) Check Node (need >=18; ideally 20 LTS)
node -v

# 3) Install deps
npm install

# 4) Start dev server
npm run dev

# 5) Lint (optional)
npm run lint

# 6) Build for production
npm run build

# 7) Preview production build locally
npm run preview
```
Vite prints a local URL (e.g., http://localhost:5173). Open it in your browser.

## If Node is too old — upgrade with nvm (recommended)
### macOS / Linux
```
# Install nvm (Node Version Manager)
# See: https://github.com/nvm-sh/nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Make nvm available in your shell (restart terminal if needed)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use Node 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node -v
npm -v

```
### Windows (PowerShell) — nvm-windows
1. Uninstall any Node installed via the Node installer (optional but cleaner).

2. Install nvm-windows: https://github.com/coreybutler/nvm-windows/releases

3. Run the installer and reopen your terminal.

4. Install & use Node 20 LTS:
```bash
nvm install 20
nvm use 20
node -v
npm -v
```
After upgrading Node, re-open your terminal in the project folder and run:
```bash
npm install
npm run dev
```
### Scripts (from package.json)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```
### Dependencies
```json
{
  "dependencies": {
    "@hello-pangea/dnd": "^18.0.1",
    "framer-motion": "^12.23.12",
    "html-to-image": "^1.11.13",
    "react": "^19.1.1",
    "react-dom": "^19.1.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.33.0",
    "@types/react": "^19.1.10",
    "@types/react-dom": "^19.1.7",
    "@vitejs/plugin-react": "^5.0.0",
    "eslint": "^9.33.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.3.0",
    "vite": "^7.1.2"
  }
}
```
### Project Structure
```php
src/
  App.jsx                         # small container; state + composition
  main.jsx                        # Vite entry; imports global CSS
  index.css                       # global utilities (e.g., .btn-green)
  App.css                         # app-wide layout (sticky preview/right panel)

  constants/
    config.js                     # DEFAULT_PLATE, NEW_PLATE, STORAGE_KEY*, etc.
    limits.js                     # WIDTH_MIN/MAX, HEIGHT_MIN/MAX

  utils/
    exportPng.js                  # DOM-to-PNG helper (uses html-to-image)
    number.js                     # parseLocaleNumber, formatNumber
    logger.js                     # small console logger for devs

  components/
    PreviewPanel.jsx              # left: preview + PNG export + motif uploader
    SidebarPanel.jsx              # right: unit toggle + list + add button
    PlatesSummary.jsx             # read-only card: total width (cm/in)

    MultiPlatePreview.jsx
    MultiPlatePreview.css

    MotifUploader.jsx
    MotifUploader.css

    PlateListDnd.jsx
    PlateListDnd.css             # (optional – can be empty for now)

    PlateItem.jsx
    PlateItem.css

    // Optional/legacy (keep if you use them)
    PlateMeta.jsx                 # read-only details for a single plate (optional)
```
