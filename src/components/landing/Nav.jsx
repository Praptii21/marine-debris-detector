import { Link } from 'react-router-dom'
import { Container } from './primitives.jsx'

export default function Nav({ isDark, toggleTheme }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-abyss/85 backdrop-blur-md transition-colors">
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-fg no-underline group">
          <div className="relative flex items-center justify-center size-9 rounded border border-line-strong bg-deep/80 text-signal-text group-hover:border-cyan-glow/50 group-hover:shadow-[0_0_12px_rgba(2,132,199,0.25)] transition-all">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-cyan-glow" aria-hidden="true">
              <circle cx="12" cy="12" r="9" strokeOpacity="0.3" strokeDasharray="2 2" />
              <circle cx="12" cy="12" r="5" strokeOpacity="0.6" />
              <path d="M12 7v5l3 3" />
              <path d="M3 12h4l2-5 4 10 2-5h6" />
            </svg>
            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-teal-glow animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-fg group-hover:text-cyan-glow transition-colors">
              Aqua<span className="text-cyan-glow">Scan</span>
            </span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-fg-faint -mt-1">
              Marine Debris & Hazard AI Detector
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle light/dark theme"
            className="flex items-center gap-2 rounded-full border border-line-strong bg-deep px-3 py-1.5 font-mono text-xs text-fg hover:border-cyan-glow/50 hover:bg-surface transition-all shadow-sm cursor-pointer"
          >
            {isDark ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <span className="hidden sm:inline">Ocean Light</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-600">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span className="hidden sm:inline">Deep Abyss</span>
              </>
            )}
          </button>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded border border-cyan-glow/40 bg-signal/15 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-cyan-glow hover:bg-signal/25 hover:border-cyan-glow transition-all no-underline shadow-sm"
          >
            <span>Open Dashboard</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </Container>
    </header>
  )
}
