import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { validateReview } from '../lib/validation'

export function useSubmitReview() {
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errors, setErrors] = useState({})

  async function submit(review) {
    const { ok, errors } = validateReview(review)
    if (!ok) { setErrors(errors); setStatus('error'); return { ok: false } }
    setErrors({}); setStatus('submitting')
    const payload = { ...review }
    if (!payload.attendance_required) payload.attendance_pct = null
    const { error } = await supabase.from('reviews').insert(payload)
    if (error) { setStatus('error'); setErrors({ form: error.message }); return { ok: false } }
    setStatus('success')
    return { ok: true }
  }

  return { submit, status, errors, reset: () => { setStatus('idle'); setErrors({}) } }
}
