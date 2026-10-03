// Copy for the hosted-demo / mock-data disclosures shown on Upload and
// Review. Kept in one place so the wording can be edited without hunting
// through component files.

export const HOSTED_DEMO_NOTE_PREFIX =
  'Hosted demo note: this demo runs on free-tier hosting with shared CPU, so the first request can take ' +
  'longer (cold start, up to ~1–2 min). Inference measured locally on CPU is ~224 ms per tile. For ' +
  'instant results, see the cached results in'

export const DETECT_LOADING_TEXT =
  'Waking server and running model… this can take up to 1–2 minutes on the free tier.'

export const MOCK_NAV_DATA_NOTICE =
  "Mock data: values here are simulated to demonstrate how the pipeline works. In real surveys, " +
  "navigation and attitude come from the sonar's XTF ping headers and nav logs."

// Pre-seeded demo lines use a short "L-###" id (see src/api/mockData.js);
// anything run live through /detect gets a UUID from the backend instead.
// Used to label Review results that are pre-computed rather than freshly run.
export function isCachedLineId(lineId) {
  return typeof lineId === 'string' && /^L-\d+$/.test(lineId)
}
