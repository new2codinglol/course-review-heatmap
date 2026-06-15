import { getMetric } from '../lib/metrics'
import { heatColor, EMPTY_COLOR } from '../lib/colorScale'

export function Legend({ metric }) {
  const m = getMetric(metric)
  const [min, max] = m.domain
  const stops = [0, 0.25, 0.5, 0.75, 1].map((t) => min + t * (max - min))
  return (
    <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-mono text-muted">
      <span>{m.label}: {m.legend}</span>
      <div className="flex">
        {stops.map((v) => (
          <span key={v} className="w-8 h-3" style={{ background: heatColor(v, m.domain) }} />
        ))}
      </div>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 inline-block" style={{ background: EMPTY_COLOR }} /> no data
      </span>
    </div>
  )
}
