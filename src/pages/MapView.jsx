import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { getDetections, getSites } from '../api/client.js'

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
        attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
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
  unreviewed: '#cf5a42',
  queued: '#b9812a',
  confirmed: '#3f8a63',
  cleared: '#3f8a63',
}

export default function MapView() {
  const [detections, setDetections] = useState([])
  const [sites, setSites] = useState([])
  const [basemap, setBasemap] = useState('map')

  useEffect(() => {
    getDetections().then(setDetections)
    getSites().then(setSites)
  }, [])

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ocean)', fontWeight: 600, marginBottom: 8 }}>
          Spatial view
        </div>
        <h1 style={{ fontSize: 28 }}>Detections by location</h1>
        <p style={{ color: 'var(--ink-dim)', marginTop: 8, maxWidth: '68ch' }}>
          GPS coordinates recovered from sonar navigation metadata, plotted on OpenStreetMap.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18 }}>
        <div style={{ position: 'relative', height: 560, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
          <MapContainer center={[12.5, 76]} zoom={6} style={{ width: '100%', height: '100%' }}>
            {BASEMAPS[basemap].layers.map((layer, i) => (
              <TileLayer key={`${basemap}-${i}`} url={layer.url} attribution={layer.attribution} />
            ))}
            {detections.map((d) => (
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
              >
                <Popup>
                  <div style={{ fontFamily: 'var(--font-body)', minWidth: 180 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.class}</div>
                    <div className="mono" style={{ fontSize: 12, color: '#4c6672' }}>
                      {d.location.lat.toFixed(4)}, {d.location.lon.toFixed(4)}
                      <br />
                      confidence {d.confidence.toFixed(2)} · line {d.lineId}
                    </div>
                    <Link to={`/review/${d.lineId}`} style={{ display: 'inline-block', marginTop: 8, fontSize: 12.5, fontWeight: 600 }}>
                      Open in review →
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 1000,
              display: 'flex',
              gap: 4,
              background: 'rgba(255,255,255,.95)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 4,
            }}
          >
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

          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              zIndex: 1000,
              background: 'rgba(255,255,255,.92)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 11.5,
            }}
          >
            <LegendRow color={STATUS_COLOR.unreviewed} label="Unreviewed / high confidence" />
            <LegendRow color={STATUS_COLOR.queued} label="Queued for review" />
            <LegendRow color={STATUS_COLOR.confirmed} label="Confirmed / cleared" />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16 }}>Sites</h3>
            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{sites.length} active</span>
          </div>
          {sites.map((s) => (
            <div key={s.name} style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13.5, color: 'var(--ink)', marginBottom: 3 }}>{s.name}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                {s.lat.toFixed(4)}°N, {s.lon.toFixed(4)}°E — {s.flagged} flagged
              </div>
            </div>
          ))}
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
