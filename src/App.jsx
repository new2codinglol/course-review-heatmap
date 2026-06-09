import { useMemo } from 'react'
import { useCourses } from './hooks/useCourses'
import { useStats } from './hooks/useStats'
import { useAppStore } from './store/appStore'
import { HeatmapGrid } from './components/HeatmapGrid'
import { MetricSwitcher } from './components/MetricSwitcher'
import { FilterBar } from './components/FilterBar'
import { Legend } from './components/Legend'

export default function App() {
  const { courses, semesters, loading: cLoading, error: cErr } = useCourses()
  const { statsMap, loading: sLoading, error: sErr } = useStats()
  const {
    metric, setMetric,
    faculty, setFaculty, department, setDepartment, clearFilters,
    openCell,
  } = useAppStore()

  const visibleCourses = useMemo(() => courses.filter((c) =>
    (faculty === 'all' || c.faculty === faculty) &&
    (department === 'all' || c.department === department)
  ), [courses, faculty, department])

  const error = cErr || sErr

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="font-mono text-accent text-xl">course_review_heatmap</h1>
        <p className="text-muted text-sm">Synthetic UTM-inspired data · {visibleCourses.length} courses</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <MetricSwitcher value={metric} onChange={setMetric} />
        <FilterBar
          courses={courses}
          faculty={faculty}
          department={department}
          onFaculty={setFaculty}
          onDepartment={setDepartment}
          onClear={clearFilters}
        />
      </div>

      {error ? (
        <div className="text-red-400 font-mono text-sm p-8 border border-red-900 rounded">
          Failed to load data: {error.message}
        </div>
      ) : (
        <>
          <HeatmapGrid
            courses={visibleCourses}
            semesters={semesters}
            statsMap={statsMap}
            metric={metric}
            loading={cLoading || sLoading}
            onCellClick={(courseId, semesterId) => openCell({ courseId, semesterId })}
          />
          <Legend metric={metric} />
        </>
      )}
    </div>
  )
}
