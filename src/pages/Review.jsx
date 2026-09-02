import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getScanLines, getDetections, submitAnnotations } from '../api/client.js'
import AnnotationTool from '../components/AnnotationTool.jsx'
import ConfidenceBadge from '../components/ConfidenceBadge.jsx'
import { classIdFor, classLabel, isCriticalClass, modelLabel, statusRowTint } from '../utils/taxonomy.js'

function detectionVariant(status, classKey) {
  // A safety-critical class (person in water) always renders distinctly,
  // regardless of its review status — it should never look like a routine
  // low-confidence debris flag.
  if (isCriticalClass(classKey)) return 'critical'
  if (status === 'rejected') return 'rejected'
  if (status === 'needs-review') return 'needs-review'
  return 'confirmed' // auto-confirmed or operator-confirmed
}

function detectionToAnnotation(d, rejected) {
  return {
    image_id: d.lineId,
    bbox_normalized: [
      d.bboxPct.left + d.bboxPct.width / 2,
      d.bboxPct.top + d.bboxPct.height / 2,
      d.bboxPct.width,
      d.bboxPct.height,
    ],
    class_id: classIdFor(d.class),
    class_name: d.class,
    source: 'operator_correction',
    original_detection_id: d.id,
    rejected,
  }
}

function draftToAnnotation(draft, lineId) {
  return {
    image_id: lineId,
    bbox_normalized: [
      draft.bboxPct.left + draft.bboxPct.width / 2,
      draft.bboxPct.top + draft.bboxPct.height / 2,
      draft.bboxPct.width,
      draft.bboxPct.height,
    ],
    class_id: classIdFor(draft.classKey),
    class_name: draft.classKey,
    source: 'operator_correction',
    original_detection_id: null,
    rejected: false,
  }
}

export default function Review() {
  const { lineId: routeLineId } = useParams()
  const navigate = useNavigate()
  const [lines, setLines] = useState([])
  const [detections, setDetections] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [drawMode, setDrawMode] = useState(false)
  const [draftAnnotations, setDraftAnnotations] = useState([])
  const [pendingByDetection, setPendingByDetection] = useState(new Map())
  const [saving, setSaving] = useState(false)
  const [saveNote, setSaveNote] = useState(null)

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
    setDraftAnnotations([])
    setPendingByDetection(new Map())
    setDrawMode(false)
    setSaveNote(null)
  }, [lineId])

  const line = lines.find((l) => l.id === lineId)
  const selectedDetection = detections.find((d) => d.id === selectedId)

  const handleConfirmSelected = () => {
    if (!selectedDetection) return
    setDetections((prev) => prev.map((d) => (d.id === selectedDetection.id ? { ...d, status: 'operator-confirmed' } : d)))
    setPendingByDetection((prev) => new Map(prev).set(selectedDetection.id, detectionToAnnotation(selectedDetection, false)))
  }

  const handleRejectSelected = () => {
    if (!selectedDetection) return
    setDetections((prev) => prev.map((d) => (d.id === selectedDetection.id ? { ...d, status: 'rejected' } : d)))
    setPendingByDetection((prev) => new Map(prev).set(selectedDetection.id, detectionToAnnotation(selectedDetection, true)))
  }

  const handleCreateAnnotation = ({ bboxPct, classKey }) => {
    const id = `draft_${Math.random().toString(36).slice(2, 10)}`
    setDraftAnnotations((prev) => [...prev, { id, bboxPct, classKey }])
    setSelectedId(id)
  }

  const pendingCount = draftAnnotations.length + pendingByDetection.size

  const handleSaveNext = async () => {
    setSaving(true)
    setSaveNote(null)
    try {
      const payload = [
        ...Array.from(pendingByDetection.values()),
        ...draftAnnotations.map((d) => draftToAnnotation(d, lineId)),
      ]
      if (payload.length) {
        await submitAnnotations(payload)
      }
      const idx = lines.findIndex((l) => l.id === lineId)
      const next = lines[idx + 1]
      if (next) {
        navigate(`/review/${next.id}`)
      } else {
        setSaveNote('All scan lines reviewed.')
      }
    } catch (err) {
      setSaveNote(err.message || 'Failed to save annotations.')
    } finally {
      setSaving(false)
    }
  }

  const modelBoxes = detections.map((d) => ({
    id: d.id,
    bboxPct: d.bboxPct,
    label: `${classLabel(d.class).toUpperCase()} · ${d.confidence != null ? d.confidence.toFixed(2) : 'Operator'}`,
    variant: detectionVariant(d.status, d.class),
    selected: d.id === selectedId,
  }))
  const draftBoxes = draftAnnotations.map((a) => ({
    id: a.id,
    bboxPct: a.bboxPct,
    label: `${classLabel(a.classKey).toUpperCase()} · Operator`,
    variant: 'operator-drawn',
    selected: a.id === selectedId,
  }))

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ocean)', fontWeight: 600, marginBottom: 8 }}>
          Line {lineId || '—'} {line ? `· ${line.site}` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 28 }}>Detection results</h1>
          <span className="info-tip" tabIndex={0}>
            i
            <span className="bubble">
              Detections are identified primarily through acoustic shadow analysis — the dark region cast
              behind an object on the seafloor.
            </span>
          </span>
        </div>
        <p style={{ color: 'var(--ink-dim)', marginTop: 8, maxWidth: '70ch' }}>
          Bounding boxes from the active detection pass, ranked by confidence. Draw missed objects, confirm or
          reject model calls, then save — corrections feed the next active-learning training run.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div>
          <AnnotationTool
            imageSrc={line?.imageSrc}
            seed={lineId}
            boxes={[...modelBoxes, ...draftBoxes]}
            drawMode={drawMode}
            onToggleDrawMode={() => setDrawMode((v) => !v)}
            onSelectBox={setSelectedId}
            onCreateAnnotation={handleCreateAnnotation}
            onConfirmSelected={handleConfirmSelected}
            onRejectSelected={handleRejectSelected}
            onSaveNext={handleSaveNext}
            canConfirmSelected={Boolean(selectedDetection)}
            canRejectSelected={Boolean(selectedDetection)}
            pendingCount={pendingCount}
            saving={saving}
          />
          {saveNote && (
            <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--ink-dim)' }}>{saveNote}</div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16 }}>Detections</h3>
            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{detections.length} object{detections.length === 1 ? '' : 's'}</span>
          </div>
          {detections.length === 0 && draftAnnotations.length === 0 && (
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
                background: d.id === selectedId ? 'var(--ocean-tint)' : statusRowTint(d.status),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{classLabel(d.class)}</span>
                <span className="mono" style={{ color: d.confidence != null && d.confidence > 0.7 ? 'var(--ocean)' : 'var(--amber)' }}>
                  {d.confidence != null ? d.confidence.toFixed(2) : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {isCriticalClass(d.class) && (
                  <span className="tag alert">
                    <span className="dot" />
                    Safety
                  </span>
                )}
                <ConfidenceBadge status={d.status} />
                <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                  {d.source === 'operator' ? 'Operator' : modelLabel(d.model)}
                </span>
              </div>
              {d.confidence != null && (
                <div style={{ height: 4, background: 'var(--ocean-tint)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ width: `${d.confidence * 100}%`, height: '100%', background: d.confidence > 0.7 ? 'var(--ocean)' : 'var(--amber)' }} />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 11.5, color: 'var(--ink-faint)' }}>
                <div>
                  Acoustic shadow
                  <div className="mono" style={{ color: 'var(--ink-dim)' }}>{d.acousticShadowM != null ? `${d.acousticShadowM} m` : '—'}</div>
                </div>
                <div>
                  Est. area
                  <div className="mono" style={{ color: 'var(--ink-dim)' }}>{d.areaM2 != null ? `${d.areaM2} m²` : '—'}</div>
                </div>
                <div>
                  Slant range
                  <div className="mono" style={{ color: 'var(--ink-dim)' }}>{d.slantRangeM != null ? `${d.slantRangeM} m` : '—'}</div>
                </div>
                <div>
                  Coordinates
                  <div className="mono" style={{ color: 'var(--ink-dim)' }}>
                    {d.location ? `${d.location.lat.toFixed(4)}, ${d.location.lon.toFixed(4)}` : '—'}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {draftAnnotations.map((a) => (
            <div
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                background: a.id === selectedId ? 'var(--ocean-tint)' : 'rgba(77,142,224,0.07)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{classLabel(a.classKey)}</span>
                <span className="mono" style={{ color: 'var(--ink-faint)' }}>Operator</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>Drawn this session · pending save</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
