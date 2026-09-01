const STATUS = {
  unreviewed: { label: 'Unreviewed', cls: 'crit' },
  queued: { label: 'Queued', cls: 'warn' },
  confirmed: { label: 'Confirmed', cls: 'ok' },
  cleared: { label: 'Cleared', cls: 'ok' },
  review: { label: 'Review', cls: 'crit' },
}

export default function StatusTag({ status }) {
  const s = STATUS[status] || { label: status, cls: 'warn' }
  return (
    <span className={`tag ${s.cls}`}>
      <span className="dot" />
      {s.label}
    </span>
  )
}
