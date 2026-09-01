// Procedural side-scan sonar placeholder renderer.
//
// This exists only so the UI has something to show before real sonar
// imagery is wired up. Once the backend serves real tiles, pass an
// `imageSrc` to <SonarCanvas> instead of a `scene` — see that component.

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function valueNoise(seed, gw, gh) {
  const r = mulberry32(seed)
  const g = new Float32Array(gw * gh)
  for (let i = 0; i < g.length; i++) g[i] = r()
  return (x, y) => {
    const fx = Math.min(Math.max(x, 0), 0.9999) * (gw - 1)
    const fy = Math.min(Math.max(y, 0), 0.9999) * (gh - 1)
    const x0 = Math.floor(fx), y0 = Math.floor(fy)
    const tx = fx - x0, ty = fy - y0
    const x1 = Math.min(x0 + 1, gw - 1), y1 = Math.min(y0 + 1, gh - 1)
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
    const a = g[y0 * gw + x0] + (g[y0 * gw + x1] - g[y0 * gw + x0]) * sx
    const b = g[y1 * gw + x0] + (g[y1 * gw + x1] - g[y1 * gw + x0]) * sx
    return a + (b - a) * sy
  }
}

// Deep navy -> teal -> pale cyan. Oceanic blue instead of the old amber ramp.
const RAMP = [
  [0, 6, 14, 22],
  [0.32, 12, 46, 66],
  [0.62, 24, 108, 128],
  [0.85, 96, 200, 199],
  [1, 224, 247, 242],
]

function ramp(t) {
  for (let i = 1; i < RAMP.length; i++) {
    if (t <= RAMP[i][0] || i === RAMP.length - 1) {
      const a = RAMP[i - 1], b = RAMP[i]
      const k = Math.min(Math.max((t - a[0]) / (b[0] - a[0] || 1), 0), 1)
      return [
        a[1] + (b[1] - a[1]) * k,
        a[2] + (b[2] - a[2]) * k,
        a[3] + (b[3] - a[3]) * k,
      ]
    }
  }
  return [0, 0, 0]
}

// objects: [{ type: 'net'|'pipe'|'cylinder'|'wreck'|'rock', x, y, w, h }]
// x/y/w/h are fractions (0-1) of the canvas.
export function drawSonarScene(canvas, { seed = 1, nadir = 'center', objects = [] } = {}) {
  const cssW = canvas.clientWidth || 300
  const cssH = canvas.clientHeight || 160
  if (!cssW || !cssH) return
  const dpr = Math.min(window.devicePixelRatio || 1, cssW > 500 ? 1.5 : 2)
  const w = Math.round(cssW * dpr)
  const h = Math.round(cssH * dpr)
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  const rnd = mulberry32(seed * 7919 + 13)
  const n1 = valueNoise(seed + 1, 26, 64)
  const n2 = valueNoise(seed + 2, 9, 22)
  const n3 = valueNoise(seed + 3, 60, 14)

  const nadirX = nadir === 'left' ? 0 : 0.5
  const span = nadir === 'left' ? 1 : 0.5

  const img = ctx.createImageData(w, h)
  const d = img.data

  for (let y = 0; y < h; y++) {
    const v = y / h
    for (let x = 0; x < w; x++) {
      const u = x / w
      const dist = Math.min(Math.abs(u - nadirX) / span, 1)
      let I = 0.3 + 0.3 * Math.pow(1 - dist, 0.7)
      I += 0.2 * (n1(u * 0.9 + 0.05, v) - 0.5)
      I += 0.13 * (n2(u, v) - 0.5)
      I += 0.045 * Math.sin(v * 78 + n3(u, v) * 7) * (0.5 + n2(u, v))
      if (dist < 0.055) I *= 0.12 + 14 * dist * dist

      for (const o of objects) {
        const ox = (u - o.x) / o.w
        const oy = (v - o.y) / o.h
        const side = o.x >= nadirX ? 1 : -1
        if (Math.abs(oy) < 1.05) {
          if (o.type === 'pipe') {
            if (Math.abs(ox) < 1 && Math.abs(oy) < 1) {
              I += 0.42 * (1 - Math.abs(oy)) * (0.85 + 0.3 * n3(u * 2, v * 2))
            }
          } else if (o.type === 'net') {
            if (Math.abs(ox) < 1 && Math.abs(oy) < 1) {
              const mesh = Math.max(0, Math.sin(ox * 15) * Math.sin(oy * 11))
              I += 0.44 * mesh * (1 - 0.35 * (ox * ox + oy * oy))
            }
          } else if (o.type === 'wreck') {
            const r2 = ox * ox + oy * oy
            if (r2 < 1) I += 0.52 * (1 - r2) * (0.55 + 0.9 * n2(u * 3.2, v * 3.2))
          } else {
            const r2 = ox * ox + oy * oy
            if (r2 < 1) I += (o.type === 'rock' ? 0.3 : 0.5) * Math.pow(1 - r2, 0.7)
          }
          const t = (side * (u - o.x)) / o.w
          const SL = o.type === 'rock' ? 1.4 : o.type === 'wreck' ? 3.6 : 2.6
          if (t > 1 && t < 1 + SL && Math.abs(oy) < 0.92) {
            const soft = o.type === 'rock' ? 0.42 : 0.14
            I *= soft + 0.5 * (Math.abs(oy) / 0.92) + 0.34 * ((t - 1) / SL)
          }
        }
      }

      I *= 0.82 + 0.18 * rnd() // fine grain, seeded so it's stable per render
      if (nadir === 'center' && Math.abs(u - nadirX) > 0.02) {
        const ring = Math.abs((u - nadirX) * span * 8) % 1
        if (ring < 0.006) I *= 1.1
      }
      if (n3(u, v) > 0.985) I *= 0.5
      I = I < 0 ? 0 : I > 1 ? 1 : I

      const c = ramp(I)
      const i4 = (y * w + x) * 4
      d[i4] = c[0]
      d[i4 + 1] = c[1]
      d[i4 + 2] = c[2]
      d[i4 + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  if (nadir === 'center') {
    ctx.strokeStyle = 'rgba(224,247,242,0.25)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(w / 2, 0)
    ctx.lineTo(w / 2, h)
    ctx.stroke()
  }
}

// A handful of named placeholder scenes reused across the app until real
// sonar tiles are available. Keyed by scan-line id so each screen shows
// a consistent (if fake) image for the same line.
export const PLACEHOLDER_SCENES = {
  'L-0184': { seed: 5, nadir: 'center', objects: [
    { type: 'net', x: 0.485, y: 0.39, w: 0.09, h: 0.14 },
    { type: 'cylinder', x: 0.68, y: 0.66, w: 0.045, h: 0.08 },
    { type: 'rock', x: 0.18, y: 0.2, w: 0.05, h: 0.06 },
  ]},
  'L-0183': { seed: 12, nadir: 'center', objects: [
    { type: 'rock', x: 0.3, y: 0.5, w: 0.06, h: 0.08 },
  ]},
  'L-0182': { seed: 23, nadir: 'center', objects: [
    { type: 'pipe', x: 0.5, y: 0.44, w: 0.3, h: 0.035 },
  ]},
  'L-0181': { seed: 31, nadir: 'center', objects: [
    { type: 'cylinder', x: 0.32, y: 0.5, w: 0.05, h: 0.09 },
  ]},
  'L-0180': { seed: 44, nadir: 'center', objects: [
    { type: 'wreck', x: 0.55, y: 0.35, w: 0.055, h: 0.1 },
  ]},
  'L-0179': { seed: 51, nadir: 'center', objects: [] },
}
