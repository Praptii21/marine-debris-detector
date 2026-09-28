import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Eyebrow, Reveal } from './primitives.jsx'

const SCREENS = [
  {
    id: 'map-gis',
    title: 'Geospatial Risk Map & Bathymetry Layer',
    badge: 'GIS MAPPING & RISK ZONES',
    url: 'aquascan.niot.gov.in/app/map',
    image: '/landing/map.jpg',
    description:
      'Real-time projection of every detected sonar target on satellite and bathymetric charts. Color-coded risk hazard polygons automatically highlight critical ghost-net entanglement corridors and navigation hazards.',
    specs: [
      { label: 'Projection', val: 'WGS84 → UTM Zone 44N' },
      { label: 'Risk Model', val: 'Density & Depth Heatmap' },
      { label: 'Layer Controls', val: 'Satellite · Bathymetry · SSS Track' },
      { label: 'Export Options', val: 'KML · GeoJSON · CSV GIS' },
    ],
    route: '/dashboard/map',
  },
  {
    id: 'triage-review',
    title: 'Operator Triage & Waterfall Detection Review',
    badge: 'HUMAN-IN-THE-LOOP TRIAGE',
    url: 'aquascan.niot.gov.in/app/review',
    image: '/landing/hero-review.jpg',
    description:
      'Hydrographic surveyors review YOLO detections directly on the continuous side-scan sonar waterfall. Fast keyboard triage shortcuts allow operators to confirm, reclassify, or draw missed targets with sub-meter spatial accuracy.',
    specs: [
      { label: 'Inference Latency', val: '224 ms / tile (CPU)' },
      { label: 'Confidence Filter', val: 'Adjustable 0.30 - 0.95' },
      { label: 'Review States', val: 'Auto-Confirm · Needs-Review · Reject' },
      { label: 'Active Retraining', val: 'Auto-generates YOLO Labels' },
    ],
    route: '/dashboard/review',
  },
  {
    id: 'preprocessing-pipeline',
    title: 'Explainable Acoustic Preprocessing Inspector',
    badge: 'ACOUSTIC NORMALIZATION',
    url: 'aquascan.niot.gov.in/app/pipeline',
    image: '/landing/pipeline.jpg',
    description:
      'Inspect stage-by-stage transformations on raw sonar data: along-track gain normalization, CLAHE contrast expansion, and acoustic shadow segmentation to understand exactly why a contact was flagged.',
    specs: [
      { label: 'Gain Normalization', val: 'Per-column Equalization' },
      { label: 'Contrast Method', val: 'Sonar-aware CLAHE 2.5' },
      { label: 'Performance Gain', val: '+57% mAP50 Accuracy' },
      { label: 'Raw Formats', val: 'XTF · JSF · SEG-Y · GeoTIFF' },
    ],
    route: '/dashboard/pipeline',
  },
]

export default function PlatformShowcase() {
  const [activeScreenIndex, setActiveScreenIndex] = useState(0)
  const current = SCREENS[activeScreenIndex]

  return (
    <section id="platform-screens" className="relative border-b border-line bg-abyss py-20 lg:py-28">
      {/* Subtle depth gradient & sonar grid */}
      <div className="pointer-events-none absolute inset-0 bg-ocean-depth opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-bathymetry-grid opacity-20" aria-hidden="true" />

      <Container className="relative">
        {/* Section Header */}
        <div className="grid gap-6 lg:grid-cols-12 items-end">
          <Reveal className="lg:col-span-6">
            <Eyebrow index="03">Platform Interface</Eyebrow>
            <h2 className="mt-4 font-sans text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-4xl">
              Engineered for Hydrographers & Marine Scientists.
            </h2>
          </Reveal>
          <Reveal delay={100} className="lg:col-span-6">
            <p className="max-w-[54ch] leading-relaxed text-fg-dim">
              Explore the core desktop workstations of the AquaScan platform: from autonomous sonar ingestion and waterfall review to GIS geospatial risk mapping.
            </p>
          </Reveal>
        </div>

        {/* Screen Selector Tabs */}
        <Reveal delay={120} className="mt-10 flex flex-wrap gap-2.5 border-b border-line pb-4">
          {SCREENS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveScreenIndex(idx)}
              className={`flex items-center gap-2.5 rounded px-4 py-2.5 font-mono text-xs transition-all duration-200 ${
                activeScreenIndex === idx
                  ? 'border border-cyan-glow/50 bg-surface text-fg shadow-[0_0_15px_rgba(2,132,199,0.2)] font-semibold'
                  : 'border border-line bg-deep/60 text-fg-dim hover:border-line-strong hover:text-fg'
              }`}
            >
              <span className={`size-2 rounded-full ${activeScreenIndex === idx ? 'bg-cyan-glow animate-pulse' : 'bg-fg-faint'}`} />
              <span>{s.title}</span>
            </button>
          ))}
        </Reveal>

        {/* Desktop Computer Workstation Frame Layout */}
        <Reveal delay={160} className="mt-8">
          <div className="overflow-hidden rounded-xl border border-line-strong bg-deep/95 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-md">
            {/* Browser / Workstation Window Top Bar */}
            <div className="flex items-center justify-between border-b border-line bg-abyss-dark/90 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-500/80 inline-block" />
                <span className="size-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-3 hidden sm:inline font-mono text-[11px] text-fg-faint">
                  AquaScan Workstation 2.4 · Hydrographic Edition
                </span>
              </div>

              {/* Address / URL Bar */}
              <div className="flex items-center gap-2 rounded border border-line bg-abyss px-3 py-1 font-mono text-[11px] text-fg-dim shadow-inner">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-glow">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-cyan-glow">https://</span>
                <span className="text-fg">{current.url}</span>
              </div>

              <div className="hidden md:flex items-center gap-2 font-mono text-[10.5px] text-emerald-500">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>ONLINE · AUV LINKED</span>
              </div>
            </div>

            {/* Screen Content & Details Layout */}
            <div className="grid lg:grid-cols-12 gap-6 p-6 items-center">
              {/* Screen Image in Monitor Frame */}
              <div className="lg:col-span-8 overflow-hidden rounded-lg border border-line bg-abyss shadow-2xl relative group">
                <img
                  src={current.image}
                  alt={current.title}
                  className="w-full object-cover max-h-[440px] transition-transform duration-500 group-hover:scale-[1.01]"
                />
                <div className="absolute top-3 left-3 bg-abyss/90 backdrop-blur-sm border border-line px-3 py-1 rounded font-mono text-[10.5px] text-cyan-glow">
                  {current.badge}
                </div>
              </div>

              {/* Right Side Specs & Details */}
              <div className="lg:col-span-4 space-y-5">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-glow">
                    {current.badge}
                  </span>
                  <h3 className="mt-1 font-sans text-xl font-semibold text-fg">
                    {current.title}
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-fg-dim">
                    {current.description}
                  </p>
                </div>

                {/* Specs List */}
                <div className="rounded border border-line bg-abyss/70 p-4 space-y-2.5 font-mono text-xs">
                  {current.specs.map((item) => (
                    <div key={item.label} className="flex items-center justify-between border-b border-line/40 pb-1.5 last:border-b-0 last:pb-0">
                      <span className="text-fg-faint">{item.label}</span>
                      <span className="text-fg font-medium">{item.val}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Link
                    to="/dashboard"
                    className="flex items-center justify-center gap-2 w-full rounded bg-signal/20 border border-cyan-glow/40 px-4 py-2.5 font-mono text-xs font-semibold text-cyan-glow hover:bg-signal/30 hover:border-cyan-glow transition-all no-underline shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  >
                    <span>Launch Live Interactive View</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom 3-Screen Thumbnails Switcher */}
            <div className="grid grid-cols-3 border-t border-line bg-abyss/60 p-3 gap-3">
              {SCREENS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveScreenIndex(idx)}
                  className={`flex items-center gap-3 p-2 rounded border transition-all text-left ${
                    activeScreenIndex === idx
                      ? 'border-cyan-glow bg-surface ring-1 ring-cyan-glow'
                      : 'border-line bg-deep/40 opacity-70 hover:opacity-100 hover:border-line-strong'
                  }`}
                >
                  <img src={s.image} alt={s.title} className="size-10 sm:size-12 object-cover rounded border border-line/50 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-cyan-glow uppercase tracking-wider truncate">Screen {idx + 1}</p>
                    <p className="font-sans text-xs font-medium text-white truncate">{s.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
