export const METRICS = [
  { key: 'rating',     label: 'Rating',     statKey: 'avg_rating',  domain: [1, 5], unit: '',  legend: 'Low → High' },
  { key: 'gpa',        label: 'GPA',        statKey: 'avg_gpa',     domain: [0, 4], unit: '',  legend: 'Low → High' },
  { key: 'workload',   label: 'Workload',   statKey: 'avg_workload',domain: [1, 5], unit: '',  legend: 'Light → Heavy' },
  { key: 'attendance', label: 'Attendance', statKey: 'pct_attendance_required', domain: [0, 100], unit: '%', legend: 'Optional → Required' },
]

export function getMetric(key) {
  const m = METRICS.find((x) => x.key === key)
  if (!m) throw new Error(`Unknown metric: ${key}`)
  return m
}
