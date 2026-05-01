import { create } from 'zustand'

interface UIStore {
  showSettings: boolean
  openSettings: () => void
  closeSettings: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  showSettings: false,
  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),
}))
