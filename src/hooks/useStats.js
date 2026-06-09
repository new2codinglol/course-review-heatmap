import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Returns a Map keyed by `${course_id}:${semester_id}` -> stats row.
export function useStats(refreshKey = 0) {
  const [statsMap, setStatsMap] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase.from('course_semester_stats').select('*')
      if (!active) return
      if (error) setError(error)
      else {
        const map = new Map()
        for (const row of data) map.set(`${row.course_id}:${row.semester_id}`, row)
        setStatsMap(map)
      }
      setLoading(false)
    })()
    return () => { active = false }
  }, [refreshKey])

  return { statsMap, loading, error }
}
