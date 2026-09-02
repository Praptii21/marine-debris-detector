// -----------------------------------------------------------------------
// Backend integration point.
//
// getSurvey / getScanLines / getDetections / getSites / updateDetectionStatus
// still resolve from the in-memory mock/session cache below — the backend
// (see backend/main.py) has no "list past runs" endpoint, only POST /detect
// for a single image, so a scan line's detections live client-side from the
// moment they're returned until the tab closes. runDetectionPipeline,
// submitAnnotations, exportAnnotations and getHealth all talk to the real
// FastAPI backend.
// -----------------------------------------------------------------------

import { survey, scanLines, detections, sites } from './mockData.js'
import { classLabel, classifyConfidence } from '../utils/taxonomy.js'

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let _detections = [...detections]
let _scanLines = [...scanLines]

export async function getSurvey() {
  await delay(120)
  return survey
}

export async function getScanLines() {
  await delay(150)
  return _scanLines
}

export async function getDetections(lineId) {
  await delay(150)
  return lineId ? _detections.filter((d) => d.lineId === lineId) : _detections
}

export async function getSites() {
  await delay(120)
  return sites
}

export async function updateDetectionStatus(detectionId, status) {
  _detections = _detections.map((d) => (d.id === detectionId ? { ...d, status } : d))
  return _detections.find((d) => d.id === detectionId)
}

function parseLatLon(str) {
  if (!str) return null
  const parts = str.split(',').map((s) => parseFloat(s.trim()))
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null
  return { lat: parts[0], lon: parts[1] }
}

// Vessel heading isn't a field on the Upload form — it's derived from the
// start -> end track vector so the operator doesn't have to enter it by hand.
function bearingDeg(from, to) {
  const toRad = (d) => (d * Math.PI) / 180
  const toDeg = (r) => (r * 180) / Math.PI
  const phi1 = toRad(from.lat)
  const phi2 = toRad(to.lat)
  const dLambda = toRad(to.lon - from.lon)
  const y = Math.sin(dLambda) * Math.cos(phi2)
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

function mapBackendDetection(raw, lineId, site) {
  return {
    id: raw.id,
    lineId,
    site,
    class: raw.class,
    confidence: raw.confidence,
    model: raw.model,
    source: 'model',
    status: classifyConfidence(raw.confidence ?? 0, raw.class),
    location: raw.lat != null && raw.lon != null ? { lat: raw.lat, lon: raw.lon } : null,
    boundingBoxM: null,
    areaM2: null,
    acousticShadowM: null,
    slantRangeM: null,
    bboxPct: raw.bbox_pct,
    bboxPx: raw.bbox_px,
    timestamp: new Date().toISOString(),
  }
}

// Called from the Upload page. POSTs each file to the backend's /detect
// endpoint (all three models run server-side, already NMS-merged), caches
// the resulting detections and a blob URL for the image, and returns
// { queued, lineId } so the UI can jump to the new line's Review screen.
export async function runDetectionPipeline({ files, metadata }) {
  const start = parseLatLon(metadata.startCoords)
  const end = parseLatLon(metadata.endCoords)
  const navMeta = start
    ? { lat: start.lat, lon: start.lon, heading_deg: end ? bearingDeg(start, end) : 0 }
    : null

  const results = []
  for (const f of files) {
    const form = new FormData()
    form.append('file', f.file)
    form.append(
      'metadata',
      JSON.stringify({
        survey_id: metadata.surveyId || null,
        lat: navMeta?.lat ?? null,
        lon: navMeta?.lon ?? null,
        heading_deg: navMeta?.heading_deg ?? null,
      })
    )

    const res = await fetch(`${BASE_URL}/detect`, { method: 'POST', body: form })
    if (!res.ok) {
      throw new Error(`Detection failed for ${f.name}: ${res.status} ${res.statusText}`)
    }
    const data = await res.json()

    const lineId = data.image_id
    const site = metadata.vessel ? `${metadata.vessel} · new upload` : 'New upload'
    const imageSrc = URL.createObjectURL(f.file)

    const lineDetections = data.detections.map((d) => mapBackendDetection(d, lineId, site))
    _detections = [...lineDetections, ..._detections]

    const top = [...lineDetections].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0]
    const newLine = {
      id: lineId,
      site,
      imageSrc,
      detections: lineDetections.length,
      topClass: top ? classLabel(top.class) : null,
      status: lineDetections.length ? 'unreviewed' : 'cleared',
    }
    _scanLines = [newLine, ..._scanLines]
    results.push({ lineId, count: lineDetections.length })
  }

  return { queued: files.length, lineId: results[0]?.lineId }
}

// Submits operator annotations (drawn boxes + confirmed/rejected model
// detections) for one image, gathered by the Review page's annotation tool.
export async function submitAnnotations(annotations) {
  if (!annotations.length) return { saved: 0, images: 0 }
  const res = await fetch(`${BASE_URL}/annotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(annotations),
  })
  if (!res.ok) {
    throw new Error(`Failed to save annotations: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// Fetches the YOLO-format training export and triggers a browser download.
export async function exportAnnotations() {
  const res = await fetch(`${BASE_URL}/annotations/export`)
  if (!res.ok) {
    throw new Error(`Failed to export training data: ${res.status} ${res.statusText}`)
  }
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match ? match[1] : 'training-export.zip'

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Model load status + counters for the Overview dashboard.
export async function getHealth() {
  const res = await fetch(`${BASE_URL}/health`)
  if (!res.ok) {
    throw new Error(`Failed to fetch health: ${res.status} ${res.statusText}`)
  }
  return res.json()
}
