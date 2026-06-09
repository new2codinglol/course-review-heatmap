import { heatColor, EMPTY_COLOR } from '../lib/colorScale'

export function HeatmapCell({ value, sampleSize, domain, unit = '', onClick }) {
  const empty = value === null || value === undefined
  if (empty) {
    return (
      <div className="aspect-square grid place-items-center text-muted text-xs"
           style={{ background: EMPTY_COLOR }} aria-label="No data">–</div>
    )
  }
  // confidence: fewer reviews => lower opacity (min 0.45 at 1 review, full at >=15)
  const confidence = Math.min(1, 0.45 + (sampleSize / 15) * 0.55)
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${sampleSize} review${sampleSize === 1 ? '' : 's'}`}
      className="aspect-square grid place-items-center font-mono text-[11px] font-medium
                 text-bg hover:ring-2 hover:ring-accent focus:ring-2 focus:ring-accent outline-none transition"
      style={{ background: heatColor(value, domain), opacity: confidence }}
    >
      {value.toFixed(1)}{unit}
    </button>
  )
}
