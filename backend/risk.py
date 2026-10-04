"""
risk.py — data-driven, explainable debris/hazard risk zones.

Replaces "hand-drawn static zones" with a score computed from what surveys
actually found, per *surveyed area* (not per area overall), with the old
port/fishing/shipping reference layer demoted to a prior.

Pipeline (see docs/RISK_ZONES.md for the full write-up):

  1. Bin detections and survey footprints into a ~1 km grid.
  2. Weight every detection: review status x confidence x recency decay.
  3. density  = Bayesian-smoothed weighted count / surveyed km^2
     severity = worst class present (mine > ghost net > wreck > ...)
     prior    = proximity to the static reference zones (soft Gaussian)
  4. risk = W_DENSITY*density_norm + W_SEVERITY*severity + W_PRIOR*prior
  5. Attach a human-readable "why" and a data-confidence rating.

Everything here is pure Python (no DB, no web framework): `compute_risk_zones`
takes plain dicts and returns a GeoJSON FeatureCollection.
"""

import math
from datetime import datetime, timezone
from typing import Dict, Iterable, List, Optional

KM_PER_DEG_LAT = 111.32

# -- Tunables ---------------------------------------------------------------

# How bad is it to find one of these? 0..1. A single mine outranks many pots.
CLASS_SEVERITY: Dict[str, float] = {
    "mine": 1.0,
    "human_in_water": 1.0,
    "ghost_net": 0.8,
    "shipwreck": 0.6,
    "airplane": 0.6,
    "crab_pot": 0.4,
    "unknown_debris": 0.35,
    "non_mine_object": 0.15,
}

# Separate lenses instead of one blended score.
HAZARD_CLASSES: Dict[str, Optional[set]] = {
    "all": None,  # no filter
    "navigation": {"mine", "shipwreck", "airplane", "human_in_water", "non_mine_object"},
    "ecological": {"ghost_net", "crab_pot", "unknown_debris"},
}

W_DENSITY = 0.45
W_SEVERITY = 0.30
W_PRIOR = 0.25

UNREVIEWED_FACTOR = 0.7   # an unreviewed model hit counts as confidence * 0.7
RECENCY_HALF_LIFE_DAYS = 90.0
DENSITY_SCALE = 5.0       # detections/km^2 at which density_norm ~= 0.63
PRIOR_STRENGTH_KM2 = 0.5  # pseudo-surveyed area behind the Bayesian prior
PRIOR_SIGMA_KM = 30.0     # reach of the static reference zones
AREA_REF_KM2 = 0.25       # surveyed area at which confidence ~= 63%

LEVELS = [(0.65, "Critical"), (0.50, "High"), (0.30, "Moderate"), (0.0, "Low")]


def level_for(score: float) -> str:
    for threshold, name in LEVELS:
        if score >= threshold:
            return name
    return "Low"


# -- Grid ---------------------------------------------------------------------

def _cell_of(lat: float, lon: float, cell_km: float):
    """Near-square cell id: latitude bands of fixed height, longitude width
    corrected for the band's centre latitude."""
    dlat = cell_km / KM_PER_DEG_LAT
    row = math.floor(lat / dlat)
    lat_c = (row + 0.5) * dlat
    dlon = cell_km / (KM_PER_DEG_LAT * max(0.1, math.cos(math.radians(lat_c))))
    col = math.floor(lon / dlon)
    return row, col, dlat, dlon


def _cell_polygon(row: int, col: int, dlat: float, dlon: float) -> list:
    s, n = row * dlat, (row + 1) * dlat
    w, e = col * dlon, (col + 1) * dlon
    return [[[w, s], [e, s], [e, n], [w, n], [w, s]]]


def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


# -- Components ------------------------------------------------------------------

def prior_score(lat: float, lon: float, priors: Iterable[dict]) -> float:
    """Soft proximity to the static reference zones (port, fishing, shipping,
    river outflow...). Max over zones of intensity * Gaussian falloff."""
    best = 0.0
    for z in priors:
        d = _haversine_km(lat, lon, z["lat"], z["lng"])
        best = max(best, float(z.get("intensity", 0.0)) * math.exp(-((d / PRIOR_SIGMA_KM) ** 2)))
    return best


def event_weight(ev: dict, now: datetime) -> float:
    """Review status x confidence x recency. Rejected = 0."""
    status = ev.get("status", "unreviewed")
    if status == "rejected":
        return 0.0
    if status in ("confirmed", "operator"):
        base = 1.0  # a human vouched for it, confidence no longer matters
    else:
        base = float(ev.get("confidence") or 0.0) * UNREVIEWED_FACTOR
    ts = ev.get("created_at")
    if isinstance(ts, datetime):
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        age_days = max(0.0, (now - ts).total_seconds() / 86400.0)
        base *= 0.5 ** (age_days / RECENCY_HALF_LIFE_DAYS)
    return base


def _confidence_label(area_km2: float, n_events: int) -> str:
    cov = 1 - math.exp(-area_km2 / AREA_REF_KM2)
    if cov >= 0.75 and n_events >= 3:
        return "high"
    if cov >= 0.4:
        return "medium"
    return "low"


# -- Main ----------------------------------------------------------------------------

def compute_risk_zones(
    events: List[dict],
    coverage: List[dict],
    priors: List[dict],
    cell_km: float = 1.0,
    hazard: str = "all",
    now: Optional[datetime] = None,
) -> dict:
    """
    events:   {id, class_name, confidence, lat, lon, status, created_at}
              status in confirmed | operator | unreviewed | rejected
    coverage: {lat, lon, area_km2, created_at}   (one per surveyed line)
    priors:   [{lat, lng, intensity, ...}]  static reference zones
    Returns a GeoJSON FeatureCollection; only surveyed cells are emitted
    (unsurveyed = unknown, never "safe").
    """
    now = now or datetime.now(timezone.utc)
    allowed = HAZARD_CLASSES.get(hazard)
    cells: Dict[tuple, dict] = {}

    def cell(lat, lon):
        row, col, dlat, dlon = _cell_of(lat, lon, cell_km)
        key = (row, col)
        if key not in cells:
            cells[key] = {
                "row": row, "col": col, "dlat": dlat, "dlon": dlon,
                "area_km2": 0.0, "lines": 0, "last_survey": None,
                "events": [], "w_sum": 0.0, "by_class": {},
            }
        return cells[key]

    for c in coverage:
        if c.get("lat") is None or c.get("lon") is None:
            continue
        cc = cell(c["lat"], c["lon"])
        cc["area_km2"] += float(c.get("area_km2") or 0.0)
        cc["lines"] += 1
        ts = c.get("created_at")
        if isinstance(ts, datetime) and (cc["last_survey"] is None or ts > cc["last_survey"]):
            cc["last_survey"] = ts

    for ev in events:
        if ev.get("lat") is None or ev.get("lon") is None:
            continue
        cls = ev["class_name"]
        if allowed is not None and cls not in allowed:
            continue
        w = event_weight(ev, now)
        if w <= 0:
            continue
        cc = cell(ev["lat"], ev["lon"])
        cc["events"].append((cls, w, ev.get("status")))
        cc["w_sum"] += w
        cc["by_class"][cls] = cc["by_class"].get(cls, 0) + 1

    # Only cells we actually surveyed can claim a density. Events landing in
    # a cell with no recorded coverage are kept out (area would be 0).
    surveyed = {k: v for k, v in cells.items() if v["area_km2"] > 0}

    total_area = sum(v["area_km2"] for v in surveyed.values())
    total_w = sum(v["w_sum"] for v in surveyed.values())
    global_rate = (total_w / total_area) if total_area > 0 else 0.0

    features = []
    for (row, col), v in surveyed.items():
        lat_c = (row + 0.5) * v["dlat"]
        lon_c = (col + 0.5) * v["dlon"]

        # Gamma-Poisson shrinkage: sparse cells pull toward the global rate
        # instead of one hit in 0.1 km^2 reading as a hotspot.
        a = global_rate * PRIOR_STRENGTH_KM2
        rate = (v["w_sum"] + a) / (v["area_km2"] + PRIOR_STRENGTH_KM2)
        density_norm = 1 - math.exp(-rate / DENSITY_SCALE)

        severity = max((CLASS_SEVERITY.get(cls, 0.3) * min(1.0, w) for cls, w, _ in v["events"]), default=0.0)
        prior = prior_score(lat_c, lon_c, priors)

        score = W_DENSITY * density_norm + W_SEVERITY * severity + W_PRIOR * prior
        score = round(min(1.0, score), 3)
        n = len(v["events"])
        raw_density = v["w_sum"] / v["area_km2"]

        top = sorted(v["by_class"].items(), key=lambda kv: -kv[1])
        mix = ", ".join(f"{cnt}× {cls.replace('_', ' ')}" for cls, cnt in top[:4]) or "no detections"
        reasons = [
            f"{n} detection{'s' if n != 1 else ''} over {v['area_km2']:.2f} km² surveyed "
            f"({raw_density:.1f}/km² weighted) — {mix}",
        ]
        if severity >= 0.8:
            reasons.append("Contains high-severity contact (mine / ghost net / person in water)")
        if prior >= 0.4:
            reasons.append(f"Near known accumulation / traffic zone (prior {prior:.2f})")
        if v["last_survey"]:
            reasons.append(f"Last surveyed {v['last_survey'].date().isoformat()}")

        features.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": _cell_polygon(row, col, v["dlat"], v["dlon"])},
            "properties": {
                "cell_id": f"{row}_{col}",
                "center": {"lat": round(lat_c, 5), "lon": round(lon_c, 5)},
                "risk": score,
                "level": level_for(score),
                "components": {
                    "density": round(density_norm, 3),
                    "severity": round(severity, 3),
                    "prior": round(prior, 3),
                },
                "weights": {"density": W_DENSITY, "severity": W_SEVERITY, "prior": W_PRIOR},
                "detections": n,
                "by_class": v["by_class"],
                "area_km2": round(v["area_km2"], 3),
                "survey_lines": v["lines"],
                "last_survey": v["last_survey"].isoformat() if v["last_survey"] else None,
                "data_confidence": _confidence_label(v["area_km2"], n),
                "reasons": reasons,
            },
        })

    features.sort(key=lambda f: -f["properties"]["risk"])
    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "hazard": hazard,
            "cell_km": cell_km,
            "surveyed_cells": len(features),
            "total_surveyed_km2": round(total_area, 3),
            "global_rate_per_km2": round(global_rate, 3),
        },
    }
