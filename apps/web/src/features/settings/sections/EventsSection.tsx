import { useState, useEffect, useRef } from 'react'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Toast } from '../../../components/ui/Toast'
import { useEventStore } from '../../../stores/events'
import { haptic } from '../../../lib/telegram'

function formatDateEU(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${parseInt(d)}.${parseInt(m)}.${y}`
}

export function EventsSection() {
  const { events, fetchEvents, createEvent, activateEvent } = useEventStore()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const handleCreate = async () => {
    if (!name.trim()) return
    await createEvent(name.trim(), startDate || undefined, endDate || undefined)
    haptic.success()
    setToast('Event created!')
    setShowCreate(false)
    setName(''); setStartDate(''); setEndDate('')
  }

  const handleActivate = async (id: number) => {
    haptic.selection()
    await activateEvent(id)
    setToast('Event activated!')
  }

  return (
    <div className="px-4 pt-2 pb-8">
      {toast && <Toast message={toast} type="success" duration={2000} onClose={() => setToast(null)} />}

      <div className="space-y-2 mb-4">
        {events.map(ev => (
          <div
            key={ev.id}
            className={`px-4 py-3 rounded-[12px] ${ev.isActive ? 'bg-pingr-success/10 border border-pingr-success/30' : 'bg-white/[0.04]'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-medium">{ev.name}</p>
                {(ev.startDate || ev.endDate) && (
                  <p className="text-[13px] text-pingr-secondary mt-0.5">
                    {formatDateEU(ev.startDate)}{ev.endDate ? ` → ${formatDateEU(ev.endDate)}` : ''}
                  </p>
                )}
              </div>
              {ev.isActive ? (
                <span className="text-[11px] font-bold uppercase text-pingr-success bg-pingr-success/20 px-2 py-0.5 rounded-full">Active</span>
              ) : (
                <button onClick={() => handleActivate(ev.id)} className="text-[13px] text-pingr-link font-medium">Activate</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreate ? (
        <div className="space-y-3 pt-3 border-t border-white/[0.06]">
          <Input placeholder="Event name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <div className="flex gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 rounded-[10px] bg-white/[0.06] border border-white/[0.08] px-3 py-2.5 text-[13px] text-pingr-text outline-none [color-scheme:dark]" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 rounded-[10px] bg-white/[0.06] border border-white/[0.08] px-3 py-2.5 text-[13px] text-pingr-text outline-none [color-scheme:dark]" />
          </div>
          <Button onClick={handleCreate} disabled={!name.trim()}>Create & activate</Button>
          <button onClick={() => setShowCreate(false)} className="w-full text-center py-2 text-pingr-secondary text-[14px]">Cancel</button>
        </div>
      ) : (
        <button onClick={() => { haptic.light(); setShowCreate(true) }} className="w-full text-center py-3 text-pingr-link text-[15px] font-medium">
          + Create new event week
        </button>
      )}
    </div>
  )
}
