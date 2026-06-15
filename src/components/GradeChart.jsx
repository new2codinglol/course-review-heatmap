import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const BANDS = [
  ['A', 3.85], ['A-', 3.5], ['B+', 3.15], ['B', 2.85],
  ['B-', 2.5], ['C+', 2.15], ['C', 1.85], ['D', 0.85], ['F', -1],
]

export function bucketGrades(reviews) {
  const out = Object.fromEntries(BANDS.map(([k]) => [k, 0]))
  for (const r of reviews) {
    const band = BANDS.find(([, min]) => r.grade_points >= min)
    if (band) out[band[0]]++
  }
  return out
}

export function GradeChart({ reviews }) {
  const buckets = bucketGrades(reviews)
  const labels = Object.keys(buckets)
  const data = {
    labels,
    datasets: [{ data: labels.map((l) => buckets[l]), backgroundColor: 'oklch(0.78 0.16 75)' }],
  }
  const options = {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#9aa', precision: 0 }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#9aa' }, grid: { display: false } },
    },
  }
  return <Bar data={data} options={options} />
}
