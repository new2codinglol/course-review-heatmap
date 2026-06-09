import { describe, it, expect } from 'vitest'
import { heatColor } from './colorScale'

describe('heatColor', () => {
  it('returns neutral gray for null/undefined value', () => {
    expect(heatColor(null, [1, 5])).toMatch(/oklch/)
    expect(heatColor(null, [1, 5])).toBe(heatColor(undefined, [1, 5]))
  })
  it('returns an oklch string for in-range values', () => {
    expect(heatColor(3, [1, 5])).toMatch(/^oklch\(/)
  })
  it('is monotonic in lightness across the domain (grayscale-distinguishable)', () => {
    const L = (v) => Number(heatColor(v, [1, 5]).match(/oklch\(([\d.]+)/)[1])
    expect(L(1)).toBeLessThan(L(3))
    expect(L(3)).toBeLessThan(L(5))
  })
  it('clamps out-of-range values to the domain ends', () => {
    expect(heatColor(0, [1, 5])).toBe(heatColor(1, [1, 5]))
    expect(heatColor(9, [1, 5])).toBe(heatColor(5, [1, 5]))
  })
})
