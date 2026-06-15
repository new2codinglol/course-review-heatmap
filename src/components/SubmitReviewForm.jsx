import { useState } from 'react'
import { useSubmitReview } from '../hooks/useSubmitReview'
import { useDialog } from '../hooks/useDialog'

const blank = {
  course_id: '', semester_id: '',
  professor_rating: 3, grade_points: 3, workload: 3,
  attendance_required: false, attendance_pct: 70, notes: '',
}

export function SubmitReviewForm({ courses, semesters, onSubmitted, onClose }) {
  const [form, setForm] = useState(blank)
  const { submit, status, errors } = useSubmitReview()
  const dialogRef = useDialog(onClose)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const num = 'bg-bg border border-border rounded px-2 py-1 w-full font-mono text-sm'

  async function handleSubmit(e) {
    e.preventDefault()
    const res = await submit(form)
    if (res.ok) { onSubmitted(); setForm(blank) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-30" onClick={onClose} aria-hidden />
      <form ref={dialogRef} onSubmit={handleSubmit} role="dialog" aria-modal="true" aria-label="Submit review"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-full max-w-md
                       bg-surface border border-border rounded-lg p-6 space-y-3 max-h-[90vh] overflow-y-auto outline-none">
        <h2 className="font-mono text-accent">submit_review</h2>

        <Field label="Course" error={errors.course_id}>
          <select className={num} value={form.course_id} onChange={(e) => set('course_id', e.target.value)}>
            <option value="">Select…</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </Field>
        <Field label="Semester" error={errors.semester_id}>
          <select className={num} value={form.semester_id} onChange={(e) => set('semester_id', e.target.value)}>
            <option value="">Select…</option>
            {semesters.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
        <Range label={`Professor rating: ${form.professor_rating}`} min={1} max={5} step={0.5}
               value={form.professor_rating} onChange={(v) => set('professor_rating', v)} error={errors.professor_rating} />
        <Range label={`Your GPA: ${form.grade_points}`} min={0} max={4} step={0.1}
               value={form.grade_points} onChange={(v) => set('grade_points', v)} error={errors.grade_points} />
        <Range label={`Workload: ${form.workload}`} min={1} max={5} step={0.5}
               value={form.workload} onChange={(v) => set('workload', v)} error={errors.workload} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.attendance_required}
                 onChange={(e) => set('attendance_required', e.target.checked)} />
          Attendance required
        </label>
        {form.attendance_required && (
          <Field label="Attendance %" error={errors.attendance_pct}>
            <input type="number" className={num} min={0} max={100} value={form.attendance_pct}
                   onChange={(e) => set('attendance_pct', Number(e.target.value))} />
          </Field>
        )}
        <Field label="Notes (optional)" error={errors.notes}>
          <textarea className={num} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>

        {errors.form && <p className="text-red-400 text-xs font-mono">{errors.form}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="text-muted text-sm font-mono">cancel</button>
          <button type="submit" disabled={status === 'submitting'}
                  className="bg-accent text-bg px-4 py-1.5 rounded font-mono text-sm disabled:opacity-50">
            {status === 'submitting' ? 'submitting…' : 'submit'}
          </button>
        </div>
      </form>
    </>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-muted text-xs font-mono mb-1">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
function Range({ label, error, ...props }) {
  return (
    <div>
      <label className="block text-muted text-xs font-mono mb-1">{label}</label>
      <input type="range" className="w-full accent-[oklch(0.78_0.16_75)]"
             {...props} onChange={(e) => props.onChange(Number(e.target.value))} />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
