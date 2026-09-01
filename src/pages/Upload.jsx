import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { runDetectionPipeline } from '../api/client.js'

const ACCEPTED = '.xtf,.jsf,.segy,.tif,.tiff,.png,.jpg,.jpeg'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Upload() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const [metadata, setMetadata] = useState({
    surveyId: 'IN-2026-0714',
    startCoords: '9.0451, 79.1663',
    endCoords: '9.0392, 79.1801',
    vessel: 'RV Sagar Sandhan',
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList).map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}`,
      name: f.name,
      size: f.size,
      file: f,
    }))
    setFiles((prev) => {
      const existingIds = new Set(prev.map((f) => f.id))
      return [...prev, ...incoming.filter((f) => !existingIds.has(f.id))]
    })
  }, [])

  const onDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id))

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!files.length || submitting) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await runDetectionPipeline({ files, metadata })
      setResult(res)
      setTimeout(() => navigate(`/review/${res.lineId}`), 700)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ocean)', fontWeight: 600, marginBottom: 8 }}>
          Ingest
        </div>
        <h1 style={{ fontSize: 30 }}>Upload sonar imagery</h1>
        <p style={{ color: 'var(--ink-dim)', marginTop: 8, maxWidth: '68ch' }}>
          Accepts raw waterfall exports or georeferenced mosaics. Files are handed to the detection pipeline
          as-is — preprocessing runs automatically on the backend, nothing to configure here.
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        <div>
          <div
            className="card"
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              padding: '52px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              borderStyle: 'dashed',
              borderWidth: 1.5,
              borderColor: dragActive ? 'var(--ocean)' : 'var(--border-strong)',
              background: dragActive ? 'var(--ocean-tint)' : 'var(--panel)',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED}
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="var(--ocean)" strokeWidth="1.6" style={{ marginBottom: 14 }}>
              <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
              <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
            </svg>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>Drop sonar files, or click to browse</h3>
            <p style={{ color: 'var(--ink-dim)', fontSize: 12.5, margin: '0 0 18px' }}>
              Batch upload supported — files are processed in submission order
            </p>
            <button type="button" className="btn" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>
              Select files
            </button>
            <div className="mono" style={{ marginTop: 16, color: 'var(--ink-faint)', fontSize: 11 }}>
              .XTF &nbsp;.JSF &nbsp;.SEGY &nbsp;.TIF &nbsp;.PNG — up to 2 GB each
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: files.length ? '1px solid var(--border)' : 'none' }}>
              <h3 style={{ fontSize: 15 }}>Queued for this batch</h3>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{files.length} file{files.length === 1 ? '' : 's'}</span>
            </div>
            {files.length === 0 ? (
              <div style={{ padding: '18px 20px', color: 'var(--ink-faint)', fontSize: 13 }}>No files selected yet.</div>
            ) : (
              <table>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.id} className="row-hover">
                      <td className="primary mono">{f.name}</td>
                      <td className="mono">{formatBytes(f.size)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn ghost"
                          style={{ padding: '5px 12px', fontSize: 11.5 }}
                          onClick={() => removeFile(f.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16 }}>Survey metadata</h3>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label>Survey ID</label>
                <input value={metadata.surveyId} onChange={(e) => setMetadata({ ...metadata, surveyId: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>Start lat / lon</label>
                  <input value={metadata.startCoords} onChange={(e) => setMetadata({ ...metadata, startCoords: e.target.value })} />
                </div>
                <div className="field">
                  <label>End lat / lon</label>
                  <input value={metadata.endCoords} onChange={(e) => setMetadata({ ...metadata, endCoords: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Vessel / platform</label>
                <input value={metadata.vessel} onChange={(e) => setMetadata({ ...metadata, vessel: e.target.value })} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn block" style={{ marginTop: 16, padding: 13 }} disabled={!files.length || submitting}>
            {submitting ? 'Running detection pipeline…' : 'Run detection pipeline →'}
          </button>
          {result && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--sage)' }}>
              Queued {result.queued} file{result.queued === 1 ? '' : 's'} as line {result.lineId} — opening review…
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
