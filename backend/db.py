"""
Persistence layer for operator annotations, rejected calls, source images,
detections, survey coverage, and lightweight usage events.

Dual-mode:
  1. Postgres (Neon) when DATABASE_URL or DATABASE_URL_POOLED is configured.
  2. In-memory fallback when running locally without a database URL, so anyone
     can run `uvicorn main:app --reload` out of the box with zero external
     database dependencies.
"""

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterator, List, Optional, Tuple

from dotenv import load_dotenv

# main.py runs from backend/, so the root .env is one directory up.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Check if a database URL is provided
DATABASE_URL = os.environ.get("DATABASE_URL_POOLED") or os.environ.get("DATABASE_URL")
HAS_DB = bool(DATABASE_URL)

if HAS_DB:
    import psycopg2
    from psycopg2.extras import Json, RealDictCursor

    def get_conn():
        return psycopg2.connect(DATABASE_URL)
else:
    print("[db] No DATABASE_URL found in environment or .env — running with in-memory persistence.")


# -- In-memory storage structures (used when HAS_DB is False) -----------------
_mem_annotations: List[dict] = []
_mem_rejected: List[dict] = []
_mem_images: Dict[str, Tuple[str, bytes]] = {}  # image_id -> (ext, data)
_mem_events: List[dict] = []
_mem_detections: Dict[str, dict] = {}           # id -> dict
_mem_coverage: Dict[str, dict] = {}             # image_id -> dict


def _seed_demo_in_memory():
    """Populates the in-memory store with the baseline survey transects and
    georeferenced detections so the measured risk grid is populated on launch."""
    if _mem_coverage:
        return
    
    demo_lines = [
        {"image_id": "L-198", "lat": 13.2688, "lon": 80.3554, "heading_deg": 45.0, "swath_width_m": 100.0, "length_m": 850.0, "area_km2": 0.085, "img_w": 1024, "img_h": 2048},
        {"image_id": "L-194", "lat": 13.0206, "lon": 80.4223, "heading_deg": 90.0, "swath_width_m": 120.0, "length_m": 1200.0, "area_km2": 0.144, "img_w": 1024, "img_h": 2048},
        {"image_id": "L-199", "lat": 12.8912, "lon": 80.3924, "heading_deg": 180.0, "swath_width_m": 100.0, "length_m": 950.0, "area_km2": 0.095, "img_w": 1024, "img_h": 2048},
        {"image_id": "L-193", "lat": 12.7000, "lon": 80.4000, "heading_deg": 270.0, "swath_width_m": 100.0, "length_m": 600.0, "area_km2": 0.060, "img_w": 1024, "img_h": 2048},
        {"image_id": "L-196", "lat": 14.0219, "lon": 74.3341, "heading_deg": 60.0, "swath_width_m": 100.0, "length_m": 1100.0, "area_km2": 0.110, "img_w": 1024, "img_h": 2048},
        {"image_id": "L-197", "lat": 12.9141, "lon": 74.8241, "heading_deg": 120.0, "swath_width_m": 100.0, "length_m": 900.0, "area_km2": 0.090, "img_w": 1024, "img_h": 2048},
    ]
    for line in demo_lines:
        line["created_at"] = datetime.now(timezone.utc)
        _mem_coverage[line["image_id"]] = line

    demo_dets = [
        {"id": "det_l198_1", "image_id": "L-198", "class": "mine", "confidence": 0.88, "lat": 13.2695, "lon": 80.3562},
        {"id": "det_l198_2", "image_id": "L-198", "class": "ghost_net", "confidence": 0.79, "lat": 13.2678, "lon": 80.3546},
        {"id": "det_l198_3", "image_id": "L-198", "class": "crab_pot", "confidence": 0.65, "lat": 13.2684, "lon": 80.3551},
        {"id": "det_l194_1", "image_id": "L-194", "class": "shipwreck", "confidence": 0.85, "lat": 13.0206, "lon": 80.4223},
        {"id": "det_l194_2", "image_id": "L-194", "class": "mine", "confidence": 0.52, "lat": 13.0219, "lon": 80.4241},
        {"id": "det_l194_3", "image_id": "L-194", "class": "ghost_net", "confidence": 0.74, "lat": 13.0193, "lon": 80.4207},
        {"id": "det_l199_1", "image_id": "L-199", "class": "crab_pot", "confidence": 0.71, "lat": 12.8915, "lon": 80.3920},
        {"id": "det_l199_2", "image_id": "L-199", "class": "non_mine_object", "confidence": 0.62, "lat": 12.8908, "lon": 80.3928},
        {"id": "det_l193_1", "image_id": "L-193", "class": "shipwreck", "confidence": 0.82, "lat": 12.7000, "lon": 80.4000},
        {"id": "det_l196_1", "image_id": "L-196", "class": "shipwreck", "confidence": 0.64, "lat": 14.0219, "lon": 74.3341},
        {"id": "det_l197_1", "image_id": "L-197", "class": "shipwreck", "confidence": 0.49, "lat": 12.9141, "lon": 74.8241},
    ]
    for d in demo_dets:
        _mem_detections[d["id"]] = {
            "id": d["id"],
            "image_id": d["image_id"],
            "class_name": d["class"],
            "confidence": d["confidence"],
            "lat": d["lat"],
            "lon": d["lon"],
            "created_at": datetime.now(timezone.utc),
        }


def init_db():
    if not HAS_DB:
        _seed_demo_in_memory()
        return
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS annotations (
            id SERIAL PRIMARY KEY,
            image_id TEXT NOT NULL,
            class_id INT NOT NULL,
            class_name TEXT NOT NULL,
            bbox_cx FLOAT NOT NULL,
            bbox_cy FLOAT NOT NULL,
            bbox_w FLOAT NOT NULL,
            bbox_h FLOAT NOT NULL,
            source TEXT NOT NULL,
            original_detection_id TEXT,
            lat FLOAT,
            lon FLOAT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS rejected_annotations (
            id SERIAL PRIMARY KEY,
            image_id TEXT NOT NULL,
            class_id INT NOT NULL,
            class_name TEXT NOT NULL,
            bbox_cx FLOAT NOT NULL,
            bbox_cy FLOAT NOT NULL,
            bbox_w FLOAT NOT NULL,
            bbox_h FLOAT NOT NULL,
            source TEXT NOT NULL,
            original_detection_id TEXT,
            lat FLOAT,
            lon FLOAT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS annotation_images (
            image_id TEXT PRIMARY KEY,
            ext TEXT NOT NULL,
            data BYTEA NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            event_type TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS detections (
            id TEXT PRIMARY KEY,
            image_id TEXT NOT NULL,
            class_name TEXT NOT NULL,
            confidence FLOAT,
            lat FLOAT,
            lon FLOAT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS survey_coverage (
            image_id TEXT PRIMARY KEY,
            lat FLOAT NOT NULL,
            lon FLOAT NOT NULL,
            heading_deg FLOAT,
            swath_width_m FLOAT NOT NULL,
            length_m FLOAT NOT NULL,
            area_km2 FLOAT NOT NULL,
            img_w INT,
            img_h INT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE annotations ADD COLUMN IF NOT EXISTS lat FLOAT;
        ALTER TABLE annotations ADD COLUMN IF NOT EXISTS lon FLOAT;
        ALTER TABLE rejected_annotations ADD COLUMN IF NOT EXISTS lat FLOAT;
        ALTER TABLE rejected_annotations ADD COLUMN IF NOT EXISTS lon FLOAT;
        CREATE INDEX IF NOT EXISTS idx_annotations_image_id ON annotations (image_id);
        CREATE INDEX IF NOT EXISTS idx_detections_image_id ON detections (image_id);
        """)


def _save_row(conn, table: str, a) -> None:
    cx, cy, w, h = a.bbox_normalized
    with conn.cursor() as cur:
        cur.execute(
            f"""
            INSERT INTO {table}
                (image_id, class_id, class_name, bbox_cx, bbox_cy, bbox_w, bbox_h, source,
                 original_detection_id, lat, lon)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (a.image_id, a.class_id, a.class_name, cx, cy, w, h, a.source, a.original_detection_id,
             getattr(a, "lat", None), getattr(a, "lon", None)),
        )


def log_event(event_type: str, metadata: Optional[dict] = None, conn=None) -> None:
    if not HAS_DB:
        _mem_events.append({
            "event_type": event_type,
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc),
        })
        return

    try:
        if conn is not None:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO events (event_type, metadata) VALUES (%s, %s)",
                    (event_type, Json(metadata or {})),
                )
            return
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO events (event_type, metadata) VALUES (%s, %s)",
                (event_type, Json(metadata or {})),
            )
    except Exception as exc:
        print(f"[db] log_event error ({exc})")


def save_annotation_batch(by_image: dict, image_cache: dict) -> tuple:
    saved = 0
    rejected = 0

    if not HAS_DB:
        for image_id, items in by_image.items():
            for a in items:
                cx, cy, w, h = a.bbox_normalized
                row = {
                    "id": len(_mem_annotations) + len(_mem_rejected) + 1,
                    "image_id": a.image_id,
                    "class_id": a.class_id,
                    "class_name": a.class_name,
                    "bbox_cx": cx,
                    "bbox_cy": cy,
                    "bbox_w": w,
                    "bbox_h": h,
                    "source": a.source,
                    "original_detection_id": a.original_detection_id,
                    "lat": getattr(a, "lat", None),
                    "lon": getattr(a, "lon", None),
                    "created_at": datetime.now(timezone.utc),
                }
                if a.rejected:
                    _mem_rejected.append(row)
                    rejected += 1
                else:
                    _mem_annotations.append(row)
                    saved += 1

            cached = image_cache.get(image_id)
            if cached and image_id not in _mem_images:
                raw, ext = cached
                _mem_images[image_id] = (ext, raw)

        log_event("review_save", {"saved": saved, "rejected": rejected, "images": len(by_image)})
        return saved, rejected

    with get_conn() as conn:
        for image_id, items in by_image.items():
            for a in items:
                if a.rejected:
                    _save_row(conn, "rejected_annotations", a)
                    rejected += 1
                else:
                    _save_row(conn, "annotations", a)
                    saved += 1

            cached = image_cache.get(image_id)
            if cached:
                raw, ext = cached
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO annotation_images (image_id, ext, data)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (image_id) DO NOTHING
                        """,
                        (image_id, ext, psycopg2.Binary(raw)),
                    )

    return saved, rejected


def annotated_image_count() -> int:
    if not HAS_DB:
        return len(set(r["image_id"] for r in _mem_annotations))
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT COUNT(DISTINCT image_id) FROM annotations")
        return cur.fetchone()[0]


def iter_export_labels() -> Iterator[tuple]:
    if not HAS_DB:
        by_image: dict = {}
        for r in _mem_annotations:
            line = f"{r['class_id']} {r['bbox_cx']:.6f} {r['bbox_cy']:.6f} {r['bbox_w']:.6f} {r['bbox_h']:.6f}"
            by_image.setdefault(r["image_id"], []).append(line)
        for image_id, lines in by_image.items():
            yield image_id, "\n".join(lines) + "\n"
        return

    with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT image_id, class_id, bbox_cx, bbox_cy, bbox_w, bbox_h FROM annotations ORDER BY image_id, id"
        )
        rows = cur.fetchall()
    by_image = {}
    for r in rows:
        line = f"{r['class_id']} {r['bbox_cx']:.6f} {r['bbox_cy']:.6f} {r['bbox_w']:.6f} {r['bbox_h']:.6f}"
        by_image.setdefault(r["image_id"], []).append(line)
    for image_id, lines in by_image.items():
        yield image_id, "\n".join(lines) + "\n"


def iter_export_images() -> Iterator[tuple]:
    if not HAS_DB:
        for image_id, (ext, data) in _mem_images.items():
            yield image_id, ext, data
        return

    with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT image_id, ext, data FROM annotation_images ORDER BY image_id")
        for r in cur.fetchall():
            yield r["image_id"], r["ext"], bytes(r["data"])


# -- Risk-zone inputs -----------------------------------------------------------

def save_detections_and_coverage(image_id: str, detections: list, coverage: Optional[dict]) -> None:
    if coverage is None:
        return

    if not HAS_DB:
        _mem_coverage[image_id] = {
            "image_id": image_id,
            "lat": coverage["lat"],
            "lon": coverage["lon"],
            "heading_deg": coverage.get("heading_deg"),
            "swath_width_m": coverage["swath_width_m"],
            "length_m": coverage["length_m"],
            "area_km2": coverage["area_km2"],
            "img_w": coverage.get("img_w"),
            "img_h": coverage.get("img_h"),
            "created_at": datetime.now(timezone.utc),
        }
        for d in detections:
            if d.get("lat") is None or d.get("lon") is None:
                continue
            _mem_detections[d["id"]] = {
                "id": d["id"],
                "image_id": image_id,
                "class_name": d["class"],
                "confidence": d["confidence"],
                "lat": d["lat"],
                "lon": d["lon"],
                "created_at": datetime.now(timezone.utc),
            }
        return

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO survey_coverage
                (image_id, lat, lon, heading_deg, swath_width_m, length_m, area_km2, img_w, img_h)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (image_id) DO NOTHING
            """,
            (image_id, coverage["lat"], coverage["lon"], coverage.get("heading_deg"),
             coverage["swath_width_m"], coverage["length_m"], coverage["area_km2"],
             coverage.get("img_w"), coverage.get("img_h")),
        )
        for d in detections:
            if d.get("lat") is None or d.get("lon") is None:
                continue
            cur.execute(
                """
                INSERT INTO detections (id, image_id, class_name, confidence, lat, lon)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
                """,
                (d["id"], image_id, d["class"], d["confidence"], d["lat"], d["lon"]),
            )


def get_coverage(image_id: str) -> Optional[dict]:
    if not HAS_DB:
        return _mem_coverage.get(image_id)
    with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM survey_coverage WHERE image_id = %s", (image_id,))
        return cur.fetchone()


def fetch_risk_inputs() -> tuple:
    if not HAS_DB:
        confirmed_ids = set(r["original_detection_id"] for r in _mem_annotations if r.get("original_detection_id"))
        rejected_ids = set(r["original_detection_id"] for r in _mem_rejected if r.get("original_detection_id"))

        events = []
        for d in _mem_detections.values():
            if d.get("lat") is None or d.get("lon") is None:
                continue
            status = "unreviewed"
            if d["id"] in confirmed_ids:
                status = "confirmed"
            elif d["id"] in rejected_ids:
                status = "rejected"
            events.append({
                "id": d["id"],
                "class_name": d["class_name"],
                "confidence": d["confidence"],
                "lat": d["lat"],
                "lon": d["lon"],
                "created_at": d["created_at"],
                "status": status,
            })

        for a in _mem_annotations:
            if not a.get("original_detection_id") and a.get("lat") is not None and a.get("lon") is not None:
                events.append({
                    "id": f"ann_{a['id']}",
                    "class_name": a["class_name"],
                    "confidence": None,
                    "lat": a["lat"],
                    "lon": a["lon"],
                    "created_at": a["created_at"],
                    "status": "operator",
                })

        coverage = [
            {"lat": c["lat"], "lon": c["lon"], "area_km2": c["area_km2"], "created_at": c["created_at"]}
            for c in _mem_coverage.values()
        ]
        return events, coverage

    with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT d.id, d.class_name, d.confidence, d.lat, d.lon, d.created_at,
                   CASE
                     WHEN EXISTS (SELECT 1 FROM annotations a WHERE a.original_detection_id = d.id) THEN 'confirmed'
                     WHEN EXISTS (SELECT 1 FROM rejected_annotations r WHERE r.original_detection_id = d.id) THEN 'rejected'
                     ELSE 'unreviewed'
                   END AS status
            FROM detections d
            WHERE d.lat IS NOT NULL AND d.lon IS NOT NULL
            UNION ALL
            SELECT 'ann_' || a.id::text, a.class_name, NULL, a.lat, a.lon, a.created_at, 'operator'
            FROM annotations a
            WHERE a.original_detection_id IS NULL AND a.lat IS NOT NULL AND a.lon IS NOT NULL
            """
        )
        events = cur.fetchall()
        cur.execute("SELECT lat, lon, area_km2, created_at FROM survey_coverage")
        coverage = cur.fetchall()
    return events, coverage
