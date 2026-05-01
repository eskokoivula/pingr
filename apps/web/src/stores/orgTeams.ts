import { create } from 'zustand'
import { api } from '../lib/api'
import { type Contact } from './contacts'

export interface OrgTeam {
  id: number
  name: string
  inviteCode: string
  createdBy: number
  createdAt: string
  memberCount: number
  inviteLink: string
}

export interface TeamMember {
  userId: number
  name: string | null
  username: string | null
  company: string | null
  contactCount: number
  joinedAt: string
}

interface OrgTeamsStore {
  teams: OrgTeam[]
  loading: boolean
  error: string | null
  fetchTeams: () => Promise<void>
  createTeam: (name: string) => Promise<OrgTeam | null>
  joinTeam: (code: string) => Promise<{ ok: boolean; alreadyMember?: boolean } | null>
  fetchMembers: (teamId: number) => Promise<TeamMember[]>
  fetchMemberContacts: (teamId: number, userId: number) => Promise<Contact[]>
}

export const useOrgTeamsStore = create<OrgTeamsStore>((set) => ({
  teams: [],
  loading: false,
  error: null,

  fetchTeams: async () => {
    try {
      set({ loading: true, error: null })
      const data = await api<{ teams: OrgTeam[] }>('/api/org-teams')
      set({ teams: data.teams, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load teams', loading: false })
    }
  },

  createTeam: async (name) => {
    try {
      set({ loading: true, error: null })
      const data = await api<{ team: OrgTeam; inviteLink: string }>('/api/org-teams', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      const team = { ...data.team, memberCount: 1, inviteLink: data.inviteLink }
      set((state) => ({ teams: [team, ...state.teams], loading: false }))
      return team
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create team', loading: false })
      return null
    }
  },

  joinTeam: async (code) => {
    try {
      const res = await api<{ ok: boolean; alreadyMember?: boolean }>(`/api/org-teams/${code}/join`, { method: 'POST' })
      return res
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to join team' })
      return null
    }
  },

  fetchMembers: async (teamId) => {
    try {
      const data = await api<{ members: TeamMember[] }>(`/api/org-teams/${teamId}/members`)
      return data.members
    } catch {
      return []
    }
  },

  fetchMemberContacts: async (teamId, userId) => {
    try {
      const data = await api<{ contacts: Contact[] }>(`/api/org-teams/${teamId}/member/${userId}/contacts`)
      return data.contacts
    } catch {
      return []
    }
  },
}))
