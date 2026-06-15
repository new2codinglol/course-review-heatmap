import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HeatmapCell } from './HeatmapCell'

describe('HeatmapCell', () => {
  it('prints the value and is clickable when populated', () => {
    const onClick = vi.fn()
    render(<HeatmapCell value={4.2} sampleSize={10} domain={[1,5]} onClick={onClick} />)
    expect(screen.getByText('4.2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
  it('renders a dash and is not clickable when empty', () => {
    render(<HeatmapCell value={null} sampleSize={0} domain={[1,5]} onClick={() => {}} />)
    expect(screen.getByText('–')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
