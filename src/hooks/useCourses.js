import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useCourses() {
  const [courses, setCourses] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const [c, s] = await Promise.all([
        supabase.from('courses').select('*').order('code'),
        supabase.from('semesters').select('*').order('sort_order'),
      ])
      if (!active) return
      if (c.error || s.error) setError(c.error || s.error)
      else { setCourses(c.data); setSemesters(s.data) }
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  return { courses, semesters, loading, error }
}
