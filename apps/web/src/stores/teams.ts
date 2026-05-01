import { create } from 'zustand'
import { api } from '../lib/api'

export interface TeamTemplate {
  id: number
  userId: number
  name: string
  members: string[]
  createdAt: string
}

interface TeamsStore {
  teams: TeamTemplate[]
  loading: boolean
  error: string | null
  fetchTeams: () => Promise<void>
  createTeam: (name: string, members: string[]) => Promise<void>
  deleteTeam: (id: number) => Promise<void>
}

export const useTeamsStore = create<TeamsStore>((set, get) => ({
  teams: [],
  loading: false,
  error: null,

  fetchTeams: async () => {
    try {
      set({ loading: true, error: null })
      const data = await api<{ teams: TeamTemplate[] }>('/api/teams')
      set({ teams: data.teams, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load teams', loading: false })
    }
  },

  createTeam: async (name, members) => {
    try {
      set({ loading: true, error: null })
      const data = await api<{ team: TeamTemplate }>('/api/teams', {
        method: 'POST',
        body: JSON.stringify({ name, members }),
      })
      set((state) => ({
        teams: [data.team, ...state.teams],
        loading: false,
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create team', loading: false })
    }
  },

  deleteTeam: async (id) => {
    try {
      await api('/api/teams/' + id, { method: 'DELETE' })
      set((state) => ({ teams: state.teams.filter((t) => t.id !== id) }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete team' })
    }
  },
}))
