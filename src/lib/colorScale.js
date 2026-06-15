const EMPTY = 'oklch(0.30 0.005 264)' // neutral gray for no-data cells

// low end (dark teal) -> high end (bright yellow-green): monotonic lightness
const LOW  = { l: 0.35, c: 0.08, h: 200 }
const HIGH = { l: 0.88, c: 0.17, h: 120 }

const lerp = (a, b, t) => a + (b - a) * t

export function heatColor(value, [min, max]) {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY
  const clamped = Math.min(max, Math.max(min, value))
  const t = max === min ? 0 : (clamped - min) / (max - min)
  const l = lerp(LOW.l, HIGH.l, t).toFixed(3)
  const c = lerp(LOW.c, HIGH.c, t).toFixed(3)
  const h = lerp(LOW.h, HIGH.h, t).toFixed(1)
  return `oklch(${l} ${c} ${h})`
}

export const EMPTY_COLOR = EMPTY
