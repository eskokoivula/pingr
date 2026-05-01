import { create } from 'zustand'
import { api } from '../lib/api'

export interface User {
  id: number
  telegramId: string
  username: string | null
  name: string | null
  company: string | null
  role: string | null
  xHandle: string | null
  blurb: string | null
  greetingTemplate: string
  onboardingCompleted: boolean
  mtprotoSessionValid: boolean
}

interface UserStore {
  user: User | null
  loading: boolean
  error: string | null
  init: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  setUser: (user: User) => void
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  init: async () => {
    try {
      set({ loading: true, error: null })
      const data = await api<{ user: User }>('/api/auth/init', { method: 'POST' })
      set({ user: data.user, loading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to initialize',
        loading: false,
      })
    }
  },

  updateProfile: async (data) => {
    const res = await api<{ user: User }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    set({ user: res.user })
  },

  setUser: (user) => set({ user }),
}))
