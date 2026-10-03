# AquaScan — Marine Debris & Hazard Detection

![SIH 2026](https://img.shields.io/badge/Smart%20India%20Hackathon-2026-orange)
![Problem Statement](https://img.shields.io/badge/PS-SIH26057-blue)
![Ministry](https://img.shields.io/badge/MoES%20%2F%20NIOT-Oceanography-0a7ea4)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776ab?logo=python&logoColor=white)
![YOLO](https://img.shields.io/badge/YOLO-Ultralytics-00ffff)
![PostgreSQL](https://img.shields.io/badge/Postgres-Neon-336791?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ed?logo=docker&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?logo=leaflet&logoColor=white)

Automated detection and georeferencing of marine debris and underwater hazards (ghost nets, crab pots, shipwrecks, mines, ordnance) in side-scan sonar imagery. Features dead-reckoning georeferencing from vessel navigation fixes, a Bayesian-regularized risk zone engine, and a human-in-the-loop active-learning loop.

Built for **Smart India Hackathon 2026**, problem statement **SIH26057** (Ministry of Earth Sciences / NIOT), by **Team Aquanauts**, Ramaiah Institute of Technology.

### 🌊 [View it live → marine-debris-detector-t79s.vercel.app](https://marine-debris-detector-t79s.vercel.app)

<br/>

<div align="center">
  <img src="docs/screenshots/landing-hero.jpg" width="650" alt="AquaScan Landing Platform" />
  <p><em>AquaScan Autonomous Debris & Subsea Hazard Platform</em></p>
</div>

---

## Problem Statement

**SIH26057 — Ministry of Earth Sciences / National Institute of Ocean Technology (NIOT).**  
Side-scan sonar surveys of the seabed generate vast volumes of acoustic waterfall imagery. Finding marine hazards—derelict fishing gear, ghost nets, shipwrecks, and explosive ordnance—currently demands hours of manual, frame-by-frame scrubbing by specialized hydrographers. Manual review is slow, prone to fatigue, hard to scale across extensive coastal zones, and rarely translates into georeferenced, GIS-ready recovery coordinates.

**Our Solution:** AquaScan automates contact detection across the entire debris taxonomy, georeferences every contact to real-world WGS84 coordinates, computes empirical debris accumulation risk grids per surveyed area, and captures hydrographer corrections to continually refine model performance.

---

## Core Features

- **Unified Multi-Class Hazard Detection:** A single-pass YOLO detection architecture trained across the complete marine hazard taxonomy (ghost nets, derelict crab pots, shipwrecks, naval mines/MILCO, aircraft wreckage, and person-in-water). Class-agnostic Non-Maximum Suppression (NMS) resolves overlapping acoustic returns.
- **Dead-Reckoning Georeferencing:** Converts pixel offsets into metric ground range, projects offsets along vessel heading vectors, and transforms local coordinates into global UTM / WGS84 positions via `pyproj`.
- **Data-Driven Risk Zone Engine:** Evaluates debris density per **surveyed square kilometer ($\text{km}^2$)** rather than misleading raw counts. Utilizes Empirical Bayes (Gamma-Poisson) shrinkage, a taxonomic severity hierarchy (mines $\gg$ pots), human verification weighting, and proximity priors.
- **Dedicated Hazard Lenses:** Instant filtering between **Navigation Hazards** (mines, wrecks, life safety) and **Ecological Threats** (ghost nets, derelict traps).
- **Explainable Sonar Preprocessing:** Live client-side column-gain equalization (mitigating waterfall striping) and sonar-tuned CLAHE (contrast enhancement) for transparent operator inspection.
- **Human-in-the-Loop Active Learning:** Three-tier automated confidence triage (Auto-Confirmed $\ge 50\%$, Needs-Review, Rejected). Hydrographer corrections feed directly into structured YOLO training archives with hard negatives.
- **Dual-Mode Persistence:** Automatically uses Neon serverless PostgreSQL when configured, or a zero-configuration in-memory fallback for local development out of the box.
- **Survey-Grade GIS Deliverables:** Export filtered contacts as GIS-ready KML layers (Google Earth / QGIS / ArcGIS), GeoJSON, CSV, or formatted multi-page hydrographic survey PDF reports.

---

## Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, React Router | Fast, responsive single-page application |
| **Mapping & GIS** | Leaflet, React-Leaflet, PyProj | Interactive spatial layers, UTM transformations, KML generation |
| **Backend** | Python 3.11+, FastAPI, Uvicorn | High-throughput asynchronous REST backend |
| **Machine Learning** | Ultralytics YOLO, PIL, OpenCV | Side-scan sonar object detection & acoustic filtering |
| **Database** | Neon Serverless PostgreSQL / In-Memory | Annotation persistence, survey footprints, hard negatives |
| **Styling & UI** | CSS Custom Properties, Tailwind (Landing) | High-contrast oceanic dark mode & sonar palette |
| **Deployment** | Vercel (Frontend), Railway + Docker (Backend) | Containerized cloud infrastructure |

---

## Architecture

```mermaid
flowchart LR
    subgraph Client["Frontend (React + Vite)"]
        UP[Upload & EXIF Parse] --> RV[Review & Annotations]
        RV --> MP[Spatial Map & Risk Engine]
        RV --> RP[Reports: PDF / KML / CSV]
        PV[Live Preprocessing Visualizer]
    end
    subgraph Engine["Inference & Geospatial Engine (FastAPI)"]
        DET[Sonar Detection Service] --> YOLO[Unified YOLO Ensemble & NMS]
        YOLO --> GEO[PyProj Georeferencer]
        RZ[Bayesian Risk Engine]
        EXP[Training Dataset Packager]
    end
    subgraph Storage["Persistence Layer (Postgres / In-Memory)"]
        A[(Confirmed Annotations)]
        R[(Rejected Hard Negatives)]
        C[(Survey Coverage Tracks)]
        D[(Georeferenced Detections)]
    end

    UP -->|Sonar Tile + Nav Fix| DET
    GEO -->|Detections + Lat/Lon| RV
    RV -->|Operator Confirm / Reject| Storage
    Storage --> RZ
    RZ -->|GeoJSON Risk Grids| MP
    Storage --> EXP
    EXP -->|YOLO-format Archive| Retrain[Model Retraining]
```

---

## System Walkthrough & Screenshots

### 1. Spatial Map & Measured Risk Grids
Inspect georeferenced contacts on OpenStreetMap, Esri Satellite, or Hybrid layers. Toggle between empirical **Measured Density Grids** (derived from survey track density) and heuristic **Reference Prior Zones**.

<div align="center">
  <img src="docs/screenshots/map-measured.png" width="650" alt="AquaScan Measured Risk Grid with Reasoning Popup" />
  <p><em>Data-driven measured risk grid with natural-language reasoning popup, component breakdown, and hazard lens filter</em></p>
</div>

<br/>

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="docs/screenshots/map-satellite.jpg" width="310" alt="Map Satellite View" /><br/>
        <em>Satellite Basemap & Known Prior Zones</em>
      </td>
      <td align="center">
        <img src="docs/screenshots/map-hybrid.jpg" width="310" alt="Map Hybrid View" /><br/>
        <em>Coastal Transects & Detections</em>
      </td>
    </tr>
  </table>
</div>

---

### 2. Overview Dashboard
Real-time survey telemetry, model latency benchmarks, system memory utilization, and class distribution breakdown.

<div align="center">
  <img src="docs/screenshots/dashboard-overview.jpg" width="650" alt="AquaScan Overview Dashboard" />
  <p><em>Survey telemetry, model inference stats, and recent sonar scan lines</em></p>
</div>

---

### 3. Operator Review & Explainable Preprocessing
The review interface presents detected bounding boxes ranked by confidence. Operators can confirm, reject, or draw missed objects.

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="docs/screenshots/review.jpg" width="310" alt="Review Interface" /><br/>
        <em>Acoustic Waterfall & Bounding Boxes</em>
      </td>
      <td align="center">
        <img src="docs/screenshots/detection-pipeline.jpg" width="310" alt="Detection Pipeline Visualizer" /><br/>
        <em>Live Normalization & CLAHE Stages</em>
      </td>
    </tr>
  </table>
</div>

---

## Detection & Risk Pipeline

```mermaid
flowchart TD
    A["Upload Sonar Waterfall (Image + Nav Telemetry)"] --> B["Decode Image & Parse Telemetry"]
    B --> C["YOLO Inference (Unified Full Taxonomy)"]
    C --> D["Class-Agnostic NMS (IoU 0.5)"]
    D --> E{"Nav Fix Provided?"}
    E -- Yes --> F["Georeference (Pixel $\to$ Ground Range $\to$ Heading $\to$ WGS84)"]
    E -- No --> G["Pixel Coordinates Only"]
    F --> H["Record Survey Footprint & Detections"]
    G --> H
    H --> I{"Confidence $\ge$ 50%?"}
    I -- Yes --> J["Auto-Confirmed"]
    I -- No --> K["Needs Operator Review"]
    J --> L["Interactive Review Screen"]
    K --> L
    L --> M{"Operator Verification"}
    M -- Confirm / Draw --> N[("Confirmed Annotations")]
    M -- Reject --> O[("Hard Negatives")]
    N --> P["Export YOLO Retraining Archive"]
    O --> P
    N --> Q["Compute Bayesian Risk Grid per $\text{km}^2$"]
    L --> R["Export Survey Deliverables (PDF, KML, CSV)"]
```

---

## Results & Benchmarks

All evaluation figures reflect precision, recall, and $\text{mAP}_{50}$ measured on our held-out test split using identical training configurations.

### 1. Preprocessing Impact
Ablation study on the crab-pot side-scan sonar dataset:

| Configuration | Precision | Recall | $\text{mAP}_{50}$ | Relative Gain |
|---|---|---|---|---|
| Raw Sonar Imagery | 0.4730 | 0.4000 | 0.3835 | Baseline |
| + Column Gain Normalization | 0.5962 | 0.4853 | 0.4592 | $+19.7\%$ |
| **+ Sonar-Aware Augmentation** | **0.7449** | **0.6528** | **0.6021** | **$+57.0\%$** |

### 2. Model Size Comparison
Evaluated across identical 3k-image acoustic partitions:

| Model Architecture | Precision | Recall | $\text{mAP}_{50}$ | Weights Size | Deployment Status |
|---|---|---|---|---|---|
| **YOLO26n (Nano)** | **0.4730** | **0.4000** | **0.3860** | **5.3 MB** | **Shipped & Active** |
| YOLO26s (Small) | 0.3995 | 0.4261 | 0.3735 | 22.1 MB | Evaluated |
| YOLO26m (Medium) | 0.4710 | 0.4520 | 0.4260 | 49.6 MB | Evaluated |

*Scaling up beyond Nano yielded marginal gains within the measurement noise floor ($\pm 0.05$). The 5.3 MB Nano variant was selected for edge readiness on unaccelerated CPU hardware.*

### 3. Runtime Benchmarks
- **CPU Inference:** 224 ms per tile
- **Throughput:** ~4.5 FPS on standard CPU
- **Model Size:** 5.3 MB

---

## Risk Zone Formulation

Rather than static guesses, AquaScan calculates risk dynamically from real survey findings:

$$\mathbf{Risk} = 0.45 \times \text{Density}_{\text{norm}} + 0.30 \times \text{Severity} + 0.25 \times \text{Prior}$$

1. **Measured Density ($\text{km}^2$):** Calculated as weighted debris divided by surveyed area ($\text{swath} \times \text{length}$). Employs Gamma-Poisson shrinkage so small exploratory passes do not produce misleading hotspots.
2. **Taxonomic Severity Matrix:**
   - Mine / MILCO / Ordnance: `1.00`
   - Person-in-Water: `1.00`
   - Ghost Net / Derelict Gear: `0.80`
   - Shipwreck Hull: `0.60`
   - Aircraft Wreckage: `0.60`
   - Derelict Crab Pot: `0.40`
   - Unknown Debris: `0.35`
   - Non-Mine Object: `0.15`
3. **Proximity Prior:** Soft Gaussian falloff ($30\text{ km}$) around maritime ports, river mouths, and major shipping routes.
4. **Honest Confidence:** Only surveyed areas are evaluated. Unsurveyed ocean is treated as **Unknown**, never falsely marked green ("safe").

*Complete mathematical derivations and formulas are detailed in [docs/RISK_ZONES.md](docs/RISK_ZONES.md).*

---

## Getting Started Locally

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+ & pip

### 1. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
The application opens at `http://localhost:5173`.

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows PowerShell:
venv\Scripts\Activate.ps1
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

> [!NOTE]
> **Zero-Config Database:** If no `DATABASE_URL` is configured, the backend automatically initializes an in-memory storage engine pre-seeded with sample survey transects. To use PostgreSQL (Neon), add your `DATABASE_URL` in `.env`.

---

## Feasibility & Scalability

| Capability | Current Status | Architecture Notes |
|---|---|---|
| Multi-Class YOLO Detection | Working | Server-side ensembled inference with class-agnostic NMS |
| Dead-Reckoning Georeferencing | Working | `pyproj` metric slant-range & UTM conversion |
| Data-Driven Risk Grid Engine | Working | Empirical Bayes density per surveyed $\text{km}^2$ with explainability |
| Dual-Mode Persistence | Working | Neon PostgreSQL in cloud / In-memory fallback locally |
| Hydrographic PDF / KML Export | Working | Multi-section PDF deliverables and QGIS-compatible KML |
| Live Preprocessing Visualizer | Working | Client-side column-gain normalization and CLAHE |
| Edge Packaging (ONNX / TFLite) | Proposed | 5.3 MB footprint ready for Jetson / Raspberry Pi deployment |
| Native Sonar Ingestion (.xtf/.jsf) | Roadmap | Currently decodes standard raster sonar waterfalls (PNG/JPG) |
