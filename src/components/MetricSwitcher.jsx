import { METRICS } from '../lib/metrics'

export function MetricSwitcher({ value, onChange }) {
  return (
    <div role="tablist" className="inline-flex gap-1 p-1 bg-surface border border-border rounded-lg">
      {METRICS.map((m) => {
        const active = m.key === value
        return (
          <button
            key={m.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.key)}
            className={`px-3 py-1.5 rounded font-mono text-xs transition
              ${active ? 'bg-accent text-bg' : 'text-muted hover:text-text'}`}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
