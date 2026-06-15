import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SubmitReviewForm } from './SubmitReviewForm'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => {
  const insert = vi.fn(() => Promise.resolve({ error: null }))
  return { supabase: { from: vi.fn(() => ({ insert })), __insert: insert } }
})

const courses = [{ id: 'c1', code: 'SECJ3553', name: 'Network Security' }]
const semesters = [{ id: 's1', label: 'Sem 1 2023/2024' }]

describe('SubmitReviewForm', () => {
  beforeEach(() => {
    supabase.__insert.mockClear()
    supabase.from.mockClear()
  })

  it('shows validation errors when submitting empty required fields', () => {
    render(<SubmitReviewForm courses={courses} semesters={semesters} onSubmitted={() => {}} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText(/select a course/i)).toBeInTheDocument()
    expect(supabase.__insert).not.toHaveBeenCalled()
  })

  it('inserts a valid review (attendance_pct nulled when not required) and notifies the parent', async () => {
    const onSubmitted = vi.fn()
    render(<SubmitReviewForm courses={courses} semesters={semesters} onSubmitted={onSubmitted} onClose={() => {}} />)

    const [courseSelect, semesterSelect] = screen.getAllByRole('combobox')
    fireEvent.change(courseSelect, { target: { value: 'c1' } })
    fireEvent.change(semesterSelect, { target: { value: 's1' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => expect(onSubmitted).toHaveBeenCalled())
    expect(supabase.from).toHaveBeenCalledWith('reviews')
    const payload = supabase.__insert.mock.calls[0][0]
    expect(payload).toMatchObject({ course_id: 'c1', semester_id: 's1', attendance_required: false })
    expect(payload.attendance_pct).toBeNull()
  })
})
