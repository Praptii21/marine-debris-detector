// Confidence distribution for the most recent detection run — three
// reserved status bands (good/warning/critical), each a directly-labeled
// horizontal bar so the count is never hidden behind a hover.
const BANDS = [
  { key: 'high', label: 'High confidence (≥ 0.7)', test: (c) => c >= 0.7, color: 'var(--sage)' },
  { key: 'medium', label: 'Medium (0.5–0.7)', test: (c) => c >= 0.5 && c < 0.7, color: 'var(--amber)' },
  { key: 'low', label: 'Low — needs review (< 0.5)', test: (c) => c < 0.5, color: 'var(--coral)' },
]

export default function ConfidenceChart({ detections = [] }) {
  const scored = detections.filter((d) => typeof d.confidence === 'number')
  const counts = BANDS.map((b) => scored.filter((d) => b.test(d.confidence)).length)
  const max = Math.max(1, ...counts)

  return (
    <div className="card">
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 16 }}>Confidence distribution</h3>
      </div>
      <div style={{ padding: '16px 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {BANDS.map((b, i) => (
          <div key={b.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-dim)', marginBottom: 6 }}>
              <span>{b.label}</span>
              <span className="mono" style={{ color: 'var(--ink-faint)' }}>{counts[i]}</span>
            </div>
            <div style={{ height: 8, background: 'var(--ocean-tint)', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(counts[i] / max) * 100}%`,
                  height: '100%',
                  background: b.color,
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        ))}
        {scored.length === 0 && (
          <div style={{ color: 'var(--ink-faint)', fontSize: 12.5 }}>No scored detections yet.</div>
        )}
      </div>
    </div>
  )
}
