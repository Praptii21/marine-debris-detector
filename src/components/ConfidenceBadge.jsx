import { statusMeta } from '../utils/taxonomy.js'

// Confidence-derived review status badge — auto-confirmed (>=0.5, green) /
// needs-review (<0.5, yellow) at ingest, overridable by the operator to
// operator-confirmed (teal) or rejected (red) from the annotation tool.
export default function ConfidenceBadge({ status }) {
  const { label, tone } = statusMeta(status)
  return (
    <span className={`tag ${tone}`}>
      <span className="dot" />
      {label}
    </span>
  )
}
