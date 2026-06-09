export function FilterBar({ courses, faculty, department, onFaculty, onDepartment, onClear }) {
  const faculties = ['all', ...new Set(courses.map((c) => c.faculty))]
  const departments = ['all', ...new Set(
    courses.filter((c) => faculty === 'all' || c.faculty === faculty).map((c) => c.department)
  )]
  const sel = 'bg-surface border border-border rounded px-2 py-1.5 text-xs font-mono text-text'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className={sel} value={faculty} onChange={(e) => onFaculty(e.target.value)} aria-label="Faculty">
        {faculties.map((f) => <option key={f} value={f}>{f === 'all' ? 'All faculties' : f}</option>)}
      </select>
      <select className={sel} value={department} onChange={(e) => onDepartment(e.target.value)} aria-label="Department">
        {departments.map((d) => <option key={d} value={d}>{d === 'all' ? 'All departments' : d}</option>)}
      </select>
      {(faculty !== 'all' || department !== 'all') && (
        <button onClick={onClear} className="text-muted hover:text-accent text-xs font-mono underline">clear</button>
      )}
    </div>
  )
}
