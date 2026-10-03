FROM python:3.13-slim

# ultralytics pulls in full opencv-python (GUI variant) as a transitive
# dependency even though requirements.txt pins opencv-python-headless — the
# two conflict at install time and leave a cv2 binary that expects X11
# shared libraries a minimal image doesn't have, failing at import with
# "libxcb.so.1: cannot open shared object file". Installing the actual
# system libraries sidesteps that fight regardless of which opencv variant
# pip resolves.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
