import { describe, it, expect } from 'vitest'
import { METRICS, getMetric } from './metrics'

describe('metrics', () => {
  it('defines the four metrics with domains and stat keys', () => {
    expect(METRICS.map((m) => m.key)).toEqual(['rating','gpa','workload','attendance'])
  })
  it('maps each metric to its stats-view column', () => {
    expect(getMetric('rating').statKey).toBe('avg_rating')
    expect(getMetric('gpa').statKey).toBe('avg_gpa')
    expect(getMetric('workload').statKey).toBe('avg_workload')
    expect(getMetric('attendance').statKey).toBe('pct_attendance_required')
  })
  it('exposes domain [min,max] and direction label for the legend', () => {
    expect(getMetric('rating').domain).toEqual([1, 5])
    expect(getMetric('workload').legend).toMatch(/light/i)
  })
})
