import { create } from 'zustand'
import { api } from '../lib/api'

export interface Contact {
  id: number
  userId: number
  telegramUsername: string
  telegramId: string | null
  name: string | null
  company: string | null
  category: string
  eventWeekId: number | null
  pingNextWeek: boolean
  notes: string | null
  selfieUrl: string | null
  teamChatCreated: boolean
  groupName: string | null
  groupChatId: string | null
  greetingSent: boolean
  metDate: string | null
  createdAt: string
  updatedAt: string
}

interface ContactsStore {
  contacts: Contact[]
  loading: boolean
  error: string | null
  fetchContacts: (params?: Record<string, string>) => Promise<void>
  createContact: (data: {
    telegramUsername: string
    category: string
    name?: string
    company?: string
    notes?: string
    pingNextWeek?: boolean
    eventWeekId?: number
    greetingMessage?: string
  }) => Promise<{ contact: Contact; greeting: any } | null>
  checkDuplicate: (username: string) => Promise<boolean>
}

export const useContactsStore = create<ContactsStore>((set, get) => ({
  contacts: [],
  loading: false,
  error: null,

  fetchContacts: async (params) => {
    try {
      set({ loading: true, error: null })
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      const data = await api<{ contacts: Contact[] }>(`/api/contacts${query}`)
      set({ contacts: data.contacts, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load contacts', loading: false })
    }
  },

  createContact: async (data) => {
    try {
      set({ loading: true, error: null })
      const payload = { ...data }
      // Remove greetingMessage — not stored in DB, sent via GramJS separately
      delete (payload as any).greetingMessage

      const body = JSON.stringify(payload)
      const res = await api<{ contact: Contact; greeting: any }>('/api/contacts', {
        method: 'POST',
        body,
      })
      set((state) => ({
        contacts: [res.contact, ...state.contacts],
        loading: false,
      }))
      return res
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save contact'
      console.error('createContact FAILED:', msg, err)
      set({ error: msg, loading: false })
      return null
    }
  },

  checkDuplicate: async (username) => {
    try {
      const res = await api<{ exists: boolean }>(`/api/contacts/check/${username.replace('@', '')}`)
      return res.exists
    } catch {
      return false
    }
  },
}))
