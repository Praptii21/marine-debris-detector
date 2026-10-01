# AquaScan — Marine Debris & Hazard Detection

Automated detection of marine debris and hazards (ghost nets, crab pots, shipwrecks, mines) in side-scan
sonar imagery. A unified YOLO detection model runs server-side, every detection is georeferenced from the
vessel's nav fix, and operator corrections feed back into a Postgres-backed active-learning loop.

Built for **Smart India Hackathon 2026**, problem statement **SIH26057** (Ministry of Earth Sciences /
NIOT), by **Team Aquanauts**, Ramaiah Institute of Technology.

**Live:**
- Frontend — https://marine-debris-detector-t79s.vercel.app
- Backend API — https://marine-debris-detector-production.up.railway.app (`/health` for status)

![Landing page](docs/screenshots/landing-hero.jpg)

![Detection pipeline walkthrough on the landing page](docs/screenshots/landing-pipeline.jpg)

## What's actually real here

Worth being upfront about, since it matters for how this gets presented:

- **Detection is real.** A YOLO model trained across the full debris taxonomy runs on every upload — not a
  mock response. `ultralytics` + the actual `.pt` weight files run server-side on every `/detect` call,
  with NMS resolving overlapping boxes on the same tile.
- **Georeferencing is real.** Pixel offset → ground range → vessel heading → UTM, using `pyproj` against
  the nav fix supplied at upload (`backend/georef.py`). Not simulated coordinates.
- **The preprocessing pipeline shown in Review is real.** Per-column gain normalization and CLAHE contrast
  enhancement run live on the actual uploaded tile (`src/components/PipelineVisualizer.jsx`), not a
  pre-baked illustration.
- **The risk/accumulation-zone map layer is a heuristic, not a trained model.** It's a hand-weighted
  reference layer (port proximity, fishing density, shipping lanes, river outflow) for survey
  prioritization — labelled honestly as "known accumulation zones," not "AI-predicted."
- **Metrics and annotations now persist in Postgres (Neon)**, not local files — see
  [Persistence](#persistence--metrics) below.

## Screens

![Overview dashboard](docs/screenshots/dashboard-overview.jpg)

- **Overview** (`/dashboard`) — survey stats, live telemetry (model, inference time, CPU/memory, last
  synced), recent scan lines with Active/Archived filtering, review queue, class distribution.
- **Upload** (`/upload`) — drag-drop or a built-in sample gallery of real annotated sonar tiles; extracts
  EXIF GPS when present (e.g. drone imagery), otherwise leaves survey metadata for manual entry.
- **Review** (`/review/:lineId`) — the annotation tool: confirm/reject/draw boxes, confidence-based
  auto-triage (auto-confirmed / needs-review / rejected), the live Detection Pipeline visualizer, prev/next
  line navigation, and a scan-line gallery strip.

  ![Review — detections on the waterfall](docs/screenshots/review.jpg)

  ![Detection Pipeline panel — real preprocessing stages](docs/screenshots/detection-pipeline.jpg)

- **Map** (`/map`) — georeferenced detections plotted on Leaflet (OpenStreetMap / Esri satellite /
  hybrid), overlaid with the risk reference layer, KML export for GIS tools.

  ![Map — risk overlay, satellite basemap](docs/screenshots/map-satellite.jpg)

  ![Map — detections across the coastline, hybrid basemap](docs/screenshots/map-hybrid.jpg)

- **Reports** (`/reports`) — searchable/filterable detection archive (class, confidence threshold), export
  as CSV, JSON, or a multi-section PDF survey report.

## Architecture

```
┌──────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│  React + Vite     │ ───► │  FastAPI backend      │ ───► │  Neon Postgres   │
│  (Vercel)          │      │  (Railway, Docker)     │      │  annotations,    │
│  src/              │      │  backend/main.py       │      │  rejections,      │
│                    │      │  YOLO (ultralytics)    │      │  images, events   │
└──────────────────┘      └──────────────────────┘      └─────────────────┘
```

- **Frontend** — React 18 + Vite, React Router, Leaflet/react-leaflet for the map, jsPDF + html2canvas for
  the PDF report, Tailwind (scoped to the landing page only — the dashboard uses its own CSS-variable
  theme system, see `src/index.css`).
- **Backend** — FastAPI, `ultralytics` (YOLO), `pyproj` (georeferencing), `psycopg2` (Postgres). Deployed
  via a Dockerfile (not Railway's auto-detected builder — needed to install OpenCV's system libraries that
  `ultralytics`'s transitive `opencv-python` dependency requires but doesn't declare).
- **Database** — Neon (serverless Postgres), connected via a pooled connection string.

## Running it locally

### Frontend

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. Set `VITE_API_BASE_URL` in a `.env` file to point it at a backend
(defaults to `http://localhost:8000`).

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Needs a `.env` at the **project root** (not `backend/`) with:

```
DATABASE_URL=postgresql://...
DATABASE_URL_POOLED=postgresql://...   # used preferentially — Neon's pooled endpoint
```

(`backend/db.py` loads it from the parent directory since `main.py` runs from inside `backend/`.)

Model weights live in `backend/models/` (`.pt` files, tracked in git — see note below) and load
automatically on startup; `/health` reports which ones loaded.

## Persistence & metrics

Originally annotations were written to local files (`backend/annotations/`) — that didn't survive a
redeploy on any host with ephemeral disk. `backend/db.py` now persists everything to Postgres instead:

| Table | What |
|---|---|
| `annotations` | Confirmed operator corrections (YOLO-format box + class) |
| `rejected_annotations` | Explicitly rejected model calls — hard negatives for retraining |
| `annotation_images` | The source image bytes for each reviewed line |
| `events` | Lightweight usage metrics — one row per `/detect` call and per review save, with counts and timing |

`GET /annotations/export` rebuilds a YOLO-format training `.zip` directly from Postgres. Saves batch all
inserts over a single connection (opening a new connection per row was the original implementation and
was measurably slow over a real network — see commit history).

## Notes for anyone continuing this

- **Model weights are committed to git**, which is unusual but deliberate — `backend/models/**/*.pt` is
  *not* gitignored. A GitHub-based deploy needs the actual weight files; they were originally excluded,
  which meant the deployed backend loaded zero models until that was fixed.
- **The Railway backend uses a Dockerfile**, not Railpack/Nixpacks auto-detection, specifically to apt-install
  `libgl1`/`libxcb1`/etc. — `ultralytics` pulls in full `opencv-python` as a transitive dependency even
  though `requirements.txt` pins `opencv-python-headless`, and the conflict leaves a `cv2` binary that's
  missing X11 shared libraries on a minimal image.
- **`VITE_API_BASE_URL` must have no trailing slash.** A trailing slash produces `BASE_URL + '/health'` →
  a double slash, which FastAPI treats as a different, non-existent route.
- The risk/accumulation layer (`public/data/risk_data.json`) is static reference data — if you want it to
  reflect real detection density over time, it needs to aggregate from the `annotations`/`events` tables
  instead of being hand-authored. Not done yet; noted as the obvious next step.
