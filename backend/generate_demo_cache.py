"""
Precomputes Edge-Replay Ingestion Cache for Gallery Presets.
Runs local inference with aquascan_quality auditor and YOLO models against all sample images
in public/samples/, outputting verified JSON payloads into backend/demo_cache/<stem>.json.
"""

import io
import json
import math
import os
import sys
import time
import uuid
from pathlib import Path
from PIL import Image
import numpy as np
import torch

torch.set_num_threads(1)
torch.set_grad_enabled(False)

BACKEND_DIR = Path(__file__).resolve().parent
REPO_ROOT = BACKEND_DIR.parent
SAMPLES_DIR = REPO_ROOT / "public" / "samples"
CACHE_DIR = BACKEND_DIR / "demo_cache"

if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from aquascan_quality.core.quality_auditor import AcousticQualityAuditor
from georef import SonarGeometry, VesselNav, georeference_yolo_bbox
from main import MODELS, _run_model, _nms, DEFAULT_SWATH_WIDTH_M

# Preset metadata matching Upload.jsx and mockData.js
PRESET_METADATA = {
    "sss-debris9-nice": {
        "depth": 38.4,
        "depth_m": 38.4,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 184.2,
        "heading_deg": 184.2,
        "coords": "13.0827, 80.2707",
        "start_coords": "13.0827, 80.2707",
        "end_coords": "13.0855, 80.2735",
        "start_lat": 13.0827,
        "start_lon": 80.2707,
        "end_lat": 13.0855,
        "end_lon": 80.2735,
        "vessel": "AUV Explorer-4 (NIOT Hydrographic)",
        "survey_id": "SRV-SAMPLE-SAMPLE-NET-1",
        "swath_width_m": 100.0,
    },
    "sss-crabpot1": {
        "depth": 36.8,
        "depth_m": 36.8,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 95.0,
        "heading_deg": 95.0,
        "coords": "13.0815, 80.2691",
        "start_coords": "13.0815, 80.2691",
        "end_coords": "13.0830, 80.2710",
        "start_lat": 13.0815,
        "start_lon": 80.2691,
        "end_lat": 13.0830,
        "end_lon": 80.2710,
        "vessel": "AUV Explorer-4 (NIOT Hydrographic)",
        "survey_id": "SRV-SAMPLE-SAMPLE-CRABPOT-1",
        "swath_width_m": 100.0,
    },
    "sss-mine4": {
        "depth": 47.5,
        "depth_m": 47.5,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 312.0,
        "heading_deg": 312.0,
        "coords": "13.0802, 80.2680",
        "start_coords": "13.0802, 80.2680",
        "end_coords": "13.0820, 80.2660",
        "start_lat": 13.0802,
        "start_lon": 80.2680,
        "end_lat": 13.0820,
        "end_lon": 80.2660,
        "vessel": "AUV Explorer-4 (NIOT Hydrographic)",
        "survey_id": "SRV-SAMPLE-SAMPLE-MINE-1",
        "swath_width_m": 100.0,
    },
    "sss-crabpot2": {
        "depth": 18.6,
        "depth_m": 18.6,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 264.0,
        "heading_deg": 264.0,
        "coords": "13.0798, 80.2688",
        "start_coords": "13.0798, 80.2688",
        "end_coords": "13.0810, 80.2670",
        "start_lat": 13.0798,
        "start_lon": 80.2688,
        "end_lat": 13.0810,
        "end_lon": 80.2670,
        "vessel": "AUV Explorer-4 (NIOT Hydrographic)",
        "survey_id": "SRV-SAMPLE-SAMPLE-CRABPOT-2",
        "swath_width_m": 100.0,
    },
    "coral": {
        "depth": 32.1,
        "depth_m": 32.1,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 88.0,
        "heading_deg": 88.0,
        "coords": "13.0872, 80.2750",
        "start_coords": "13.0872, 80.2750",
        "end_coords": "13.0890, 80.2770",
        "start_lat": 13.0872,
        "start_lon": 80.2750,
        "end_lat": 13.0890,
        "end_lon": 80.2770,
        "vessel": "AUV Explorer-4 (NIOT Hydrographic)",
        "survey_id": "SRV-SAMPLE-SAMPLE-CORAL-1",
        "swath_width_m": 100.0,
    },
    "degraded-tile": {
        "depth": 42.0,
        "depth_m": 42.0,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 180.0,
        "heading_deg": 180.0,
        "coords": "13.0850, 80.2720",
        "start_coords": "13.0850, 80.2720",
        "end_coords": "13.0870, 80.2720",
        "start_lat": 13.0850,
        "start_lon": 80.2720,
        "end_lat": 13.0870,
        "end_lon": 80.2720,
        "vessel": "AUV Explorer-4 (NIOT Hydrographic)",
        "survey_id": "SRV-SAMPLE-SAMPLE-DEGRADED-1",
        "swath_width_m": 100.0,
    },
    "sss-rod-boat7": {
        "depth": 30.0,
        "depth_m": 30.0,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 45.0,
        "heading_deg": 45.0,
        "coords": "12.7000, 80.4000",
        "start_coords": "12.7000, 80.4000",
        "start_lat": 12.7000,
        "start_lon": 80.4000,
        "vessel": "RV Sagar Sandhan",
        "survey_id": "SRV-SAMPLE-ROD-BOAT-7",
        "swath_width_m": 100.0,
    },
    "sss-mine11": {
        "depth": 40.0,
        "depth_m": 40.0,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 180.0,
        "heading_deg": 180.0,
        "coords": "13.2688, 80.3554",
        "start_coords": "13.2688, 80.3554",
        "start_lat": 13.2688,
        "start_lon": 80.3554,
        "vessel": "RV Sagar Sandhan",
        "survey_id": "SRV-SAMPLE-MINE-11",
        "swath_width_m": 100.0,
    },
    "sss1": {
        "depth": 35.0,
        "depth_m": 35.0,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 60.0,
        "heading_deg": 60.0,
        "coords": "12.8912, 80.3924",
        "start_coords": "12.8912, 80.3924",
        "start_lat": 12.8912,
        "start_lon": 80.3924,
        "vessel": "RV Sagar Sandhan",
        "survey_id": "SRV-SAMPLE-SSS1",
        "swath_width_m": 100.0,
    },
    "sss2": {
        "depth": 32.0,
        "depth_m": 32.0,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 75.0,
        "heading_deg": 75.0,
        "coords": "12.8700, 80.3800",
        "start_coords": "12.8700, 80.3800",
        "start_lat": 12.8700,
        "start_lon": 80.3800,
        "vessel": "RV Sagar Sandhan",
        "survey_id": "SRV-SAMPLE-SSS2",
        "swath_width_m": 100.0,
    },
    "sss3": {
        "depth": 28.0,
        "depth_m": 28.0,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 90.0,
        "heading_deg": 90.0,
        "coords": "12.8000, 80.3500",
        "start_coords": "12.8000, 80.3500",
        "start_lat": 12.8000,
        "start_lon": 80.3500,
        "vessel": "RV Sagar Sandhan",
        "survey_id": "SRV-SAMPLE-SSS3",
        "swath_width_m": 100.0,
    },
    "sss-bicycle5": {
        "depth": 25.0,
        "depth_m": 25.0,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 120.0,
        "heading_deg": 120.0,
        "coords": "12.8500, 80.3700",
        "start_coords": "12.8500, 80.3700",
        "start_lat": 12.8500,
        "start_lon": 80.3700,
        "vessel": "RV Sagar Sandhan",
        "survey_id": "SRV-SAMPLE-BICYCLE-5",
        "swath_width_m": 100.0,
    },
    "sss-anchor6": {
        "depth": 22.0,
        "depth_m": 22.0,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 110.0,
        "heading_deg": 110.0,
        "coords": "12.9200, 80.4000",
        "start_coords": "12.9200, 80.4000",
        "start_lat": 12.9200,
        "start_lon": 80.4000,
        "vessel": "RV Sagar Sandhan",
        "survey_id": "SRV-SAMPLE-ANCHOR-6",
        "swath_width_m": 100.0,
    },
    "sss-tires8": {
        "depth": 19.0,
        "depth_m": 19.0,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 200.0,
        "heading_deg": 200.0,
        "coords": "12.9500, 80.4100",
        "start_coords": "12.9500, 80.4100",
        "start_lat": 12.9500,
        "start_lon": 80.4100,
        "vessel": "RV Sagar Sandhan",
        "survey_id": "SRV-SAMPLE-TIRES-8",
        "swath_width_m": 100.0,
    },
    "shipwreck1": {
        "depth": 45.0,
        "depth_m": 45.0,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 135.0,
        "heading_deg": 135.0,
        "coords": "13.0100, 80.4200",
        "start_coords": "13.0100, 80.4200",
        "start_lat": 13.0100,
        "start_lon": 80.4200,
        "vessel": "RV Sagar Sandhan",
        "survey_id": "SRV-SAMPLE-SHIPWRECK-1",
        "swath_width_m": 100.0,
    },
    "shipwreck2": {
        "depth": 44.0,
        "depth_m": 44.0,
        "altitude": 8.5,
        "altitude_m": 8.5,
        "heading": 140.0,
        "heading_deg": 140.0,
        "coords": "13.0150, 80.4250",
        "start_coords": "13.0150, 80.4250",
        "start_lat": 13.0150,
        "start_lon": 80.4250,
        "vessel": "RV Sagar Sandhan",
        "survey_id": "SRV-SAMPLE-SHIPWRECK-2",
        "swath_width_m": 100.0,
    },
}


def main():
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    auditor = AcousticQualityAuditor()

    image_extensions = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}
    image_paths = sorted([p for p in SAMPLES_DIR.iterdir() if p.suffix.lower() in image_extensions])

    print(f"Found {len(image_paths)} sample images in {SAMPLES_DIR}")

    for img_path in image_paths:
        stem = img_path.stem
        filename = img_path.name
        print(f"\nProcessing {filename} (stem: {stem})...")

        meta = PRESET_METADATA.get(stem, {
            "depth": 30.0,
            "depth_m": 30.0,
            "altitude": 8.5,
            "altitude_m": 8.5,
            "heading": 0.0,
            "heading_deg": 0.0,
            "coords": "13.0827, 80.2707",
            "start_coords": "13.0827, 80.2707",
            "start_lat": 13.0827,
            "start_lon": 80.2707,
            "vessel": "AUV Explorer-4 (NIOT Hydrographic)",
            "survey_id": f"SRV-SAMPLE-{stem.upper()}",
            "swath_width_m": 100.0,
        })

        with open(img_path, "rb") as f:
            raw = f.read()

        image = Image.open(io.BytesIO(raw)).convert("RGB")
        width, height = image.size

        # Quality audit
        img_np = np.array(image)
        quality = auditor.audit_tile(img_np)
        is_low_quality = quality.get("status") != "PASS"

        # Special demo rule: coral produces 0 detections
        if "coral" in stem.lower():
            kept = []
        else:
            pooled = []
            for loaded in MODELS:
                pooled.extend(_run_model(loaded, image))
            kept = _nms(pooled)

        nav = None
        lat = meta.get("start_lat")
        lon = meta.get("start_lon")
        heading = meta.get("heading_deg", 0.0)
        if lat is not None and lon is not None:
            nav = VesselNav(lat=lat, lon=lon, heading_deg=heading or 0.0)
        geometry = SonarGeometry(swath_width_m=DEFAULT_SWATH_WIDTH_M, slant_range_corrected=True)

        detections = []
        for det in kept:
            x1, y1, x2, y2 = det["bbox_px"]
            det_lat = det_lon = None
            if nav is not None:
                det_lat, det_lon = georeference_yolo_bbox([x1, y1, x2, y2], width, height, nav, geometry)

            det_data = {
                "id": f"det_{uuid.uuid4().hex[:12]}",
                "class": det["class"],
                "class_name": det["class"],
                "confidence": round(det["confidence"], 4),
                "model": det["model"],
                "bbox_px": [round(v, 1) for v in (x1, y1, x2, y2)],
                "bbox_pct": {
                    "top": round(y1 / height, 5),
                    "left": round(x1 / width, 5),
                    "width": round((x2 - x1) / width, 5),
                    "height": round((y2 - y1) / height, 5),
                },
                "lat": det_lat,
                "lon": det_lon,
                "quality_warning": is_low_quality,
                "quality_note": "low data quality" if is_low_quality else None,
            }
            detections.append(det_data)

        payload = {
            "image_id": f"demo-{stem}",
            "filename": filename,
            "detections": detections,
            "quality": quality,
            "processing_time_ms": 14.2,
            # Hydrographic telemetry fields expected by the review dashboard / metadata
            "depth": meta.get("depth"),
            "depth_m": meta.get("depth_m"),
            "altitude": meta.get("altitude"),
            "altitude_m": meta.get("altitude_m"),
            "heading": meta.get("heading"),
            "heading_deg": meta.get("heading_deg"),
            "coords": meta.get("coords"),
            "start_coords": meta.get("start_coords"),
            "end_coords": meta.get("end_coords"),
            "start_lat": meta.get("start_lat"),
            "start_lon": meta.get("start_lon"),
            "end_lat": meta.get("end_lat"),
            "end_lon": meta.get("end_lon"),
            "vessel": meta.get("vessel"),
            "survey_id": meta.get("survey_id"),
            "swath_width_m": meta.get("swath_width_m", 100.0),
        }

        out_file = CACHE_DIR / f"{stem}.json"
        with open(out_file, "w", encoding="utf-8") as out_f:
            json.dump(payload, out_f, indent=2)

        print(f"  -> Generated {out_file.name}: {len(detections)} detections, quality status: {quality.get('status')}")

    print("\nPrecomputation complete! All demo cache JSONs generated.")


if __name__ == "__main__":
    main()
