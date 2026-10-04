import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, GeoJSON, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { getDetections, getScanLines, getSurvey, getRiskZones } from '../api/client.js'
import { demoRiskData } from '../api/demoRiskData.js'
import SonarCanvas from '../components/SonarCanvas.jsx'
import { classLabel } from '../utils/taxonomy.js'
import HeatmapLayer from '../components/HeatmapLayer.jsx'
import RiskLegend from '../components/RiskLegend.jsx'
import { downloadKml } from '../utils/exportReport.js'

const BASEMAPS = {
  map: {
    label: 'Map',
    layers: [
      {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors',
      },
    ],
  },
  satellite: {
    label: 'Satellite',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      },
    ],
  },
  hybrid: {
    label: 'Hybrid',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri',
      },
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Labels &copy; Esri',
      },
    ],
  },
}

const STATUS_COLOR = {
  'needs-review': '#cf5a42',
  'auto-confirmed': '#3f8a63',
  'operator-confirmed': '#1f6fa3',
  rejected: '#82969e',
}

export function getRiskColor(intensity) {
  if (intensity >= 0.85) return '#d32f2f'; // Critical
  if (intensity >= 0.70) return '#ff9800'; // High
  if (intensity >= 0.55) return '#ffeb3b'; // Moderate
  return '#2196f3';                        // Low
}

// Measured-zone levels come from the backend (backend/risk.py::LEVELS).
const LEVEL_COLOR = { Critical: '#d32f2f', High: '#ff9800', Moderate: '#ffeb3b', Low: '#2196f3' }

function measuredPopupHtml(p) {
  const pct = (v) => `${Math.round(v * 100)}%`
  const bar = (label, v, w) =>
    `<div style="display:flex;justify-content:space-between;font-size:11px"><span>${label} <span style="opacity:.6">(×${w})</span></span><b>${pct(v)}</b></div>`
  return `
    <div style="min-width:230px;font-family:inherit">
      <div style="font-weight:700;font-size:14px;margin-bottom:4px">Measured risk — ${pct(p.risk)}</div>
      <div style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;color:#fff;background:${LEVEL_COLOR[p.level]};margin-bottom:6px">${p.level} · data confidence ${p.data_confidence}</div>
      ${bar('Density / surveyed km²', p.components.density, p.weights.density)}
      ${bar('Worst-class severity', p.components.severity, p.weights.severity)}
      ${bar('Reference prior', p.components.prior, p.weights.prior)}
      <div style="font-weight:600;font-size:11.5px;margin:8px 0 3px">Why is this ${p.level.toLowerCase()}?</div>
      <ul style="padding-left:16px;margin:0;font-size:11px;line-height:1.4">${p.reasons.map((r) => `<li>${r}</li>`).join('')}</ul>
    </div>`
}

function MapBoundsUpdater({ points }) {
  const map = useMap();
  const lastKeyRef = useRef('');
  useEffect(() => {
    if (points && points.length > 0) {
      const key = points.map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join(';');
      if (lastKeyRef.current !== key) {
        lastKeyRef.current = key;
        map.fitBounds(points, { padding: [50, 50], maxZoom: 9 });
      }
    }
  }, [points, map]);
  return null;
}

export default function MapView() {
  const navigate = useNavigate()
  const [survey, setSurvey] = useState(null)
  const [detections, setDetections] = useState([])
  const [lines, setLines] = useState([])
  const [basemap, setBasemap] = useState('map')

  // View state: 'both' by default so new risk features & hazard lenses are immediately visible
  const [activeView, setActiveView] = useState('both') // 'detections' | 'risk' | 'both'
  const [riskZones, setRiskZones] = useState([])
  const [mapInstance, setMapInstance] = useState(null)

  // Data-driven risk layer: 'measured' (computed from surveys) or 'reference' (static)
  const [riskSource, setRiskSource] = useState('measured')
  const [hazard, setHazard] = useState('all') // all | navigation | ecological
  const [measured, setMeasured] = useState(demoRiskData?.all || { features: [], metadata: null })
  const [measuredError, setMeasuredError] = useState(null)

  // Fetch Existing API Data
  useEffect(() => {
    getSurvey().then(setSurvey)
    getDetections().then(setDetections)
    getScanLines().then(setLines)
  }, [])

  // Fetch Risk Heatmap Data
  useEffect(() => {
    fetch('/data/risk_data.json')
      .then((res) => res.json())
      .then((data) => setRiskZones(data.risk_zones || []))
      .catch((err) => console.error('Error loading risk data:', err));
  }, [])

  // Measured zones. Re-fetched when the hazard lens changes; flips to the
  // measured view automatically the first time real survey data exists,
  // unless the user already chose a source themselves.
  const userPickedSource = useRef(false)
  useEffect(() => {
    let cancelled = false
    getRiskZones(hazard)
      .then((fc) => {
        if (cancelled) return
        setMeasured(fc)
        setMeasuredError(null)
        if (fc.features?.length && !userPickedSource.current) setRiskSource('measured')
      })
      .catch((err) => !cancelled && setMeasuredError(err.message))
    return () => { cancelled = true }
  }, [hazard])

  const pickRiskSource = (src) => {
    userPickedSource.current = true
    setRiskSource(src)
  }
  const showMeasured = riskSource === 'measured'
  const imageByLineId = Object.fromEntries(lines.map((l) => [l.id, l.imageSrc]))

  // Grouped from the real scan lines rather than a separate list, so the
  // flagged count here always matches what Overview/Reports show — no
  // second source of truth to fall out of sync.
  const sites = Object.values(
    lines.reduce((acc, l) => {
      const key = l.site
      if (!acc[key]) acc[key] = { name: key, flagged: 0, lat: null, lon: null }
      acc[key].flagged += l.detections
      if (l.location && acc[key].lat == null) {
        acc[key].lat = l.location.lat
        acc[key].lon = l.location.lon
      }
      return acc
    }, {})
  )
  const heatPoints = riskZones.map((z) => [z.lat, z.lng, z.intensity]);

  return (
    <div>
      {/* Header & View Controls */}
      <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ocean)', fontWeight: 600, marginBottom: 8 }}>
            Spatial view
          </div>
          <h1 style={{ fontSize: 28 }}>
            {activeView === 'detections'
              ? 'Detections by location'
              : activeView === 'risk'
                ? 'Known Accumulation Zones'
                : 'Detections & Accumulation Zones'}
          </h1>
          <p style={{ color: 'var(--ink-dim)', marginTop: 8, maxWidth: '68ch' }}>
            {activeView === 'detections'
              ? 'GPS coordinates recovered from sonar navigation metadata, plotted on OpenStreetMap.'
              : activeView === 'risk'
                ? 'Reference layer — known debris accumulation geography, for survey prioritisation.'
                : 'Detections plotted over known accumulation zones for survey prioritisation.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--glass)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: 4 }}>
            {[
              { id: 'both', label: 'Overlay (All)' },
              { id: 'risk', label: 'Risk Map' },
              { id: 'detections', label: 'Detections Only' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                style={{
                  border: 'none',
                  borderRadius: 7,
                  padding: '7px 12px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeView === id ? 'var(--ocean-deep)' : 'transparent',
                  color: activeView === id ? '#fff' : 'var(--ink-dim)',
                  transition: 'all 0.15s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn ghost"
            onClick={() => downloadKml(survey, { detections, riskZones })}
            title="Downloads a .kml file — opens directly in Google Earth Pro if installed, or import it manually at earth.google.com/web"
          >
            Export KML
          </button>
        </div>
      </div>

      {/* Sub-bar for Risk Mode & Hazard Lenses */}
      {(activeView === 'risk' || activeView === 'both') && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Risk Mode:</span>
            <div style={{ display: 'inline-flex', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 3 }}>
              <button
                type="button"
                onClick={() => pickRiskSource('measured')}
                style={{
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: showMeasured ? 'var(--ocean-deep)' : 'transparent',
                  color: showMeasured ? '#fff' : 'var(--ink-dim)',
                }}
              >
                Measured Density ({measured.features?.length || 0} cells)
              </button>
              <button
                type="button"
                onClick={() => pickRiskSource('reference')}
                style={{
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: !showMeasured ? 'var(--ocean-deep)' : 'transparent',
                  color: !showMeasured ? '#fff' : 'var(--ink-dim)',
                }}
              >
                Reference Heuristic
              </button>
            </div>
          </div>

          {showMeasured && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-dim)' }}>Hazard Lens:</span>
              <div style={{ display: 'inline-flex', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 3 }}>
                {[
                  { id: 'all', label: 'All Hazards' },
                  { id: 'navigation', label: 'Navigation (Mines/Wrecks)' },
                  { id: 'ecological', label: 'Ecological (Nets/Pots)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setHazard(item.id)}
                    style={{
                      border: 'none',
                      borderRadius: 6,
                      padding: '5px 9px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: hazard === item.id ? 'var(--ocean)' : 'transparent',
                      color: hazard === item.id ? '#fff' : 'var(--ink-dim)',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const pts = measured.features?.map((f) => [f.properties.center.lat, f.properties.center.lon])
                  if (pts?.length) mapInstance?.fitBounds(pts, { padding: [50, 50], maxZoom: 10 })
                }}
                className="btn ghost"
                style={{ padding: '5px 10px', fontSize: 11.5 }}
                title="Fit map view to all measured survey grids"
              >
                📍 Zoom to Grids
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18 }}>
        <div style={{ position: 'relative', height: 560, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
          <MapContainer center={[13.1, 79.0]} zoom={7} style={{ width: '100%', height: '100%' }} ref={setMapInstance}>
            {activeView === 'detections' && (
              <MapBoundsUpdater points={detections.filter((d) => d.location).map((d) => [d.location.lat, d.location.lon])} />
            )}
            {(activeView === 'risk' || activeView === 'both') && showMeasured && measured.features?.length > 0 && (
              <MapBoundsUpdater points={measured.features.map((f) => [f.properties.center.lat, f.properties.center.lon])} />
            )}

            {BASEMAPS[basemap].layers.map((layer, i) => (
              <TileLayer key={`${basemap}-${i}`} url={layer.url} attribution={layer.attribution} />
            ))}

            {/* Measured Risk Grid 1km Polygons (Visible on closer zoom) */}
            {(activeView === 'risk' || activeView === 'both') && showMeasured && measured.features?.length > 0 && (
              <GeoJSON
                key={`measured-${hazard}-${measured.features.length}`}
                data={measured}
                style={(feature) => {
                  const color = LEVEL_COLOR[feature.properties.level] || '#2196f3'
                  return {
                    fillColor: color,
                    fillOpacity: 0.45,
                    color: color,
                    weight: 2,
                  }
                }}
                onEachFeature={(feature, layer) => {
                  layer.bindPopup(measuredPopupHtml(feature.properties))
                }}
              />
            )}

            {/* Distinct, High-Visibility Spot Markers for Measured Cells (Always bold & visible at any zoom) */}
            {(activeView === 'risk' || activeView === 'both') &&
              showMeasured &&
              measured.features?.map((f) => {
                const p = f.properties
                const color = LEVEL_COLOR[p.level] || '#2196f3'
                return (
                  <CircleMarker
                    key={`spot-${p.cell_id}`}
                    center={[p.center.lat, p.center.lon]}
                    radius={11}
                    pathOptions={{
                      fillColor: color,
                      color: '#ffffff',
                      weight: 2.5,
                      fillOpacity: 0.95,
                    }}
                    eventHandlers={{
                      click: () => mapInstance?.flyTo([p.center.lat, p.center.lon], 13),
                      mouseover: (e) => e.target.setStyle({ radius: 14, weight: 3.5 }),
                      mouseout: (e) => e.target.setStyle({ radius: 11, weight: 2.5 }),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]}>
                      <div style={{ fontFamily: 'var(--font-body)', padding: 3 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color }}>
                          {p.level} Risk — {Math.round(p.risk * 100)}%
                        </div>
                        <div style={{ fontSize: 11, color: '#2c3e50', marginTop: 2, fontWeight: 500 }}>
                          Cell {p.cell_id} · {p.center.lat.toFixed(4)}°N, {p.center.lon.toFixed(4)}°E
                        </div>
                        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                          {p.detections} debris contact{p.detections !== 1 ? 's' : ''} / {p.area_km2.toFixed(2)} km² surveyed
                        </div>
                        <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>
                          Click to view full mathematical reasoning →
                        </div>
                      </div>
                    </Tooltip>
                    <Popup>
                      <div dangerouslySetInnerHTML={{ __html: measuredPopupHtml(p) }} />
                    </Popup>
                  </CircleMarker>
                )
              })}

            {/* Fallback/Reference Heatmap Layer */}
            {(activeView === 'risk' || activeView === 'both') && !showMeasured && heatPoints.length > 0 && (
              <HeatmapLayer points={heatPoints} />
            )}

            {/* Clickable High-Risk Zone Circles & Tooltips (Reference Heuristic) */}
            {(activeView === 'risk' || activeView === 'both') &&
              !showMeasured &&
              riskZones
                .filter((z) => z.intensity >= 0.65)
                .map((zone) => (
                  <CircleMarker
                    key={zone.id || `${zone.lat}-${zone.lng}`}
                    center={[zone.lat, zone.lng]}
                    radius={6}
                    pathOptions={{
                      fillColor: getRiskColor(zone.intensity),
                      color: '#ffffff',
                      weight: 1.5,
                      fillOpacity: 0.85,
                    }}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'var(--font-body)', minWidth: 200, padding: 4 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 14, color: 'var(--ink)', marginBottom: 4 }}>
                          {zone.zone_name}
                        </div>
                        <div style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 'bold', color: '#fff', backgroundColor: getRiskColor(zone.intensity), marginBottom: 8 }}>
                          {zone.risk_level} Risk — {(zone.intensity * 100).toFixed(0)}%
                        </div>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-dim)', marginBottom: 4 }}>
                          Key Drivers:
                        </div>
                        <ul style={{ paddingLeft: 16, fontSize: 11, color: 'var(--ink-faint)', margin: 0, paddingBottom: 8 }}>
                          {zone.factors?.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

            {/* Original Sonar Detections Pins */}
            {(activeView === 'detections' || activeView === 'both') && detections.filter((d) => d.location).map((d) => (
              <CircleMarker
                key={d.id}
                center={[d.location.lat, d.location.lon]}
                radius={8}
                pathOptions={{
                  color: '#fff',
                  weight: 2,
                  fillColor: STATUS_COLOR[d.status] || '#1f6fa3',
                  fillOpacity: 0.9,
                }}
                eventHandlers={{
                  click: () => navigate(`/review/${d.lineId}`),
                  mouseover: (e) => e.target.setStyle({ radius: 11 }),
                  mouseout: (e) => e.target.setStyle({ radius: 8 }),
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                  <div style={{ fontFamily: 'var(--font-body)', width: 150 }}>
                    <div style={{ width: '100%', height: 90, borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
                      <SonarCanvas imageSrc={imageByLineId[d.lineId]} seed={d.lineId} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{classLabel(d.class)}</div>
                    <div className="mono" style={{ fontSize: 11, color: '#4c6672' }}>
                      {d.confidence != null ? `${(d.confidence * 100).toFixed(0)}%` : '—'} · {d.lineId}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#82969e', marginTop: 3 }}>Click to open →</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Basemap Switcher */}
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', gap: 4, background: 'var(--glass)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: 4 }}>
            {Object.entries(BASEMAPS).map(([key, b]) => (
              <button
                key={key}
                type="button"
                onClick={() => setBasemap(key)}
                style={{
                  border: 'none',
                  borderRadius: 7,
                  padding: '7px 12px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: basemap === key ? 'var(--ocean-deep)' : 'transparent',
                  color: basemap === key ? '#fff' : 'var(--ink-dim)',
                }}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Legends Container */}
          <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000, display: 'flex', gap: 12 }}>
            {(activeView === 'detections' || activeView === 'both') && (
              <div style={{ background: 'var(--glass)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '10px 14px', fontSize: 11.5, color: 'var(--ink-dim)' }}>
                <LegendRow color={STATUS_COLOR['needs-review']} label="Needs review" />
                <LegendRow color={STATUS_COLOR['auto-confirmed']} label="Auto-confirmed" />
                <LegendRow color={STATUS_COLOR['operator-confirmed']} label="Operator confirmed" />
                <LegendRow color={STATUS_COLOR.rejected} label="Rejected" />
              </div>
            )}

            {(activeView === 'risk' || activeView === 'both') && (
              showMeasured ? (
                <div style={{ background: 'var(--glass)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '10px 14px', fontSize: 11.5, color: 'var(--ink-dim)', maxWidth: 220 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                    Measured Risk Level
                  </div>
                  <LegendRow color={LEVEL_COLOR.Critical} label="Critical (≥65%)" />
                  <LegendRow color={LEVEL_COLOR.High} label="High (50–64%)" />
                  <LegendRow color={LEVEL_COLOR.Moderate} label="Moderate (30–49%)" />
                  <LegendRow color={LEVEL_COLOR.Low} label="Low (<30%)" />
                  <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--ink-faint)' }}>
                    Normalized per surveyed km² + class severity
                  </div>
                </div>
              ) : (
                <RiskLegend />
              )
            )}
          </div>
        </div>

        {/* Dynamic Right Sidebar */}
        <div className="card">
          {activeView === 'risk' || activeView === 'both' ? (
            showMeasured ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: 16 }}>Measured Grids</h3>
                  <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{measured.features?.length || 0} cells</span>
                </div>
                <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
                  {measured.features?.length > 0 ? (
                    measured.features.map((f) => {
                      const p = f.properties
                      return (
                        <div
                          key={p.cell_id}
                          onClick={() => mapInstance?.flyTo([p.center.lat, p.center.lon], 13)}
                          style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: 13.5, color: 'var(--ink)', marginBottom: 3, fontWeight: 500 }}>
                              Cell {p.cell_id}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 'bold', padding: '2px 6px', borderRadius: 4, color: '#fff', backgroundColor: LEVEL_COLOR[p.level] }}>
                              {p.level} {Math.round(p.risk * 100)}%
                            </div>
                          </div>
                          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                            {p.center.lat.toFixed(4)}°N, {p.center.lon.toFixed(4)}°E
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 4 }}>
                            {p.detections} debris · {p.area_km2.toFixed(2)} km² surveyed
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ padding: '20px 18px', fontSize: 12, color: 'var(--ink-faint)', lineHeight: 1.5 }}>
                      No surveyed transects in database yet. Detections uploaded with GPS coordinates automatically populate measured risk cells.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: 16 }}>Top Risk Zones</h3>
                  <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{riskZones.filter(z => z.intensity >= 0.8).length} critical</span>
                </div>
                <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
                  {[...riskZones]
                    .sort((a, b) => b.intensity - a.intensity)
                    .slice(0, 10)
                    .map((zone) => (
                      <div
                        key={zone.id || zone.zone_name}
                        onClick={() => mapInstance?.flyTo([zone.lat, zone.lng], 9)}
                        style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontSize: 13.5, color: 'var(--ink)', marginBottom: 3, fontWeight: 500 }}>{zone.zone_name}</div>
                          <div style={{ fontSize: 10, fontWeight: 'bold', padding: '2px 6px', borderRadius: 4, color: '#fff', backgroundColor: getRiskColor(zone.intensity) }}>
                            {(zone.intensity * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                          {zone.lat.toFixed(4)}°N, {zone.lng.toFixed(4)}°E
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 16 }}>Sites</h3>
                <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{sites.length} active</span>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
                {sites.map((s) => (
                  <div key={s.name} style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13.5, color: 'var(--ink)', marginBottom: 3 }}>{s.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                      {s.lat != null ? `${s.lat.toFixed(4)}°N, ${s.lon.toFixed(4)}°E — ` : ''}
                      {s.flagged} flagged
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LegendRow({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flex: 'none' }} />
      {label}
    </div>
  )
}