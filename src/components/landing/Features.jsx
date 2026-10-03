import { useState } from 'react'
import { Container, Eyebrow, Reveal } from './primitives.jsx'

const REAL_DEBRIS_GALLERY = [
  {
    id: 'TGT-NET-01',
    name: 'Submerged Ghost Net',
    class: 'Ghost Net / Derelict Gear',
    risk: 'Critical Risk (0.94)',
    riskColor: 'text-red-400 border-red-500/40 bg-red-500/10',
    coords: '13.0827° N, 80.2707° E',
    depth: '38.4 m',
    image: '/landing/sonar-net-detection.png',
    desc: 'Dense acoustic entanglement shadow trailing across seafloor ridges. Severe hazard to marine fauna and subsea propellers.',
  },
  {
    id: 'TGT-WRK-02',
    name: 'Historic Shipwreck Hull',
    class: 'Subsea Shipwreck',
    risk: 'High Risk (0.89)',
    riskColor: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
    coords: '13.0841° N, 80.2735° E',
    depth: '41.2 m',
    image: '/samples/shipwreck1.jpeg',
    desc: 'Intact metallic hull structure casting broad acoustic shadow corridor. Navigational hazard for shallow trawling.',
  },
  {
    id: 'TGT-POT-03',
    name: 'Derelict Crab Pot Array',
    class: 'Lost Fishing Gear',
    risk: 'Moderate Risk (0.76)',
    riskColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    coords: '13.0815° N, 80.2691° E',
    depth: '36.8 m',
    image: '/samples/sss-crabpot1.jpg',
    desc: 'Periodic high-reflectivity acoustic points with line shadows. Causes continuous ghost-fishing cycle if unrecovered.',
  },
  {
    id: 'TGT-ANC-04',
    name: 'Lost Anchor & Heavy Cable',
    class: 'Heavy Marine Debris',
    risk: 'Moderate Risk (0.68)',
    riskColor: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
    coords: '13.0850° N, 80.2719° E',
    depth: '44.0 m',
    image: '/samples/sss-anchor6.jpg',
    desc: 'High-density acoustic specular reflection with drag furrow. Poses anchor-snag risks for commercial vessels.',
  },
  {
    id: 'TGT-MIN-05',
    name: 'Subsea Ordnance Contact',
    class: 'Mine / Unexploded Ordnance',
    risk: 'Critical Risk (0.96)',
    riskColor: 'text-red-400 border-red-500/40 bg-red-500/10',
    coords: '13.0802° N, 80.2680° E',
    depth: '47.5 m',
    image: '/samples/sss-mine4.jpg',
    desc: 'Cylindrical acoustic signature with distinct sharp cutoff shadow. Immediate priority quarantine for naval clearance.',
  },
  {
    id: 'TGT-CRL-06',
    name: 'Protected Deep Coral Bed',
    class: 'Environmental Buffer Zone',
    risk: 'Eco Protected Zone',
    riskColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    coords: '13.0872° N, 80.2750° E',
    depth: '32.1 m',
    image: '/samples/coral.jpg',
    desc: 'Sensitive biogenic reef structure. System auto-flags high-debris proximity to protect benthic biodiversity.',
  },
]

const CORE_CAPABILITIES = [
  {
    title: 'One Unified YOLO Model',
    body: 'Trained simultaneously across the complete debris taxonomy — ghost nets, wrecks, crab pots, and ordnance — eliminating brittle per-class heuristics while NMS merges overlapping bounding boxes.',
    spec: 'YOLO26n · Single Pass · IoU 0.5',
  },
  {
    title: 'Precision Georeferencing',
    body: 'Transforms pixel slant-range into vessel-relative UTM coordinates using real-time AUV navigation telemetry and towfish altitude corrections.',
    spec: 'PyProj · WGS84 / UTM Zone 44N',
  },
  {
    title: 'Explainable Sonar Preprocessing',
    body: 'Inspect each preprocessing phase on the active waterfall tile: per-column gain equalization, shadow corridor isolation, and CLAHE contrast enhancement.',
    spec: 'Column Norm · CLAHE · Shadow Gain',
  },
  {
    title: 'Automated 3-Tier Risk Triage',
    body: 'Categorizes detections into Auto-Confirmed, Needs-Review, or Rejected, allowing hydrographic operators to prioritize ambiguous targets first.',
    spec: 'Confidence & Risk Scoring Engine',
  },
  {
    title: 'Human-in-the-Loop Feedback',
    body: 'Operator verifications and rejections automatically export into formatted YOLO annotation sets and hard negatives to retrain future model iterations.',
    spec: 'YOLO Labels · Active Hard-Negatives',
  },
  {
    title: 'Survey-Grade Export Package',
    body: 'Instant generation of GIS-ready CSV, GeoJSON, and KML layers, alongside multi-page official hydrographic survey PDF deliverables.',
    spec: 'CSV · GeoJSON · KML · Hydrographic PDF',
  },
]

export default function Features() {
  const [selectedDebris, setSelectedDebris] = useState(0)
  const target = REAL_DEBRIS_GALLERY[selectedDebris]

  return (
    <section id="capabilities" className="relative border-b border-line bg-abyss py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-ocean-depth opacity-40" aria-hidden="true" />

      <Container className="relative space-y-20">
        {/* Section Header */}
        <div className="grid gap-6 lg:grid-cols-12 items-end">
          <Reveal className="lg:col-span-5">
            <Eyebrow index="03">System Capabilities & Risk Mapping</Eyebrow>
            <h2 className="mt-4 font-sans text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-4xl">
              Real Debris Detections & Geospatial Risk Zones.
            </h2>
          </Reveal>
          <Reveal delay={100} className="lg:col-span-6 lg:col-start-7">
            <p className="max-w-[56ch] leading-relaxed text-fg-dim">
              Explore authentic side-scan sonar targets detected on the ocean floor and mapped directly into bathymetric hazard zones.
            </p>
          </Reveal>
        </div>

        {/* Real Sonar Target Gallery & Risk Zone Map Showcase */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left: Interactive Real Debris Gallery */}
          <Reveal className="lg:col-span-7">
            <div className="rounded-lg border border-line-strong bg-deep/90 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-line pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-fg">{target.id}</span>
                    <span className={`font-mono text-[10.5px] px-2 py-0.5 rounded border ${target.riskColor}`}>
                      {target.risk}
                    </span>
                  </div>
                  <h3 className="mt-1 font-sans text-lg font-semibold text-fg">{target.name}</h3>
                </div>

                <div className="text-right font-mono text-[11px] text-fg-faint">
                  <p className="text-cyan-glow">{target.coords}</p>
                  <p>Depth: {target.depth}</p>
                </div>
              </div>

              {/* Real Imagery Display */}
              <div className="relative mt-4 overflow-hidden rounded border border-line bg-abyss">
                <img
                  src={target.image}
                  alt={target.name}
                  className="w-full object-cover max-h-[320px] transition-all duration-300"
                />
                <div className="absolute bottom-3 left-3 bg-abyss/85 backdrop-blur-sm border border-line/80 px-2.5 py-1 rounded font-mono text-[10px] text-fg-dim">
                  TAXONOMY: {target.class}
                </div>
              </div>

              <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-fg-dim">
                {target.desc}
              </p>

              {/* Target Thumbnails Grid */}
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2 border-t border-line/60 pt-3.5">
                {REAL_DEBRIS_GALLERY.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedDebris(idx)}
                    className={`relative overflow-hidden rounded border p-1 transition-all ${
                      selectedDebris === idx
                        ? 'border-cyan-glow ring-1 ring-cyan-glow bg-surface'
                        : 'border-line bg-abyss/50 opacity-70 hover:opacity-100 hover:border-line-strong'
                    }`}
                  >
                    <img src={item.image} alt={item.name} className="h-10 w-full object-cover rounded" />
                    <p className="mt-1 font-mono text-[8.5px] truncate text-center text-fg-dim">{item.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Right: Georeferenced Risk Zone Map Card */}
          <Reveal delay={120} className="lg:col-span-5">
            <div className="rounded-lg border border-line-strong bg-deep/90 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-line pb-3.5 font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-cyan-glow animate-pulse" />
                  <span className="font-semibold text-fg">GIS BATHYMETRY & RISK MAP</span>
                </div>
                <span className="text-fg-faint">WGS84 UTM</span>
              </div>

              <div className="relative mt-4 overflow-hidden rounded border border-line bg-abyss">
                <img
                  src="/landing/map.jpg"
                  alt="Georeferenced Risk Zones on Basemap"
                  className="w-full object-cover max-h-[250px]"
                />
                
                {/* Risk Map Legend Overlay */}
                <div className="absolute bottom-2 left-2 bg-abyss/90 backdrop-blur-sm border border-line p-2 rounded text-[10px] font-mono space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-red-500" />
                    <span className="text-fg">Critical Risk (Nets & Mines)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-orange-500" />
                    <span className="text-fg">High Risk (Wrecks & Pots)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-blue-500" />
                    <span className="text-fg">Survey Swath Track</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-fg-dim border-b border-line/40 pb-2">
                  <span>Mapped Transects</span>
                  <span className="font-semibold text-fg">12 Sonar Survey Lines</span>
                </div>
                <div className="flex items-center justify-between text-fg-dim border-b border-line/40 pb-2">
                  <span>Verified Contacts</span>
                  <span className="font-semibold text-cyan-glow">47 Subsea Targets</span>
                </div>
                <div className="flex items-center justify-between text-fg-dim">
                  <span>Export Formats</span>
                  <span className="font-semibold text-fg">CSV · GeoJSON · KML · PDF</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* 6 Core Capability Cards */}
        <div>
          <h3 className="font-sans text-xl font-semibold text-fg mb-6">
            Engineered for Survey Teams & Coastal Authorities
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_CAPABILITIES.map((f, i) => (
              <Reveal
                key={f.title}
                delay={i * 50}
                className="group rounded-lg border border-line bg-deep/60 p-5 hover:border-line-strong hover:bg-deep transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-fg-faint">{String(i + 1).padStart(2, '0')}</span>
                  <span className="size-1.5 rounded-full bg-cyan-glow/60 group-hover:bg-cyan-glow" />
                </div>
                <h4 className="mt-3 font-sans text-base font-semibold text-fg group-hover:text-cyan-glow transition-colors">
                  {f.title}
                </h4>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-fg-dim">
                  {f.body}
                </p>
                <p className="mt-4 font-mono text-[10px] text-fg-faint border-t border-line/50 pt-2.5">
                  {f.spec}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
