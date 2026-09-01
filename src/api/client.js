// -----------------------------------------------------------------------
// Backend integration point.
//
// Every function below currently resolves mock data from ./mockData.js.
// To connect a real backend, replace the body of each function with a
// fetch() call to your API — the return shape is what the rest of the
// app expects, so keep it (or adjust the few call sites that use it).
//
// Example once a backend exists:
//   export async function getSurvey() {
//     const res = await fetch(`${BASE_URL}/survey`)
//     return res.json()
//   }
// -----------------------------------------------------------------------

import { survey, scanLines, detections, sites } from './mockData.js'

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

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
  await delay(200)
  _detections = _detections.map((d) => (d.id === detectionId ? { ...d, status } : d))
  return _detections.find((d) => d.id === detectionId)
}

// Called from the Upload page. In production this should POST the files
// and survey metadata to the backend, which runs the detection pipeline
// and returns (or later pushes) the resulting detections for the new line.
// For now it simulates a short "processing" delay and appends a new,
// still-empty scan line so the UI has something to point at.
export async function runDetectionPipeline({ files, metadata }) {
  await delay(400)
  const newLine = {
    id: `L-${Math.floor(1000 + Math.random() * 8999)}`,
    site: metadata.vessel ? `${metadata.vessel} · new upload` : 'New upload',
    detections: 0,
    topClass: null,
    status: 'queued',
  }
  _scanLines = [newLine, ..._scanLines]
  return { queued: files.length, lineId: newLine.id }
}
