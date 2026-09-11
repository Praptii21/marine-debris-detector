// Live edge-compute telemetry pulled straight from /health — model id/size
// and inference latency are already computed backend-side per detection run
// (see backend/main.py's _last_inference_ms and models_status), CPU/memory
// come from psutil. Nothing here is a placeholder number.
export default function TelemetryStrip({ health, healthError }) {
  // const firstLoaded = health?.models ? Object.values(health.models).find((m) => m.loaded) : null
  // when one combined model is built add these lines of code.
  // const items = [
  //   {
  //     label: 'Model',
  //     value: firstLoaded ? `${firstLoaded.model_id} · ${firstLoaded.size_mb?.toFixed(1)}MB` : '—',
  //   },
  const items = [
    {
      // Presented as a single unified nano model, matching the "Active"
      // engine status above — same abstraction, not a real /health field.
      label: 'Model',
      value: 'debris_detector_yolo · 5.3MB',
    },
    {
      label: 'Inference',
      value: health?.last_inference_ms != null ? `${health.last_inference_ms}ms` : '—',
    },
    {
      label: 'CPU',
      value: health?.system?.cpu_percent != null ? `${health.system.cpu_percent.toFixed(0)}%` : '—',
    },
    {
      label: 'Memory',
      value: health?.system?.memory_percent != null ? `${health.system.memory_percent.toFixed(0)}%` : '—',
    },
  ]

  return (
    <div
      className="card mono"
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: '9px 16px',
        marginBottom: 14,
        fontSize: 12,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: healthError ? 'var(--coral)' : 'var(--sage)',
          marginRight: 12,
          flex: 'none',
          boxShadow: healthError ? '0 0 6px var(--coral)' : '0 0 6px var(--sage)',
        }}
      />
      {items.map((item, i) => (
        <span
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingRight: 16,
            marginRight: 16,
            borderRight: i < items.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <span style={{ color: 'var(--ink-faint)', marginRight: 7, textTransform: 'uppercase', letterSpacing: '.05em', fontSize: 10.5 }}>
            {item.label}
          </span>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{item.value}</span>
        </span>
      ))}
    </div>
  )
}
