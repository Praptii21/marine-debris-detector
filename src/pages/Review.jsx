import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getScanLines, getDetections, updateDetectionStatus } from '../api/client.js'
import SonarCanvas from '../components/SonarCanvas.jsx'
import { PLACEHOLDER_SCENES } from '../utils/sonarRender.js'

export default function Review() {
  const { lineId: routeLineId } = useParams()
  const navigate = useNavigate()
  const [lines, setLines] = useState([])
  const [detections, setDetections] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const lineId = routeLineId || lines[0]?.id

  useEffect(() => {
    getScanLines().then((ls) => {
      setLines(ls)
      if (!routeLineId && ls[0]) navigate(`/review/${ls[0].id}`, { replace: true })
    })
  }, [routeLineId, navigate])

  useEffect(() => {
    if (!lineId) return
    getDetections(lineId).then((d) => {
      setDetections(d)
      setSelectedId(d[0]?.id ?? null)
    })
  }, [lineId])

  const line = lines.find((l) => l.id === lineId)
  const selected = detections.find((d) => d.id === selectedId)
  const scene = useMemo(() => PLACEHOLDER_SCENES[lineId] || { seed: 1, nadir: 'center', objects: [] }, [lineId])

  const setStatus = async (detectionId, status) => {
    setDetections((prev) => prev.map((d) => (d.id === detectionId ? { ...d, status } : d)))
    await updateDetectionStatus(detectionId, status)
  }

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ocean)', fontWeight: 600, marginBottom: 8 }}>
          Line {lineId || '—'} {line ? `· ${line.site}` : ''}
        </div>
        <h1 style={{ fontSize: 28 }}>Detection results</h1>
        <p style={{ color: 'var(--ink-dim)', marginTop: 8, maxWidth: '70ch' }}>
          Bounding boxes from the active detection pass, ranked by confidence. Analyst decisions below override
          the model's call on export.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border-strong)', background: '#04121a' }}>
          <div style={{ position: 'relative', paddingTop: '62%' }}>
            <div style={{ position: 'absolute', inset: 0 }}>
              <SonarCanvas scene={scene} />
              {detections.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  style={{
                    position: 'absolute',
                    top: `${d.bboxPct.top * 100}%`,
                    left: `${d.bboxPct.left * 100}%`,
                    width: `${d.bboxPct.width * 100}%`,
                    height: `${d.bboxPct.height * 100}%`,
                    border: `1.5px solid ${d.id === selectedId ? '#6fe3d1' : 'rgba(111,227,209,0.55)'}`,
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      position: 'absolute',
                      top: -21,
                      left: -1.5,
                      background: d.id === selectedId ? '#6fe3d1' : 'rgba(111,227,209,0.85)',
                      color: '#04211f',
                      fontSize: 10.5,
                      fontWeight: 600,
                      padding: '2px 6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {d.class.toUpperCase()} · {d.confidence.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16 }}>Detections</h3>
            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{detections.length} object{detections.length === 1 ? '' : 's'}</span>
          </div>
          {detections.length === 0 && (
            <div style={{ padding: '18px', color: 'var(--ink-faint)', fontSize: 13 }}>No detections on this line.</div>
          )}
          {detections.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                background: d.id === selectedId ? 'var(--ocean-tint)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{d.class}</span>
                <span className="mono" style={{ color: d.confidence > 0.7 ? 'var(--ocean)' : 'var(--amber)' }}>
                  {d.confidence.toFixed(2)}
                </span>
              </div>
              <div style={{ height: 4, background: 'var(--ocean-tint)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: `${d.confidence * 100}%`, height: '100%', background: d.confidence > 0.7 ? 'var(--ocean)' : 'var(--amber)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 11.5, color: 'var(--ink-faint)' }}>
                <div>
                  Acoustic shadow
                  <div className="mono" style={{ color: 'var(--ink-dim)' }}>{d.acousticShadowM} m</div>
                </div>
                <div>
                  Est. area
                  <div className="mono" style={{ color: 'var(--ink-dim)' }}>{d.areaM2} m²</div>
                </div>
                <div>
                  Slant range
                  <div className="mono" style={{ color: 'var(--ink-dim)' }}>{d.slantRangeM} m</div>
                </div>
                <div>
                  Coordinates
                  <div className="mono" style={{ color: 'var(--ink-dim)' }}>
                    {d.location.lat.toFixed(4)}, {d.location.lon.toFixed(4)}
                  </div>
                </div>
              </div>
              {d.id === selectedId && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ flex: 1, padding: '9px', fontSize: 12.5 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setStatus(d.id, 'confirmed')
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ flex: 1, padding: '9px', fontSize: 12.5 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setStatus(d.id, 'cleared')
                    }}
                  >
                    Mark false +
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
