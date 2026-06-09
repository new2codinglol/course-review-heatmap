import { describe, it, expect } from 'vitest'
import { bucketGrades } from './GradeChart'

describe('bucketGrades', () => {
  it('buckets grade_points into letter bands', () => {
    const reviews = [{ grade_points: 4 }, { grade_points: 3.7 }, { grade_points: 3.3 }, { grade_points: 2.0 }]
    const b = bucketGrades(reviews)
    expect(b['A']).toBe(1)
    expect(b['A-']).toBe(1)
    expect(b['B+']).toBe(1)
    expect(b['C']).toBe(1)
  })
  it('returns all-zero bands for empty input', () => {
    expect(bucketGrades([]).A).toBe(0)
  })
})
