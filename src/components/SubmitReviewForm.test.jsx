import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SubmitReviewForm } from './SubmitReviewForm'

const courses = [{ id: 'c1', code: 'SECJ3553', name: 'Network Security' }]
const semesters = [{ id: 's1', label: 'Sem 1 2023/2024' }]

describe('SubmitReviewForm', () => {
  it('shows validation errors when submitting empty required fields', () => {
    render(<SubmitReviewForm courses={courses} semesters={semesters} onSubmitted={() => {}} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText(/select a course/i)).toBeInTheDocument()
  })
})
