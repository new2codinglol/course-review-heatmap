import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useCellDetail(courseId, semesterId) {
  const [reviews, setReviews] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!courseId || !semesterId) { setReviews(null); return }
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('reviews').select('*')
        .eq('course_id', courseId).eq('semester_id', semesterId)
      if (!active) return
      if (error) setError(error); else setReviews(data)
      setLoading(false)
    })()
    return () => { active = false }
  }, [courseId, semesterId])

  return { reviews, loading, error }
}
