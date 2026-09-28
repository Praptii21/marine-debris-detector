import { Container, Eyebrow, Reveal, ImageSlot } from './primitives.jsx'

const LINES = [
  {
    label: 'Faster surveys',
    body: 'Operators start from the ambiguous detections instead of scrubbing hours of empty seafloor.',
  },
  {
    label: 'Ghost-net recovery',
    body: 'Contacts carry coordinates and confidence, so recovery crews can be sent to the likeliest sites first.',
  },
  {
    label: 'Safer navigation',
    body: 'Wrecks and mine-like contacts are flagged and positioned before a vessel crosses the line.',
  },
]

const STATS = [
  { val: '10x', label: 'Faster Survey Triage' },
  { val: '±0.4m', label: 'Target GPS Accuracy' },
  { val: '640k', label: 'Tonnes Targeted Annually' },
]

export default function Impact() {
  return (
    <section id="impact" className="relative border-b border-line bg-deep/50 py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-ocean-depth opacity-30" aria-hidden="true" />

      <Container className="relative grid gap-14 lg:grid-cols-12 items-start">
        <div className="lg:col-span-5 space-y-8">
          <Reveal>
            <Eyebrow index="06">Ocean Impact & Conservation</Eyebrow>
            <h2 className="mt-4 font-sans text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-4xl">
              From Detection to Recovery.
            </h2>
          </Reveal>

          {/* Impact Image Card */}
          <Reveal delay={100}>
            <div className="overflow-hidden rounded-lg border border-line-strong bg-abyss p-2 shadow-2xl">
              <div className="relative overflow-hidden rounded">
                <img
                  src="/landing/problem-bg-2.jpg"
                  alt="Ghost net recovery and marine ecosystem protection"
                  className="w-full object-cover max-h-[280px]"
                />
                <div className="absolute bottom-3 left-3 bg-abyss/90 backdrop-blur-sm border border-line px-2.5 py-1 rounded font-mono text-[10.5px] text-cyan-glow">
                  SEABED RESTORATION MISSION
                </div>
              </div>
              <p className="mt-2.5 px-1 font-mono text-[11px] text-fg-faint">
                fig. 4 — field recovery of derelict gear targeted via AquaScan coordinates
              </p>
            </div>
          </Reveal>

          {/* Quick Stats Grid */}
          <Reveal delay={150} className="grid grid-cols-3 gap-3 border-t border-line/60 pt-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-mono text-2xl sm:text-3xl font-bold text-cyan-glow">{s.val}</p>
                <p className="mt-1 font-mono text-[10px] uppercase text-fg-faint">{s.label}</p>
              </div>
            ))}
          </Reveal>
        </div>

        <div className="lg:col-span-7 lg:pl-6 space-y-10">
          <dl className="space-y-2">
            {LINES.map((l, i) => (
              <Reveal
                key={l.label}
                delay={i * 80}
                className="grid gap-2 border-t border-line py-6 first:border-t-0 first:pt-0 sm:grid-cols-[11rem_1fr] sm:gap-6"
              >
                <dt className="font-mono text-[12px] uppercase tracking-[0.1em] text-cyan-glow sm:pt-1">{l.label}</dt>
                <dd className="leading-relaxed text-fg-dim text-sm sm:text-base">{l.body}</dd>
              </Reveal>
            ))}
          </dl>

          <Reveal as="blockquote" className="rounded-lg border-l-4 border-cyan-glow bg-deep p-6 shadow-md border border-line">
            <p className="font-sans text-xl sm:text-2xl font-medium leading-snug tracking-tight text-fg">
              “We don’t replace the sonar expert — we empower the expert to locate and remediate critical hazards in minutes instead of days.”
            </p>
            <p className="mt-3 font-mono text-xs text-fg-faint">
              — AquaScan Mission Protocol · Ministry of Earth Sciences
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

