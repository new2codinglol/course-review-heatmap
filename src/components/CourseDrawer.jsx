import { useEffect } from 'react'
import { useCellDetail } from '../hooks/useCellDetail'
import { GradeChart } from './GradeChart'

const avg = (arr, key) => arr.length ? (arr.reduce((s, r) => s + Number(r[key]), 0) / arr.length) : 0

export function CourseDrawer({ course, semester, onClose }) {
  const open = Boolean(course && semester)
  const { reviews, loading } = useCellDetail(course?.id, semester?.id)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const required = reviews?.some((r) => r.attendance_required)
  const stars = '★'.repeat(Math.round(avg(reviews || [], 'professor_rating'))).padEnd(5, '☆')

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-20" onClick={onClose} aria-hidden />
      <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-surface border-l border-border z-30
                        p-6 overflow-y-auto" role="dialog" aria-label="Course detail">
        <button onClick={onClose} className="float-right text-muted hover:text-accent font-mono">✕</button>
        <h2 className="font-mono text-accent text-lg">{course.code}</h2>
        <p className="text-text">{course.name}</p>
        <p className="text-muted text-xs mb-4">{semester.label} · {course.faculty} / {course.department}</p>

        {loading ? <p className="text-muted font-mono text-sm">Loading…</p> : reviews?.length ? (
          <div className="space-y-4">
            <div className="text-accent font-mono">{stars} <span className="text-muted text-xs">({avg(reviews,'professor_rating').toFixed(1)})</span></div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <Stat label="Avg GPA" value={avg(reviews,'grade_points').toFixed(2)} />
              <Stat label="Workload" value={avg(reviews,'workload').toFixed(1) + ' / 5'} />
              <Stat label="Attendance" value={required ? `Required (${Math.round(avg(reviews.filter(r=>r.attendance_required),'attendance_pct'))}%)` : 'Optional'} />
              <Stat label="Reviews" value={reviews.length} />
            </div>
            <div>
              <p className="text-muted text-xs font-mono mb-2">Grade distribution</p>
              <GradeChart reviews={reviews} />
            </div>
          </div>
        ) : <p className="text-muted font-mono text-sm">No reviews for this cell.</p>}
      </aside>
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-bg border border-border rounded p-2">
      <div className="text-muted">{label}</div>
      <div className="text-text">{value}</div>
    </div>
  )
}
