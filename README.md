# AquaScan — Marine Debris Detection Frontend

A React + Vite frontend for the side-scan sonar debris detection system. Five screens: Overview
(dashboard), Upload, Review, Map, Reports — all wired together with real state and routing, backed by
mock data until a real API exists.

## Running it

Node.js was not available on the machine this was built on, so this has **not** been installed or run
yet. From this folder:

```
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## Connecting a real backend

Everything a backend needs to plug into lives in **`src/api/client.js`**. Each exported function
currently resolves data from `src/api/mockData.js`; replace the body of each with a `fetch()` call to
your API and keep the same return shape (documented at the top of each function). Nothing else in the
app needs to change — pages only ever import from `client.js`, never from the mock data directly.

- `getSurvey()`, `getScanLines()`, `getDetections(lineId)`, `getSites()` — read endpoints.
- `updateDetectionStatus(id, status)` — called when an analyst hits Confirm / Mark false in Review.
- `runDetectionPipeline({ files, metadata })` — called from Upload; should POST the files and survey
  metadata and return `{ queued, lineId }` so the UI can jump to the new line's Review screen.

Set `VITE_API_BASE_URL` in a `.env` file to point `client.js` at your API host once you wire it up.

## Real sonar imagery

Until then, every sonar "image" you see is procedurally generated in `src/utils/sonarRender.js` (oceanic
blue noise + a few placeholder shapes) — purely so the UI isn't blank. `src/components/SonarCanvas.jsx`
already has the swap built in: pass it an `imageSrc` (a URL or blob from the backend) instead of a
`scene`, and it renders that image directly. Bounding boxes in Review are positioned as fractions
(`bboxPct: { top, left, width, height }`) of the image, so they'll still line up once real detections
with real pixel coordinates come from the backend — just convert `bbox_px / image_width` etc. on the way
in.

## Reports / export

`src/utils/exportReport.js` builds the JSON/CSV report client-side from whatever detections are
currently loaded — this is the "Anomalous Reporting & Geotagging Engine" piece: exact lat/lon, bounding
box dimensions, and classification per hazard. It works against mock data now and will work unchanged
against real detections once the backend is wired in. If you'd rather generate reports server-side
later, point the Reports page's Export buttons at a download endpoint instead.

## Map

Uses Leaflet via `react-leaflet`, no API key required: OpenStreetMap tiles for "Map" mode, Esri World
Imagery for "Satellite", and Esri imagery + a labels overlay for "Hybrid". Switch with the buttons in the
top-right of the map.

## What's intentionally not here

No preprocessing options in Upload (speckle filtering, contrast normalization, etc.) — that's a backend
pipeline concern, not something an operator should have to configure per upload. No model name or
version anywhere in the UI — the dashboard just reports the detection engine as "Active".
