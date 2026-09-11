import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { runDetectionPipeline, extractSonarMetadata } from '../api/client.js'

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
  
  // files: { id, name, size, file, metaStatus: 'pending'|'extracting'|'done'|'error' }
  const [files, setFiles] = useState([])
  const [metadataByFile, setMetadataByFile] = useState({})
  const [selectedFileId, setSelectedFileId] = useState(null)
  
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const processFileMetadata = async (fileObj) => {
    setFiles((prev) => prev.map(f => f.id === fileObj.id ? { ...f, metaStatus: 'extracting' } : f))
    
    try {
      const metadata = await extractSonarMetadata(fileObj.file)
      setMetadataByFile((prev) => ({
        ...prev,
        [fileObj.id]: {
          surveyId: metadata.survey_id,
          vessel: metadata.vessel,
          startCoords: metadata.start_coords,
          endCoords: metadata.end_coords,
          start_lat: metadata.start_lat,
          start_lon: metadata.start_lon,
          end_lat: metadata.end_lat,
          end_lon: metadata.end_lon,
          heading_deg: metadata.heading_deg,
          depth_m: metadata.depth_m,
          altitude_m: metadata.altitude_m,
          timestamp: metadata.timestamp,
          swath_width_m: metadata.swath_width_m
        }
      }))
      setFiles((prev) => prev.map(f => f.id === fileObj.id ? { ...f, metaStatus: 'done' } : f))
      setSelectedFileId((prev) => prev === null ? fileObj.id : prev)
    } catch (err) {
      console.error(err)
      setFiles((prev) => prev.map(f => f.id === fileObj.id ? { ...f, metaStatus: 'error' } : f))
    }
  }

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList).map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}`,
      name: f.name,
      size: f.size,
      file: f,
      metaStatus: 'pending'
    }))
    
    setFiles((prev) => {
      const existingIds = new Set(prev.map((f) => f.id))
      const newFiles = incoming.filter((f) => !existingIds.has(f.id))
      
      // Trigger extraction for new files
      newFiles.forEach(f => processFileMetadata(f))
      
      return [...prev, ...newFiles]
    })
  }, [])

  const onDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setMetadataByFile((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setSelectedFileId((prev) => (prev === id ? null : prev))
  }

  const handleMetaChange = (field, value) => {
    if (!selectedFileId) return
    setMetadataByFile((prev) => ({
      ...prev,
      [selectedFileId]: {
        ...prev[selectedFileId],
        [field]: value
      }
    }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!files.length || submitting) return
    
    // Check if any files are still extracting
    if (files.some(f => f.metaStatus === 'extracting')) return
    
    setSubmitting(true)
    setResult(null)
    try {
      const res = await runDetectionPipeline({ files, metadataByFile, metadata: {} })
      setResult(res)
      setTimeout(() => navigate(`/review/${res.lineId}`), 700)
    } finally {
      setSubmitting(false)
    }
  }

  const allDone = files.length > 0 && files.every(f => f.metaStatus === 'done' || f.metaStatus === 'error')
  const canSubmit = files.length > 0 && allDone && !submitting
  
  const selectedMeta = selectedFileId ? metadataByFile[selectedFileId] : null

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
                    <tr 
                      key={f.id} 
                      className={`row-hover ${selectedFileId === f.id ? 'selected' : ''}`}
                      onClick={() => setSelectedFileId(f.id)}
                      style={{ cursor: 'pointer', background: selectedFileId === f.id ? 'var(--ocean-tint)' : 'transparent' }}
                    >
                      <td className="primary mono">{f.name}</td>
                      <td className="mono">
                        {f.metaStatus === 'extracting' && <span style={{ color: 'var(--ocean)', fontSize: 11 }}>Reading sonar metadata...</span>}
                        {f.metaStatus === 'done' && <span className="tag" style={{ background: 'var(--sage)', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px' }}>Metadata extracted successfully</span>}
                        {f.metaStatus === 'error' && <span style={{ color: 'red', fontSize: 11 }}>Extraction failed</span>}
                      </td>
                      <td className="mono">{formatBytes(f.size)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn ghost"
                          style={{ padding: '5px 12px', fontSize: 11.5 }}
                          onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
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
          {files.length > 0 && selectedMeta && (
            <div className="card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 16 }}>Survey metadata</h3>
              </div>
              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label>Survey ID</label>
                  <input value={selectedMeta.surveyId || ''} onChange={(e) => handleMetaChange('surveyId', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field">
                    <label>Start lat / lon</label>
                    <input value={selectedMeta.startCoords || ''} onChange={(e) => handleMetaChange('startCoords', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>End lat / lon</label>
                    <input value={selectedMeta.endCoords || ''} onChange={(e) => handleMetaChange('endCoords', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field">
                    <label>Heading (deg)</label>
                    <input value={selectedMeta.heading_deg ?? ''} onChange={(e) => handleMetaChange('heading_deg', parseFloat(e.target.value))} type="number" step="0.1" />
                  </div>
                  <div className="field">
                    <label>Timestamp</label>
                    <input value={selectedMeta.timestamp || ''} onChange={(e) => handleMetaChange('timestamp', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field">
                    <label>Depth (m)</label>
                    <input value={selectedMeta.depth_m ?? ''} onChange={(e) => handleMetaChange('depth_m', parseFloat(e.target.value))} type="number" step="0.1" />
                  </div>
                  <div className="field">
                    <label>Altitude (m)</label>
                    <input value={selectedMeta.altitude_m ?? ''} onChange={(e) => handleMetaChange('altitude_m', parseFloat(e.target.value))} type="number" step="0.1" />
                  </div>
                </div>
                <div className="field">
                  <label>Vessel / platform</label>
                  <input value={selectedMeta.vessel || ''} onChange={(e) => handleMetaChange('vessel', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn block" style={{ marginTop: 16, padding: 13 }} disabled={!canSubmit}>
            {submitting ? 'Running detection pipeline...' : 'Run detection pipeline ?'}
          </button>
          {result && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--sage)' }}>
              Queued {result.queued} file{result.queued === 1 ? '' : 's'} as line {result.lineId} — opening review...
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
