import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Reveal } from './primitives.jsx'
import SonarWaterfall from './SonarWaterfall.jsx'
import { usePrefersReducedMotion } from './useScrollReveal.js'

const HERO_DETECTIONS = [
  { id: 'DET-041', class: 'Ghost Fishing Net', conf: '94.8%', lat: '13.0827° N', lon: '80.2707° E', risk: 'Critical', depth: '38.4 m' },
  { id: 'DET-042', class: 'Submerged Wreck', conf: '91.2%', lat: '13.0841° N', lon: '80.2735° E', risk: 'High', depth: '41.2 m' },
  { id: 'DET-043', class: 'Crab Pot Cluster', conf: '88.5%', lat: '13.0815° N', lon: '80.2691° E', risk: 'Moderate', depth: '36.8 m' },
]

export default function Hero() {
  const reduce = usePrefersReducedMotion()
  const [selectedDet, setSelectedDet] = useState(0)

  const scrollToApproach = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-ocean-depth">
      {/* Real-time Sonar Waterfall Canvas Background */}
      <div className="absolute inset-0 -z-10 opacity-40 mix-blend-screen">
        <SonarWaterfall />
      </div>
      
      {/* Bathymetry Depth Lines Overlay */}
      <div className="absolute inset-0 -z-10 bg-bathymetry-grid opacity-60" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-abyss/80 via-abyss/60 to-abyss" aria-hidden="true" />

      <Container className="grid min-h-[calc(100svh-4rem)] items-center gap-12 py-16 lg:grid-cols-12 lg:py-20">
        <Reveal className="lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-glow/30 bg-deep/80 px-3 py-1 text-[11px] font-mono text-cyan-glow backdrop-blur-sm">
            <span className="size-2 rounded-full bg-cyan-glow animate-pulse" />
            <span>AQUASCAN SEABED INTELLIGENCE</span>
          </div>

          <h1 className="mt-5 max-w-[15ch] font-sans text-4xl font-semibold leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-6xl">
            Finding what matters on the seafloor.
          </h1>

          <p className="mt-6 max-w-[50ch] text-base leading-relaxed text-fg-dim sm:text-lg">
            Automated deep-learning detection of ghost nets, derelict gear, and hazards in side-scan sonar imagery.
            Edge-deployable on AUVs, georeferenced in WGS84/UTM, and verified by hydrographic operators.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded bg-signal px-5 py-3 text-sm font-medium text-white no-underline transition-all hover:bg-signal-hover hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              <span>Explore Dashboard</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={scrollToApproach}
              className="flex items-center gap-2 rounded border border-line-strong bg-deep/60 px-5 py-3 text-sm font-medium text-fg transition-all hover:border-cyan-glow/40 hover:text-white"
            >
              <span>Pipeline & Journey</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 border-t border-line/60 pt-6 font-mono text-[11px]">
            <div>
              <p className="text-fg-faint">MODEL SPEED</p>
              <p className="mt-1 text-sm font-semibold text-fg">224 ms <span className="text-[10px] text-teal-glow">CPU</span></p>
            </div>
            <div>
              <p className="text-fg-faint">MAP GAIN</p>
              <p className="mt-1 text-sm font-semibold text-emerald-400">+57% <span className="text-[10px] text-fg-faint">mAP50</span></p>
            </div>
          </div>
        </Reveal>

        {/* Real Sonar Telemetry & Detection Card */}
        <Reveal delay={150} className="lg:col-span-6">
          <div className="relative rounded-lg border border-line-strong bg-deep/90 p-3.5 shadow-2xl backdrop-blur-md">
            {/* Telemetry Header */}
            <div className="flex items-center justify-between border-b border-line pb-3 font-mono text-[11px] text-fg-dim">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-fg">SSS FEED</span>
                <span className="text-fg-faint">| PORT & STBD SWATH</span>
              </div>
              <div className="text-cyan-glow">
                ALT: 8.2m · FREQ: 455kHz
              </div>
            </div>

            {/* Real Sonar Image */}
            <div className="relative mt-3 overflow-hidden rounded border border-line bg-abyss">
              <img
                src="/landing/hero-review.jpg"
                alt="Side-Scan Sonar Real Target Detection"
                className="w-full object-cover max-h-[300px]"
              />
              
              {/* Sonar Center Nadir Line Indicator */}
              <div className="absolute inset-y-0 left-1/2 w-px bg-yellow-500/40 border-r border-dashed border-yellow-400/60 pointer-events-none">
                <span className="absolute bottom-1 left-1.5 font-mono text-[8px] text-yellow-300 uppercase tracking-widest">
                  NADIR
                </span>
              </div>
            </div>

            {/* Interactive Target Selector */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {HERO_DETECTIONS.map((det, idx) => (
                <button
                  key={det.id}
                  type="button"
                  onClick={() => setSelectedDet(idx)}
                  className={`rounded border p-2 text-left transition-all ${
                    selectedDet === idx
                      ? 'border-cyan-glow bg-surface text-fg shadow-[0_0_10px_rgba(2,132,199,0.15)]'
                      : 'border-line bg-deep/40 text-fg-dim hover:border-line-strong'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="font-semibold text-cyan-glow">{det.id}</span>
                    <span className={det.risk === 'Critical' ? 'text-red-400' : 'text-amber-400'}>{det.risk}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium truncate text-fg">{det.class}</p>
                  <p className="font-mono text-[9px] text-fg-faint">{det.conf} conf · {det.depth}</p>
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>

      {/* Sub-strip Bar */}
      <div className="border-t border-line bg-deep/40 backdrop-blur-sm">
        <Container className="flex flex-wrap items-center gap-x-6 gap-y-1 py-3 font-mono text-[11px] text-fg-faint">
          <span>SSS · 100 m swath</span>
          <span>Ground-range corrected</span>
          <span>WGS84 → UTM Zone 44N</span>
          <span>Unified YOLO Debris Taxonomy</span>
        </Container>
      </div>
    </section>
  )
}
