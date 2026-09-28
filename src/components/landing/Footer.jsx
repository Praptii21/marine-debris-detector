import { Link } from 'react-router-dom'
import { Container } from './primitives.jsx'

export default function Footer() {
  return (
    <footer className="border-t border-line bg-deep/90 py-14">
      <Container className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-7 rounded bg-signal/20 border border-cyan-glow/40 text-cyan-glow">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" strokeDasharray="2 2" />
                <path d="M3 12h4l2-5 4 10 2-5h6" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-fg">
              Aqua<span className="text-cyan-glow">Scan</span>
            </span>
          </div>
          <p className="font-mono text-xs text-fg-dim">
            Autonomous Marine Debris & Subsea Hazard Detection Platform
          </p>
          <div className="space-y-0.5 pt-2">
            <p className="font-mono text-[11px] text-fg-faint">SIH26057 · Ministry of Earth Sciences / NIOT</p>
            <p className="font-mono text-[11px] text-fg-faint">Ramaiah Institute of Technology · Team Aquanauts</p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-3 font-mono text-xs">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 rounded border border-cyan-glow/40 bg-signal/15 px-4 py-2 text-cyan-glow no-underline hover:bg-signal/25 transition-all"
          >
            <span>Launch AquaScan Dashboard →</span>
          </Link>
        </div>
      </Container>
    </footer>
  )
}
