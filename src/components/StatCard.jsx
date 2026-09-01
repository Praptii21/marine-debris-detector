export default function StatCard({ label, value, unit, foot, footTone }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-faint)', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 6, color: 'var(--ink)' }}>
        {value}
        {unit && <span style={{ fontSize: 14, color: 'var(--ink-dim)', fontFamily: 'var(--font-body)', marginLeft: 4 }}>{unit}</span>}
      </div>
      {foot && (
        <div style={{ fontSize: 12, marginTop: 8, fontWeight: 600, color: footTone === 'warn' ? 'var(--amber)' : 'var(--sage)' }}>
          {foot}
        </div>
      )}
    </div>
  )
}
