"""Sanity tests for risk.py. Run:  cd backend && python test_risk.py"""

from datetime import datetime, timedelta, timezone

from risk import compute_risk_zones, level_for

NOW = datetime(2026, 1, 1, tzinfo=timezone.utc)
LAT, LON = 13.08, 80.27
PRIORS = [{"lat": LAT, "lng": LON, "intensity": 0.8}]


def ev(i, cls, status="confirmed", conf=0.9, lat=LAT, lon=LON, age=0):
    return {"id": str(i), "class_name": cls, "confidence": conf, "lat": lat, "lon": lon,
            "status": status, "created_at": NOW - timedelta(days=age)}


def cov(area, lat=LAT, lon=LON):
    return {"lat": lat, "lon": lon, "area_km2": area, "created_at": NOW}


def props(fc, i=0):
    return fc["features"][i]["properties"]


def run(events, coverage, **kw):
    return compute_risk_zones(events, coverage, PRIORS, now=NOW, **kw)


# 1. Normalised by surveyed area: same count, 10x less area => higher density.
small = props(run([ev(i, "crab_pot") for i in range(5)], [cov(0.5)]))
large = props(run([ev(i, "crab_pot") for i in range(5)], [cov(5.0)]))
assert small["components"]["density"] > large["components"]["density"], (small, large)

# 2. Severity beats volume: one mine outranks several crab pots.
mine = props(run([ev(0, "mine")], [cov(1.0)]))
pots = props(run([ev(i, "crab_pot") for i in range(3)], [cov(1.0)]))
assert mine["components"]["severity"] > pots["components"]["severity"]

# 3. Rejected detections don't count; unreviewed count less than confirmed.
rej = run([ev(0, "mine", status="rejected")], [cov(1.0)])
assert props(rej)["detections"] == 0
conf = props(run([ev(0, "ghost_net", "confirmed")], [cov(1.0)]))["components"]["density"]
unrev = props(run([ev(0, "ghost_net", "unreviewed", conf=0.6)], [cov(1.0)]))["components"]["density"]
assert unrev < conf

# 4. Recency decay: an old contact weighs less.
fresh = props(run([ev(0, "ghost_net", age=0)], [cov(1.0)]))["components"]["density"]
old = props(run([ev(0, "ghost_net", age=365)], [cov(1.0)]))["components"]["density"]
assert old < fresh

# 5. Unsurveyed => not emitted (unknown, not safe). Events with no coverage ignored.
assert run([ev(0, "mine")], [])["features"] == []

# 6. A surveyed-but-clean cell is emitted with zero detections and a low score.
clean = props(run([], [cov(1.0)], ))
assert clean["detections"] == 0 and clean["components"]["severity"] == 0

# 7. Smoothing: one hit in a 0.02 km^2 cell is a raw 45/km^2; shrinkage must
#    pull its rate toward the global rate (~10/km^2), not report 45.
import math
fc = run(
    [ev(i, "crab_pot") for i in range(20)] + [ev(99, "crab_pot", lat=LAT + 0.5)],
    [cov(2.0), cov(0.02, lat=LAT + 0.5)],
)
by_area = {f["properties"]["area_km2"]: f["properties"]["components"]["density"] for f in fc["features"]}
raw_norm = 1 - math.exp(-(0.9 / 0.02) / 5.0)  # density_norm if unsmoothed
assert by_area[0.02] < raw_norm - 0.05, (by_area, raw_norm)

# 8. Hazard lenses filter classes.
mixed = [ev(0, "mine"), ev(1, "ghost_net")]
assert props(run(mixed, [cov(1.0)], hazard="navigation"))["by_class"] == {"mine": 1}
assert props(run(mixed, [cov(1.0)], hazard="ecological"))["by_class"] == {"ghost_net": 1}

# 9. Explanations + confidence are populated; levels map sensibly.
p = props(run([ev(0, "mine")], [cov(1.0)]))
assert p["reasons"] and p["data_confidence"] in {"low", "medium", "high"}
assert level_for(0.9) == "Critical" and level_for(0.1) == "Low"

print("all risk tests passed")
