import { describe, it, expect } from 'vitest'
import { validateReview } from './validation'

const valid = {
  course_id: 'c1', semester_id: 's1',
  professor_rating: 4, grade_points: 3.5, workload: 3,
  attendance_required: true, attendance_pct: 80, notes: 'ok',
}

describe('validateReview', () => {
  it('passes a valid review', () => {
    expect(validateReview(valid)).toEqual({ ok: true, errors: {} })
  })
  it('requires course and semester', () => {
    const r = validateReview({ ...valid, course_id: '' })
    expect(r.ok).toBe(false)
    expect(r.errors.course_id).toBeTruthy()
  })
  it('rejects out-of-range numbers', () => {
    expect(validateReview({ ...valid, professor_rating: 6 }).errors.professor_rating).toBeTruthy()
    expect(validateReview({ ...valid, grade_points: 5 }).errors.grade_points).toBeTruthy()
    expect(validateReview({ ...valid, workload: 0 }).errors.workload).toBeTruthy()
  })
  it('requires attendance_pct only when attendance is required', () => {
    expect(validateReview({ ...valid, attendance_required: true, attendance_pct: null }).errors.attendance_pct).toBeTruthy()
    expect(validateReview({ ...valid, attendance_required: false, attendance_pct: null }).ok).toBe(true)
  })
  it('rejects notes longer than 1000 chars', () => {
    expect(validateReview({ ...valid, notes: 'x'.repeat(1001) }).errors.notes).toBeTruthy()
  })
})
