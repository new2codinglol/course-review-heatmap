import { create } from 'zustand'

const initial = { metric: 'rating', faculty: 'all', department: 'all', selectedCell: null }

export const useAppStore = create((set) => ({
  ...initial,
  setMetric: (metric) => set({ metric }),
  setFaculty: (faculty) => set({ faculty, department: 'all' }),
  setDepartment: (department) => set({ department }),
  clearFilters: () => set({ faculty: 'all', department: 'all' }),
  openCell: (cell) => set({ selectedCell: cell }),
  closeCell: () => set({ selectedCell: null }),
  reset: () => set({ ...initial }),
}))
