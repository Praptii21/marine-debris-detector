import time
import requests
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"

def test_detect_endpoint():
    url = f"{BASE_URL}/detect"
    sample_file = Path("public/samples/sss-crabpot1.jpg")
    assert sample_file.exists(), "Sample file does not exist"

    with open(sample_file, "rb") as f:
        file_bytes = f.read()

    # Send POST /detect
    t0 = time.perf_counter()
    res = requests.post(url, files={"file": ("sss-crabpot1.jpg", file_bytes, "image/jpeg")})
    elapsed_ms = (time.perf_counter() - t0) * 1000

    print(f"POST /detect status: {res.status_code}")
    print(f"Network round-trip latency: {elapsed_ms:.2f}ms")

    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()

    print(f"image_id: {data.get('image_id')}")
    print(f"processing_time_ms: {data.get('processing_time_ms')}ms")
    print(f"Detections count: {len(data.get('detections', []))}")
    print(f"Quality status: {data.get('quality', {}).get('status')}")

    assert "detections" in data, "Missing detections in response"
    assert "quality" in data, "Missing quality block in response"
    assert data["quality"].get("status") in ("PASS", "WARNING", "DEGRADED")
    assert len(data["detections"]) > 0, "Expected at least 1 detection for sss-crabpot1.jpg"

    # Verify annotation workflow works with cached image_id
    image_id = data["image_id"]
    ann_url = f"{BASE_URL}/annotations"
    ann_payload = [
        {
            "image_id": image_id,
            "bbox_normalized": [0.4, 0.4, 0.2, 0.2],
            "class_id": 0,
            "class_name": "crab_pot",
            "source": "operator_correction",
            "rejected": False,
        }
    ]
    ann_res = requests.post(ann_url, json=ann_payload)
    print(f"POST /annotations status: {ann_res.status_code}, response: {ann_res.json()}")
    assert ann_res.status_code == 200, f"Annotation save failed: {ann_res.text}"

def test_extract_metadata_endpoint():
    url = f"{BASE_URL}/extract-metadata"
    sample_file = Path("public/samples/sss-crabpot1.jpg")
    with open(sample_file, "rb") as f:
        file_bytes = f.read()

    t0 = time.perf_counter()
    res = requests.post(url, files={"file": ("sss-crabpot1.jpg", file_bytes, "image/jpeg")})
    elapsed_ms = (time.perf_counter() - t0) * 1000

    print(f"\nPOST /extract-metadata status: {res.status_code}")
    print(f"Latency: {elapsed_ms:.2f}ms")
    assert res.status_code == 200
    meta = res.json()
    print(f"Extracted metadata: {meta}")
    assert meta.get("depth_m") == 36.8
    assert meta.get("heading_deg") == 95.0
    assert "13.0815" in (meta.get("start_coords") or "")

if __name__ == "__main__":
    print("Testing Edge-Replay Ingestion Cache...")
    test_detect_endpoint()
    test_extract_metadata_endpoint()
    print("\nALL EDGE-REPLAY CACHE CHECKS PASSED SUCCESSFULLY!")
