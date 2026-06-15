const inRange = (v, lo, hi) => typeof v === 'number' && !Number.isNaN(v) && v >= lo && v <= hi

export function validateReview(r) {
  const errors = {}
  if (!r.course_id) errors.course_id = 'Select a course'
  if (!r.semester_id) errors.semester_id = 'Select a semester'
  if (!inRange(r.professor_rating, 1, 5)) errors.professor_rating = 'Rating must be 1–5'
  if (!inRange(r.grade_points, 0, 4)) errors.grade_points = 'GPA must be 0–4'
  if (!inRange(r.workload, 1, 5)) errors.workload = 'Workload must be 1–5'
  if (typeof r.attendance_required !== 'boolean') errors.attendance_required = 'Required'
  if (r.attendance_required) {
    if (!inRange(r.attendance_pct, 0, 100)) errors.attendance_pct = 'Enter 0–100%'
  }
  if (r.notes && r.notes.length > 1000) errors.notes = 'Max 1000 characters'
  return { ok: Object.keys(errors).length === 0, errors }
}
