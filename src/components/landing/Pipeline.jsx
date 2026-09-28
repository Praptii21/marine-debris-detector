import { useState } from 'react'
import { Container, Eyebrow, Reveal } from './primitives.jsx'

const STAGES = [
  {
    num: '01',
    label: 'Sonar Ingest',
    tag: 'RAW ACOUSTIC STREAM',
    detail: 'Raw side-scan sonar waterfall exports (XTF, JSF, SEG-Y) or image tiles ingested with time-synchronized navigation fixes.',
    spec: ['XTF', 'JSF', 'SEG-Y', 'PNG / GeoTIFF'],
    image: '/samples/sss1.jpg',
    metric: '100m Swath · 455 kHz',
    outcome: 'Raw port/stbd acoustic waterfall lines decoded and buffered.',
  },
  {
    num: '02',
    label: 'Acoustic Preprocessing',
    tag: 'DENOISE & NORMALIZATION',
    detail: 'Per-column gain equalization removes along-track beam striping. Sonar-aware CLAHE elevates shadow contrast without clipping target highlight returns.',
    spec: ['Column Norm', 'CLAHE 2.5', 'Shadow Isolation'],
    image: '/landing/pipeline.jpg',
    metric: '+57% mAP50 Gain',
    outcome: 'Normalized imagery with distinct highlight and acoustic shadow corridors.',
  },
  {
    num: '03',
    label: 'YOLO AI Detection',
    tag: 'MULTI-CLASS TAXONOMY',
    detail: 'Lightweight YOLO26 nano model trained across ghost nets, shipwrecks, crab pots, and ordnance runs inference on each tile in 224ms.',
    spec: ['Ghost Nets', 'Shipwrecks', 'Mines', 'Crab Pots', 'IoU 0.5'],
    image: '/landing/sonar-net-detection.png',
    metric: '224ms CPU · 5.3 MB',
    outcome: 'Classified bounding boxes with confidence scores and shadow geometry.',
  },
  {
    num: '04',
    label: 'Georeferencing & Risk',
    tag: 'SPATIAL PROJECTION',
    detail: 'Pixel positions are transformed to slant-range, corrected for towfish altitude, and projected into WGS84/UTM coordinates with depth-aware risk zones.',
    spec: ['PyProj', 'WGS84 → UTM 44N', 'Slant-to-Ground'],
    image: '/landing/map.jpg',
    metric: 'WGS84 → UTM 44N',
    outcome: 'Geolocated risk points plotted on the geospatial risk map.',
  },
  {
    num: '05',
    label: 'Operator Triage & Export',
    tag: 'HUMAN-IN-THE-LOOP',
    detail: 'Surveyor confirms, adjusts, or marks missed contacts. Exports hydrographic-compliant PDF reports, KML GIS layers, and YOLO retraining datasets.',
    spec: ['Auto-Triage', 'KML / GeoJSON', 'PDF Survey Deliverable'],
    image: '/landing/hero-review.jpg',
    metric: 'Instant PDF / KML Export',
    outcome: 'Official hydrographic survey package and hard-negative loop.',
  },
]

export default function Pipeline() {
  const [activeStage, setActiveStage] = useState(0)
  const current = STAGES[activeStage]

  return (
    <section id="how-it-works" className="relative scroll-mt-14 border-b border-line bg-ocean-depth py-20 lg:py-28">
      {/* Background sonar grid */}
      <div className="pointer-events-none absolute inset-0 bg-bathymetry-grid opacity-30" aria-hidden="true" />

      <Container className="relative">
        <div className="grid gap-6 lg:grid-cols-12 items-end">
          <Reveal className="lg:col-span-6">
            <Eyebrow index="02">Detection Roadmap</Eyebrow>
            <h2 className="mt-4 font-sans text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-4xl">
              The Journey from Acoustic Ping to Actionable Survey.
            </h2>
          </Reveal>
          <Reveal delay={100} className="lg:col-span-6 lg:pt-0">
            <p className="max-w-[54ch] leading-relaxed text-fg-dim">
              Explore how raw underwater sound waves transform into georeferenced hazard maps and recovery deliverables through our 5-phase edge pipeline.
            </p>
          </Reveal>
        </div>

        {/* Animated Roadmap Milestone Track & Cards */}
        <div className="mt-14 space-y-6">
          {/* Top Milestone Track with Dotted Connecting Lines and Directional Arrows */}
          <div className="hidden lg:grid grid-cols-5 relative items-center mb-2 px-6">
            {/* Continuous background track behind nodes */}
            <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-0.5 z-0 pointer-events-none">
              <svg className="w-full h-4 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 16">
                <line x1="0" y1="8" x2="1000" y2="8" stroke="#1e2e3e" strokeWidth="2" />
                <line
                  x1="0"
                  y1="8"
                  x2="1000"
                  y2="8"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  className="animate-flow-dashes opacity-90"
                />
              </svg>
            </div>

            {/* 5 Milestone Step Nodes */}
            {STAGES.map((st, i) => {
              const isActive = activeStage === i
              const isPast = activeStage > i
              return (
                <div key={st.num} className="relative z-10 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setActiveStage(i)}
                    className={`size-10 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? 'bg-cyan-glow text-black ring-4 ring-cyan-glow/25 shadow-[0_0_18px_rgba(6,182,212,0.8)] scale-110'
                        : isPast
                        ? 'bg-deep border-2 border-cyan-glow/60 text-cyan-glow'
                        : 'bg-deep border-2 border-line text-fg-faint hover:border-line-strong hover:text-fg'
                    }`}
                  >
                    {st.num}
                  </button>
                  <span className={`mt-2 font-mono text-[10px] uppercase tracking-wider ${isActive ? 'text-cyan-glow font-bold' : 'text-fg-faint'}`}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Roadmap Stage Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 relative z-10">
            {STAGES.map((stage, i) => {
              const isActive = activeStage === i
              return (
                <Reveal
                  key={stage.label}
                  delay={i * 70}
                  className={`group relative flex flex-col justify-between rounded-lg border p-4.5 transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'border-cyan-glow bg-surface shadow-[0_0_22px_rgba(6,182,212,0.22)] -translate-y-2'
                      : 'border-line bg-deep/80 hover:border-line-strong hover:bg-deep hover:-translate-y-1'
                  }`}
                  onClick={() => setActiveStage(i)}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded border transition-colors ${
                          isActive
                            ? 'border-cyan-glow bg-cyan-glow/20 text-cyan-glow'
                            : 'border-line text-fg-faint group-hover:text-fg-dim'
                        }`}
                      >
                        STAGE {stage.num}
                      </span>
                      {isActive && (
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 font-sans text-base font-semibold text-fg group-hover:text-cyan-glow transition-colors">
                      {stage.label}
                    </h3>
                    <p className="mt-1 font-mono text-[10px] tracking-wide text-cyan-glow/70">
                      {stage.tag}
                    </p>

                    <p className="mt-3 text-xs leading-relaxed text-fg-dim line-clamp-3">
                      {stage.detail}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-line/60 pt-3">
                    <div className="flex flex-wrap gap-1 font-mono text-[10px] text-fg-faint">
                      {stage.spec.slice(0, 2).map((s) => (
                        <span key={s} className="bg-abyss/80 px-1.5 py-0.5 rounded border border-line/40">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>

        {/* Live Stage Inspection Display */}
        <Reveal delay={180} className="mt-10">
          <div className="rounded-lg border border-line-strong bg-deep/90 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded bg-signal/20 border border-cyan-glow/40 flex items-center justify-center font-mono font-bold text-sm text-cyan-glow">
                  {current.num}
                </div>
                <div>
                  <h4 className="font-sans text-lg font-semibold text-fg">
                    Phase {current.num}: {current.label} Output Inspection
                  </h4>
                  <p className="font-mono text-[11px] text-fg-faint">
                    {current.outcome}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="rounded border border-cyan-glow/30 bg-abyss px-3 py-1 text-cyan-glow">
                  {current.metric}
                </span>
                <span className="text-fg-faint hidden sm:inline">
                  Click any stage card above to inspect
                </span>
              </div>
            </div>

            <div className="mt-5 grid lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 overflow-hidden rounded border border-line bg-abyss">
                <div className="relative">
                  <img
                    src={current.image}
                    alt={`${current.label} preview`}
                    className="w-full object-cover max-h-[380px]"
                  />
                  <div className="absolute top-3 left-3 bg-abyss/80 backdrop-blur-sm border border-line px-2.5 py-1 rounded font-mono text-[10px] text-fg-dim">
                    LIVE INSPECT: {current.tag}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-4 font-mono text-xs">
                <div className="rounded border border-line bg-abyss/60 p-3.5">
                  <p className="text-fg-faint text-[10px] uppercase">Processing Specifications</p>
                  <ul className="mt-2 space-y-1.5 text-fg-dim">
                    {current.spec.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-cyan-glow" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded border border-line bg-abyss/60 p-3.5">
                  <p className="text-fg-faint text-[10px] uppercase">Data Pipeline Status</p>
                  <div className="mt-2 flex items-center justify-between text-white">
                    <span>Edge Acceleration</span>
                    <span className="text-emerald-400 font-semibold">OPTIMIZED</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-white">
                    <span>Survey Verifiability</span>
                    <span className="text-cyan-glow font-semibold">100% AUDITABLE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
