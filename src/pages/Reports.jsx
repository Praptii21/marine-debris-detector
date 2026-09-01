import { useEffect, useMemo, useState } from 'react'
import { getSurvey, getDetections } from '../api/client.js'
import { downloadReportCsv, downloadReportJson } from '../utils/exportReport.js'

export default function Reports() {
  const [survey, setSurvey] = useState(null)
  const [detections, setDetections] = useState([])
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')

  useEffect(() => {
    getSurvey().then(setSurvey)
    getDetections().then(setDetections)
  }, [])

  const classes = useMemo(() => ['all', ...new Set(detections.map((d) => d.class))], [detections])

  const filtered = detections.filter((d) => {
    if (classFilter !== 'all' && d.class !== classFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      d.lineId.toLowerCase().includes(q) ||
      d.site.toLowerCase().includes(q) ||
      `${d.location.lat}`.includes(q) ||
      `${d.location.lon}`.includes(q)
    )
  })

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ocean)', fontWeight: 600, marginBottom: 8 }}>
          Archive
        </div>
        <h1 style={{ fontSize: 28 }}>Detection reports</h1>
        <p style={{ color: 'var(--ink-dim)', marginTop: 8, maxWidth: '68ch' }}>
          Every flagged anomaly, with exact location, bounding dimensions, and classification — exportable as
          JSON or CSV for the backend or a GIS tool.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          className="mono"
          placeholder="Search by line, site or coordinates…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            background: 'var(--panel)',
            border: '1px solid var(--border-strong)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13.5,
            fontFamily: 'var(--font-body)',
          }}
        />
        {classes.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setClassFilter(c)}
            style={{
              padding: '9px 14px',
              border: `1px solid ${classFilter === c ? 'var(--ocean)' : 'var(--border-strong)'}`,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: classFilter === c ? 600 : 400,
              background: classFilter === c ? 'var(--ocean-tint)' : 'var(--panel)',
              color: classFilter === c ? 'var(--ocean-deep)' : 'var(--ink-dim)',
              cursor: 'pointer',
            }}
          >
            {c === 'all' ? 'All classes' : c}
          </button>
        ))}
        <button type="button" className="btn ghost" onClick={() => downloadReportCsv(survey, filtered)}>
          Export CSV
        </button>
        <button type="button" className="btn" onClick={() => downloadReportJson(survey, filtered)}>
          Export JSON
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Line</th>
                <th>Site</th>
                <th>Class</th>
                <th>Confidence</th>
                <th>Coordinates</th>
                <th>Bounding box</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="row-hover">
                  <td className="primary mono">{d.lineId}</td>
                  <td>{d.site}</td>
                  <td>{d.class}</td>
                  <td className="mono">{d.confidence.toFixed(2)}</td>
                  <td className="mono">
                    {d.location.lat.toFixed(4)}, {d.location.lon.toFixed(4)}
                  </td>
                  <td className="mono">
                    {d.boundingBoxM.width}m × {d.boundingBoxM.height}m
                  </td>
                  <td>
                    <StatusPill status={d.status} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: 'var(--ink-faint)', textAlign: 'center', padding: 24 }}>
                    No detections match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    unreviewed: ['Unreviewed', 'crit'],
    queued: ['Queued', 'warn'],
    confirmed: ['Confirmed', 'ok'],
    cleared: ['Cleared', 'ok'],
  }
  const [label, cls] = map[status] || [status, 'warn']
  return <span className={`tag ${cls}`}>{label}</span>
}
