import { create } from 'zustand'

interface SettingsStore {
  tapToContinue: boolean
  setTapToContinue: (value: boolean) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  tapToContinue: localStorage.getItem('tapToContinue') !== 'false',
  setTapToContinue: (value) => {
    localStorage.setItem('tapToContinue', String(value))
    set({ tapToContinue: value })
  },
}))
