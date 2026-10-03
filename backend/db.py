"""
Postgres persistence (Neon) for operator annotations, rejected calls, the
source images they were drawn on, and lightweight usage events.

Replaces the old backend/annotations/ filesystem store — that directory
didn't survive a redeploy on ephemeral-disk hosts (Render/Railway free
tiers), so nothing accumulated across sessions. Every function here is a
short-lived connection per call rather than a pooled client, because
DATABASE_URL_POOLED already points at Neon's own PgBouncer pooler — there's
no need to also pool on the app side for this scale.
"""

import os
from pathlib import Path
from typing import Iterator, Optional

import psycopg2
from psycopg2.extras import Json, RealDictCursor
from dotenv import load_dotenv

# main.py runs from backend/, so the root .env is one directory up.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Pooled URL is the right one for a web app (short-lived connections per
# request); fall back to the direct URL if only that's set.
DATABASE_URL = os.environ.get("DATABASE_URL_POOLED") or os.environ["DATABASE_URL"]


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def init_db():
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
        CREATE INDEX IF NOT EXISTS idx_annotations_image_id ON annotations (image_id);
        """)


def _save_row(conn, table: str, a) -> None:
    cx, cy, w, h = a.bbox_normalized
    with conn.cursor() as cur:
        cur.execute(
            f"""
            INSERT INTO {table}
                (image_id, class_id, class_name, bbox_cx, bbox_cy, bbox_w, bbox_h, source, original_detection_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (a.image_id, a.class_id, a.class_name, cx, cy, w, h, a.source, a.original_detection_id),
        )


def save_annotation(conn, a) -> None:
    _save_row(conn, "annotations", a)


def save_rejected(conn, a) -> None:
    _save_row(conn, "rejected_annotations", a)


def save_annotation_image(conn, image_id: str, ext: str, data: bytes) -> None:
    # Mirrors the old `if not dest.exists(): write` — first save wins,
    # never overwritten by a later one for the same image_id.
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO annotation_images (image_id, ext, data)
            VALUES (%s, %s, %s)
            ON CONFLICT (image_id) DO NOTHING
            """,
            (image_id, ext, psycopg2.Binary(data)),
        )


def log_event(event_type: str, metadata: Optional[dict] = None, conn=None) -> None:
    # Called both standalone (/detect, one-off) and from within an
    # already-open batch (see save_annotation_batch) — reuse the caller's
    # connection when given one instead of always opening a new one.
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


def save_annotation_batch(by_image: dict, image_cache: dict) -> tuple:
    """Saves every annotation/rejection/source-image from one /annotations
    POST over a single connection — the whole point being one network round
    trip to Neon instead of one per row (was ~1-2s each, so a handful of
    boxes on one tile added up to the multi-second save the UI was seeing)."""
    saved = 0
    rejected = 0
    with get_conn() as conn:
        for image_id, items in by_image.items():
            for a in items:
                if a.rejected:
                    save_rejected(conn, a)
                    rejected += 1
                else:
                    save_annotation(conn, a)
                    saved += 1

            cached = image_cache.get(image_id)
            if cached:
                raw, ext = cached
                save_annotation_image(conn, image_id, ext, raw)

        log_event("review_save", {"saved": saved, "rejected": rejected, "images": len(by_image)}, conn=conn)
    return saved, rejected


def annotated_image_count() -> int:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT COUNT(DISTINCT image_id) FROM annotations")
        return cur.fetchone()[0]


def iter_export_labels() -> Iterator[tuple]:
    """Yields (image_id, yolo_label_text) — one row per image with >=1
    confirmed annotation, lines formatted exactly like the old .txt files."""
    with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT image_id, class_id, bbox_cx, bbox_cy, bbox_w, bbox_h FROM annotations ORDER BY image_id, id"
        )
        rows = cur.fetchall()
    by_image: dict = {}
    for r in rows:
        line = f"{r['class_id']} {r['bbox_cx']:.6f} {r['bbox_cy']:.6f} {r['bbox_w']:.6f} {r['bbox_h']:.6f}"
        by_image.setdefault(r["image_id"], []).append(line)
    for image_id, lines in by_image.items():
        yield image_id, "\n".join(lines) + "\n"


def iter_export_images() -> Iterator[tuple]:
    """Yields (image_id, ext, data) for every archived source image."""
    with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT image_id, ext, data FROM annotation_images ORDER BY image_id")
        for r in cur.fetchall():
            yield r["image_id"], r["ext"], bytes(r["data"])
