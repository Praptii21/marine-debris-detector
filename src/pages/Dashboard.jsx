import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSurvey, getScanLines, getDetections, getHealth } from '../api/client.js'
import SonarCanvas from '../components/SonarCanvas.jsx'
import StatCard from '../components/StatCard.jsx'
import StatusTag from '../components/StatusTag.jsx'
import ConfidenceChart from '../components/ConfidenceChart.jsx'
import { classColor, classLabel } from '../utils/taxonomy.js'

const MODEL_KEYS = ['crab_pot', 'shipwreck', 'mine']
const FALLBACK_MODEL_LABELS = {
  crab_pot: 'Crab Pot Detector',
  shipwreck: 'Shipwreck Detector',
  mine: 'Mine Detector',
}

export default function Dashboard() {
  const [survey, setSurvey] = useState(null)
  const [lines, setLines] = useState([])
  const [detections, setDetections] = useState([])
  const [health, setHealth] = useState(null)
  const [healthError, setHealthError] = useState(false)

  useEffect(() => {
    getSurvey().then(setSurvey)
    getScanLines().then(setLines)
    getDetections().then(setDetections)
    getHealth()
      .then(setHealth)
      .catch(() => setHealthError(true))
  }, [])

  const flagged = detections.length
  const unreviewed = detections.filter((d) => d.status === 'needs-review').length
  const classCounts = detections.reduce((acc, d) => {
    acc[d.class] = (acc[d.class] || 0) + 1
    return acc
  }, {})
  const maxClassCount = Math.max(1, ...Object.values(classCounts))

  const activeModelCount = MODEL_KEYS.filter((k) => health?.models?.[k]?.loaded).length
  const engineValue = health ? `${activeModelCount}/${MODEL_KEYS.length}` : 'Active'
  const engineFoot = health
    ? `${activeModelCount} of ${MODEL_KEYS.length} detection models active`
    : healthError
      ? 'Backend unreachable'
      : 'running on survey-vessel hardware'

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ocean)', fontWeight: 600, marginBottom: 8 }}>
          Mission overview
        </div>
        <h1 style={{ fontSize: 30 }}>Seabed anomaly detection</h1>
        <p style={{ color: 'var(--ink-dim)', marginTop: 8, maxWidth: '62ch' }}>
          {survey ? `${survey.vessel} · ${survey.area}` : 'Loading survey…'} — live status across every side-scan
          sonar pass ingested this survey.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Lines processed" value={lines.length} foot="+12 in the last hour" />
        <StatCard label="Flagged anomalies" value={flagged} foot={`${unreviewed} awaiting review`} footTone="warn" />
        <StatCard label="Seafloor covered" value="61.4" unit="km²" foot={survey?.area || ''} />
        <StatCard
          label="Detection engine"
          value={engineValue}
          foot={engineFoot}
          footTone={healthError || (health && activeModelCount < MODEL_KEYS.length) ? 'warn' : undefined}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, alignItems: 'start' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16 }}>Recent scan lines</h3>
            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{lines.length} lines</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Site</th>
                  <th>Detections</th>
                  <th>Top class</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className="row-hover">
                    <td className="primary mono">
                      <Link to={`/review/${l.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', textDecoration: 'none' }}>
                        <div style={{ width: 44, height: 32, borderRadius: 6, overflow: 'hidden', background: '#04121a', flex: 'none' }}>
                          <SonarCanvas imageSrc={l.imageSrc} seed={l.id} />
                        </div>
                        {l.id}
                      </Link>
                    </td>
                    <td>{l.site}</td>
                    <td className="mono">{l.detections}</td>
                    <td>{l.topClass || '—'}</td>
                    <td>
                      <StatusTag status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16 }}>Review queue</h3>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{unreviewed} pending</span>
            </div>
            <div>
              {detections
                .filter((d) => d.status === 'needs-review')
                .map((d) => (
                  <Link
                    key={d.id}
                    to={`/review/${d.lineId}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px', borderBottom: '1px solid var(--border)', fontSize: 12.5, textDecoration: 'none', color: 'var(--ink)' }}
                  >
                    <div
                      style={{
                        width: 3,
                        alignSelf: 'stretch',
                        borderRadius: 2,
                        flex: 'none',
                        background: 'var(--coral)',
                      }}
                    />
                    {classLabel(d.class)} · {d.lineId}
                    <span className="mono" style={{ marginLeft: 'auto', flex: 'none', color: 'var(--ink-faint)' }}>
                      {d.confidence != null ? `${(d.confidence * 100).toFixed(0)}%` : '—'}
                    </span>
                  </Link>
                ))}
              {unreviewed === 0 && (
                <div style={{ padding: '14px 20px', fontSize: 12.5, color: 'var(--ink-faint)' }}>Nothing awaiting review.</div>
              )}
            </div>
          </div>

          <ConfidenceChart detections={detections} />

          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16 }}>Class distribution</h3>
            </div>
            <div style={{ padding: '6px 0 14px' }}>
              {Object.entries(classCounts).map(([cls, count]) => (
                <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 20px', fontSize: 12.5 }}>
                  <span style={{ width: 130, flex: 'none', color: 'var(--ink-dim)' }}>{classLabel(cls)}</span>
                  <div style={{ flex: 1, height: 5, background: 'var(--ocean-tint)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / maxClassCount) * 100}%`, height: '100%', background: classColor(cls), borderRadius: 3 }} />
                  </div>
                  <span className="mono" style={{ width: 20, flex: 'none', textAlign: 'right', color: 'var(--ink-faint)' }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16 }}>Model status</h3>
            </div>
            <div style={{ padding: '6px 0 14px' }}>
              {MODEL_KEYS.map((key) => {
                const m = health?.models?.[key]
                const active = Boolean(m?.loaded)
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontSize: 12.5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: active ? 'var(--sage)' : 'var(--ink-faint)' }} />
                    <span style={{ color: 'var(--ink-dim)' }}>
                      {m?.label || FALLBACK_MODEL_LABELS[key]}
                      {m?.variants?.length > 1 && (
                        <span style={{ color: 'var(--ink-faint)', marginLeft: 6 }}>· {m.variants.length} variants</span>
                      )}
                    </span>
                    <span className="mono" style={{ marginLeft: 'auto', flex: 'none', fontWeight: 600, color: active ? 'var(--sage)' : 'var(--ink-faint)' }}>
                      {active ? 'Active' : 'Unavailable'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
