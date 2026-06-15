import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MetricSwitcher } from './MetricSwitcher'

describe('MetricSwitcher', () => {
  it('renders all metrics and calls onChange on click', () => {
    const onChange = vi.fn()
    render(<MetricSwitcher value="rating" onChange={onChange} />)
    expect(screen.getByRole('tab', { name: /GPA/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Workload/ }))
    expect(onChange).toHaveBeenCalledWith('workload')
  })
  it('marks the active tab as selected', () => {
    render(<MetricSwitcher value="gpa" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: /GPA/ })).toHaveAttribute('aria-selected', 'true')
  })
})
