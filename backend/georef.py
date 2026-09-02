"""
georef.py — Dead-reckoning georeferencing for side-scan sonar detections.

Converts a detection's pixel position inside a sonar waterfall image into
real-world latitude/longitude, given the vessel's navigation data at the
time of that ping.

The math:
  1. Pixel column offset -> metric ground range (perpendicular to track)
  2. Ground range + vessel heading -> local easting/northing offset
  3. Vessel position + offset -> absolute lat/lon via UTM projection

Requires: pyproj (for UTM <-> lat/lon), numpy
Install:  pip install pyproj numpy
"""

import math
import numpy as np
from dataclasses import dataclass
from typing import Optional, Tuple

try:
    from pyproj import Transformer, CRS
    HAS_PYPROJ = True
except ImportError:
    HAS_PYPROJ = False


# -- Data structures ---------------------------------------------------------

@dataclass
class VesselNav:
    """Navigation fix for a single ping timestamp."""
    lat: float            # Vessel latitude  (decimal degrees, WGS84)
    lon: float            # Vessel longitude (decimal degrees, WGS84)
    heading_deg: float    # True heading in degrees (0=N, 90=E, clockwise)
    altitude_m: float = 0.0  # Towfish altitude above seabed (meters). 0 = unknown / already corrected.


@dataclass
class PixelDetection:
    """A detection's position inside the sonar image."""
    row: int              # Ping index (vertical axis of waterfall)
    col: int              # Horizontal pixel bin
    image_width_px: int   # Total image width in pixels
    image_height_px: int  # Total image height in pixels (for completeness)


@dataclass
class SonarGeometry:
    """Sonar swath geometry parameters."""
    swath_width_m: float          # Total swath coverage in meters (port + starboard)
    slant_range_corrected: bool = True  # Is the image already ground-range corrected?
    speed_of_sound_mps: float = 1500.0  # Speed of sound in water (m/s)


@dataclass
class GeoResult:
    """Georeferenced output for a single detection."""
    lat: float
    lon: float
    ground_range_m: float         # Perpendicular distance from track (+ = starboard)
    easting_offset_m: float       # Local offset in easting
    northing_offset_m: float      # Local offset in northing
    utm_zone: Optional[int] = None


# -- Core math ----------------------------------------------------------------

def pixel_to_ground_range(
    detection: PixelDetection,
    geometry: SonarGeometry,
    nav: VesselNav
) -> float:
    """
    Convert a pixel column position to metric ground range from the track center.

    The center pixel corresponds to the nadir (directly below the vessel).
    Pixels to the right of center = starboard (positive range).
    Pixels to the left of center  = port (negative range).

    If the image is NOT slant-range corrected, applies the Pythagorean
    correction: Rg = sqrt(Rs^2 - H^2). If it IS already corrected (typical
    for published datasets), this is a simple linear mapping.
    """
    center_px = detection.image_width_px / 2.0
    resolution_m_per_px = geometry.swath_width_m / detection.image_width_px

    # Pixel offset from center (positive = starboard)
    offset_px = detection.col - center_px

    if geometry.slant_range_corrected or nav.altitude_m <= 0:
        # Image is already ground-range corrected -> linear mapping
        ground_range_m = offset_px * resolution_m_per_px
    else:
        # Raw slant-range image -> apply Pythagorean correction
        slant_range_m = abs(offset_px) * resolution_m_per_px
        H = nav.altitude_m

        if slant_range_m <= H:
            # Inside the water column (before first bottom return)
            # This pixel is above the seabed -> return 0
            ground_range_m = 0.0
        else:
            ground_range_m = math.sqrt(slant_range_m**2 - H**2)
            # Preserve port/starboard sign
            if offset_px < 0:
                ground_range_m = -ground_range_m

    return ground_range_m


def ground_range_to_offset(
    ground_range_m: float,
    heading_deg: float
) -> Tuple[float, float]:
    """
    Project a perpendicular ground range into local easting/northing offsets.

    The detection sits perpendicular to the vessel's heading. For a vessel
    heading theta (measured clockwise from North):
      - Starboard direction = heading + 90 deg
      - The offset vector is: (Rg * sin(theta + 90), Rg * cos(theta + 90))
        ...which simplifies to the ENU form used below.

    In navigation convention (theta clockwise from North), the starboard
    unit vector in (Easting, Northing) coordinates is:
      E_offset = Rg * cos(theta)
      N_offset = Rg * (-sin(theta))

    Verify: heading=0 (North), starboard -> East (+E, 0N)
            heading=90 (East), starboard -> South (0E, -N)
    """
    heading_rad = math.radians(heading_deg)

    easting_offset = ground_range_m * math.cos(heading_rad)
    northing_offset = ground_range_m * (-math.sin(heading_rad))

    return easting_offset, northing_offset


def get_utm_zone(lon: float) -> int:
    """Determine the UTM zone number from a longitude."""
    return int((lon + 180) / 6) + 1


def latlon_to_utm(lat: float, lon: float) -> Tuple[float, float, int]:
    """Convert lat/lon (WGS84) to UTM easting/northing."""
    if not HAS_PYPROJ:
        raise ImportError("pyproj is required for UTM conversion. pip install pyproj")

    zone = get_utm_zone(lon)
    hemisphere = "north" if lat >= 0 else "south"
    utm_crs = CRS(f"+proj=utm +zone={zone} +{hemisphere} +datum=WGS84")
    transformer = Transformer.from_crs("EPSG:4326", utm_crs, always_xy=True)
    easting, northing = transformer.transform(lon, lat)
    return easting, northing, zone


def utm_to_latlon(easting: float, northing: float, zone: int, northern: bool = True) -> Tuple[float, float]:
    """Convert UTM easting/northing back to lat/lon (WGS84)."""
    if not HAS_PYPROJ:
        raise ImportError("pyproj is required for UTM conversion. pip install pyproj")

    hemisphere = "north" if northern else "south"
    utm_crs = CRS(f"+proj=utm +zone={zone} +{hemisphere} +datum=WGS84")
    transformer = Transformer.from_crs(utm_crs, "EPSG:4326", always_xy=True)
    lon, lat = transformer.transform(easting, northing)
    return lat, lon


# -- Main entry point -----------------------------------------------------------

def georeference_detection(
    detection: PixelDetection,
    nav: VesselNav,
    geometry: SonarGeometry
) -> GeoResult:
    """
    Full pipeline: pixel coordinates -> lat/lon.

    Steps:
      1. Pixel col -> metric ground range from track center
      2. Ground range + vessel heading -> easting/northing offset
      3. Vessel lat/lon -> UTM, add offset, convert back to lat/lon

    Args:
        detection: Pixel position of the detection in the sonar image
        nav: Vessel navigation data at the time of this ping
        geometry: Sonar swath configuration

    Returns:
        GeoResult with lat, lon, and intermediate values
    """
    # Step 1: pixel -> ground range
    ground_range_m = pixel_to_ground_range(detection, geometry, nav)

    # Step 2: ground range -> local metric offset
    easting_offset, northing_offset = ground_range_to_offset(
        ground_range_m, nav.heading_deg
    )

    # Step 3: apply offset to vessel position
    if HAS_PYPROJ:
        # Proper UTM projection (accurate)
        vessel_e, vessel_n, zone = latlon_to_utm(nav.lat, nav.lon)
        target_e = vessel_e + easting_offset
        target_n = vessel_n + northing_offset
        target_lat, target_lon = utm_to_latlon(
            target_e, target_n, zone, northern=(nav.lat >= 0)
        )
    else:
        # Fallback: approximate conversion (good enough for demo)
        # 1 degree lat ~= 111,320 m, 1 degree lon ~= 111,320 * cos(lat) m
        lat_offset = northing_offset / 111320.0
        lon_offset = easting_offset / (111320.0 * math.cos(math.radians(nav.lat)))
        target_lat = nav.lat + lat_offset
        target_lon = nav.lon + lon_offset
        zone = None

    return GeoResult(
        lat=round(target_lat, 7),
        lon=round(target_lon, 7),
        ground_range_m=round(ground_range_m, 2),
        easting_offset_m=round(easting_offset, 2),
        northing_offset_m=round(northing_offset, 2),
        utm_zone=zone
    )


# -- Batch processing -------------------------------------------------------------

def georeference_detections_batch(
    detections: list,
    nav: VesselNav,
    geometry: SonarGeometry
) -> list:
    """
    Georeference multiple detections from the same image/ping.
    All share the same vessel nav fix.
    """
    return [georeference_detection(d, nav, geometry) for d in detections]


# -- Integration helper for the FastAPI backend --------------------------------

def georeference_yolo_bbox(
    bbox_xyxy: list,
    image_width: int,
    image_height: int,
    nav: VesselNav,
    geometry: SonarGeometry
) -> Tuple[Optional[float], Optional[float]]:
    """
    Convenience function: takes a YOLO bbox [x1, y1, x2, y2] in pixels,
    computes the center, and returns (lat, lon) for that center point.

    Returns (None, None) if nav data is missing or invalid.
    """
    if nav is None or nav.lat == 0.0 and nav.lon == 0.0:
        return None, None

    cx = (bbox_xyxy[0] + bbox_xyxy[2]) / 2.0
    cy = (bbox_xyxy[1] + bbox_xyxy[3]) / 2.0

    det = PixelDetection(
        row=int(cy),
        col=int(cx),
        image_width_px=image_width,
        image_height_px=image_height
    )

    result = georeference_detection(det, nav, geometry)
    return result.lat, result.lon


# -- Demo / self-test -------------------------------------------------------------

if __name__ == "__main__":
    print("=== Georeferencing Module - Self-Test ===\n")

    # Simulated scenario:
    # Vessel is off the coast of Chennai, heading East (90 deg)
    # Sonar swath is 100m wide, image is 1024 pixels across
    # Detection is at pixel column 768 (starboard side, 3/4 across)

    nav = VesselNav(
        lat=13.0827,       # Chennai coast
        lon=80.2707,
        heading_deg=90.0,  # Heading East
        altitude_m=0.0     # Already corrected image
    )

    geometry = SonarGeometry(
        swath_width_m=100.0,
        slant_range_corrected=True
    )

    detection = PixelDetection(
        row=500,
        col=768,            # Right of center -> starboard
        image_width_px=1024,
        image_height_px=2048
    )

    result = georeference_detection(detection, nav, geometry)

    print(f"Vessel position:   {nav.lat} N, {nav.lon} E")
    print(f"Vessel heading:    {nav.heading_deg} deg (East)")
    print(f"Detection pixel:   col={detection.col} / {detection.image_width_px}")
    print(f"Ground range:      {result.ground_range_m} m (+ = starboard)")
    print(f"Offset:            E={result.easting_offset_m}m, N={result.northing_offset_m}m")
    print(f"Target position:   {result.lat} N, {result.lon} E")
    if result.utm_zone:
        print(f"UTM zone:          {result.utm_zone}")

    # Sanity check: heading East (90 deg), starboard detection should be SOUTH
    # (perpendicular right of eastward heading = southward)
    if result.northing_offset_m < 0 and result.easting_offset_m < 1:
        print("\nOK: direction check passed - starboard of eastward heading -> southward offset")
    else:
        print("\nFAIL: direction check - review the trig")

    print("\n--- Batch test: 3 detections across swath ---")
    test_cols = [256, 512, 768]  # port, center, starboard
    for col in test_cols:
        d = PixelDetection(row=500, col=col, image_width_px=1024, image_height_px=2048)
        r = georeference_detection(d, nav, geometry)
        side = "PORT" if r.ground_range_m < 0 else ("CENTER" if abs(r.ground_range_m) < 0.1 else "STBD")
        print(f"  col={col:4d}  range={r.ground_range_m:+7.1f}m  [{side:6s}]  -> ({r.lat}, {r.lon})")
