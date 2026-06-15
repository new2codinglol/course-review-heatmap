import { HeatmapCell } from './HeatmapCell'
import { getMetric } from '../lib/metrics'

export function HeatmapGrid({ courses, semesters, statsMap, metric, onCellClick, loading }) {
  const m = getMetric(metric)
  const cols = `14rem repeat(${semesters.length}, 3.25rem)`
  const gridStyle = { gridTemplateColumns: cols, gridAutoRows: '3.25rem' }

  if (loading) {
    return <div className="text-muted font-mono text-sm p-8">Loading heatmap…</div>
  }
  if (courses.length === 0) {
    return <div className="text-muted font-mono text-sm p-8">No courses match these filters.</div>
  }

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <div className="grid min-w-max" style={gridStyle}>
        {/* header row */}
        <div className="sticky left-0 bg-surface z-10 px-3 flex items-center text-muted text-xs font-mono border-b border-border">course</div>
        {semesters.map((s) => (
          <div key={s.id} className="px-1 flex flex-col items-center justify-center text-muted text-[10px] font-mono text-center border-b border-border leading-tight">
            <span>{s.season.replace('Sem ', 'S')}</span>
            <span>'{String(s.year).slice(2)}</span>
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
      <div className="sticky left-0 bg-surface z-10 px-3 border-b border-border/50 flex flex-col justify-center">
        <span className="font-mono text-accent text-xs">{course.code}</span>
        <span className="text-muted text-[10px] truncate max-w-[11rem]">{course.name}</span>
      </div>
      {semesters.map((s, ci) => {
        const row = statsMap.get(`${course.id}:${s.id}`)
        const stat = row ? row[metric.statKey] : null
        const value = stat === null || stat === undefined ? null : Number(stat)
        return (
          <div key={s.id} className="h-full border-b border-l border-border/30 fill-in"
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
