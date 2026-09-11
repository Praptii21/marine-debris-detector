export default function StatCard({ label, value, unit, foot, footTone }) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-faint)', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, marginTop: 5, color: 'var(--ink)' }}>
        {value}
        {unit && <span style={{ fontSize: 13, color: 'var(--ink-dim)', fontFamily: 'var(--font-body)', marginLeft: 4 }}>{unit}</span>}
      </div>
      {foot && (
        <div style={{ fontSize: 11.5, marginTop: 6, fontWeight: 600, color: footTone === 'warn' ? 'var(--amber)' : 'var(--sage)' }}>
          {foot}
        </div>
      )}
    </div>
  )
}
