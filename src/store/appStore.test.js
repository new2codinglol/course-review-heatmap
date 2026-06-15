import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './appStore'

const get = () => useAppStore.getState()

describe('appStore', () => {
  beforeEach(() => get().reset())
  it('defaults to rating metric, no filters, closed drawer', () => {
    expect(get().metric).toBe('rating')
    expect(get().faculty).toBe('all')
    expect(get().department).toBe('all')
    expect(get().selectedCell).toBeNull()
  })
  it('sets metric', () => {
    get().setMetric('gpa')
    expect(get().metric).toBe('gpa')
  })
  it('setting faculty resets department to all', () => {
    get().setDepartment('Cybersecurity')
    get().setFaculty('Engineering')
    expect(get().department).toBe('all')
  })
  it('opens and closes the drawer', () => {
    get().openCell({ courseId: 'c1', semesterId: 's1' })
    expect(get().selectedCell).toEqual({ courseId: 'c1', semesterId: 's1' })
    get().closeCell()
    expect(get().selectedCell).toBeNull()
  })
})
