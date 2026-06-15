import { heatColor, EMPTY_COLOR } from '../lib/colorScale'

export function HeatmapCell({ value, sampleSize, domain, unit = '', onClick }) {
  const empty = value === null || value === undefined
  if (empty) {
    return (
      <div className="h-full w-full grid place-items-center text-muted text-xs"
           style={{ background: EMPTY_COLOR }} aria-label="No data">–</div>
    )
  }
  // confidence: fewer reviews => background fades toward neutral (min 45% at 1
  // review, full at >=15). We dim the *background* only — not the whole cell — so
  // the printed value stays fully legible regardless of sample size.
  const confidence = Math.min(1, 0.45 + (sampleSize / 15) * 0.55)
  const background = `color-mix(in oklch, ${heatColor(value, domain)} ${Math.round(confidence * 100)}%, ${EMPTY_COLOR})`
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${sampleSize} review${sampleSize === 1 ? '' : 's'}`}
      className="h-full w-full grid place-items-center font-mono text-[11px] font-medium
                 text-bg hover:ring-2 hover:ring-accent focus:ring-2 focus:ring-accent outline-none transition cursor-pointer"
      style={{ background }}
    >
      {value.toFixed(1)}{unit}
    </button>
  )
}
