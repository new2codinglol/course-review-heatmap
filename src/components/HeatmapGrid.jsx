import { HeatmapCell } from './HeatmapCell'
import { getMetric } from '../lib/metrics'

export function HeatmapGrid({ courses, semesters, statsMap, metric, onCellClick, loading }) {
  const m = getMetric(metric)
  const cols = `minmax(11rem,1fr) repeat(${semesters.length}, minmax(2.5rem,1fr))`

  if (loading) {
    return <div className="text-muted font-mono text-sm p-8">Loading heatmap…</div>
  }
  if (courses.length === 0) {
    return <div className="text-muted font-mono text-sm p-8">No courses match these filters.</div>
  }

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <div className="grid min-w-max" style={{ gridTemplateColumns: cols }}>
        {/* header row */}
        <div className="sticky left-0 bg-surface z-10 px-3 py-2 text-muted text-xs font-mono border-b border-border">course</div>
        {semesters.map((s) => (
          <div key={s.id} className="px-1 py-2 text-muted text-[10px] font-mono text-center border-b border-border">
            {s.season.replace('Sem ', 'S')}<br />{String(s.year).slice(2)}
          </div>
        ))}
        {/* body */}
        {courses.map((course, ri) => (
          <Row key={course.id} course={course} semesters={semesters} statsMap={statsMap}
               metric={m} onCellClick={onCellClick} rowIndex={ri} />
        ))}
      </div>
    </div>
  )
}

function Row({ course, semesters, statsMap, metric, onCellClick }) {
  return (
    <>
      <div className="sticky left-0 bg-surface z-10 px-3 py-1 border-b border-border/50 flex flex-col justify-center">
        <span className="font-mono text-accent text-xs">{course.code}</span>
        <span className="text-muted text-[10px] truncate max-w-[9rem]">{course.name}</span>
      </div>
      {semesters.map((s, ci) => {
        const row = statsMap.get(`${course.id}:${s.id}`)
        const value = row ? Number(row[metric.statKey]) : null
        return (
          <div key={s.id} className="border-b border-l border-border/30 fill-in"
               style={{ animationDelay: `${ci * 40}ms` }}>
            <HeatmapCell
              value={value}
              sampleSize={row ? row.sample_size : 0}
              domain={metric.domain}
              unit={metric.unit}
              onClick={() => onCellClick(course.id, s.id)}
            />
          </div>
        )
      })}
    </>
  )
}
