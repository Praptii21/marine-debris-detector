// Small, unobtrusive info bulletin — muted text + info icon. Not a modal or
// warning banner; for disclosures that are useful context, not alerts.
export default function InfoNotice({ children, style }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '10px 12px',
        borderRadius: 'var(--radius)',
        background: 'var(--panel-alt)',
        border: '1px solid var(--border)',
        fontSize: 12,
        color: 'var(--ink-faint)',
        lineHeight: 1.5,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{ flex: 'none', marginTop: 2 }}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h.01M11 12h1v5h1" />
      </svg>
      <span>{children}</span>
    </div>
  )
}
