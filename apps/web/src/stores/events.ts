import { create } from 'zustand'
import { api } from '../lib/api'

export interface EventWeek {
  id: number
  userId: number
  name: string
  startDate: string | null
  endDate: string | null
  isActive: boolean
  logGroupChatId: string | null
  createdAt: string
}

interface EventStore {
  events: EventWeek[]
  loading: boolean
  error: string | null
  activeEvent: EventWeek | null
  fetchEvents: () => Promise<void>
  createEvent: (name: string, startDate?: string, endDate?: string) => Promise<void>
  activateEvent: (id: number) => Promise<void>
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  loading: false,
  error: null,
  activeEvent: null,

  fetchEvents: async () => {
    try {
      set({ loading: true, error: null })
      const data = await api<{ events: EventWeek[] }>('/api/events')
      const active = data.events.find((e) => e.isActive) || null
      set({ events: data.events, activeEvent: active, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load events', loading: false })
    }
  },

  createEvent: async (name, startDate, endDate) => {
    try {
      set({ loading: true, error: null })
      const data = await api<{ event: EventWeek }>('/api/events', {
        method: 'POST',
        body: JSON.stringify({ name, startDate, endDate }),
      })
      // New event is auto-activated, so deactivate all others locally
      const events = get().events.map((e) => ({ ...e, isActive: false }))
      set({
        events: [data.event, ...events],
        activeEvent: data.event,
        loading: false,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create event', loading: false })
    }
  },

  activateEvent: async (id) => {
    try {
      set({ error: null })
      const data = await api<{ event: EventWeek }>(`/api/events/${id}/activate`, {
        method: 'PUT',
      })
      // Update local state: deactivate all, activate the selected one
      const events = get().events.map((e) => ({
        ...e,
        isActive: e.id === id,
      }))
      set({ events, activeEvent: data.event })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to activate event' })
    }
  },
}))
