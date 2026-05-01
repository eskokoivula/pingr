import { useState, useEffect, useRef } from 'react'
import { useEventStore, type EventWeek } from '../../stores/events'
import { Button } from '../../components/ui/Button'
import { Toast } from '../../components/ui/Toast'
import { haptic } from '../../lib/telegram'

// Convert ISO "2026-03-24" → European "24.3.2026"
function formatDateEU(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${parseInt(d)}.${parseInt(m)}.${y}`
}

interface DateFieldProps {
  label: string
  value: string        // ISO format internally
  onChange: (iso: string) => void
}

function DateField({ label, value, onChange }: DateFieldProps) {
  const hiddenRef = useRef<HTMLInputElement>(null)
  const display = value ? formatDateEU(value) : ''

  return (
    <div className="flex-1 flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-white/30 shrink-0">{label}</span>
      <button
        type="button"
        onClick={() => hiddenRef.current?.showPicker?.() || hiddenRef.current?.focus()}
        className="flex-1 text-left bg-white/[0.05] border border-white/[0.07] rounded-[8px] px-2.5 py-[6px] text-[13px] min-h-[30px] transition-colors active:bg-white/[0.08]"
      >
        {display ? (
          <span className="text-pingr-text">{display}</span>
        ) : (
          <span className="text-white/20">dd.mm.yyyy</span>
        )}
      </button>
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  )
}

interface EventPickerProps {
  onClose: () => void
}

export function EventPicker({ onClose }: EventPickerProps) {
  const { events, loading, fetchEvents, createEvent, activateEvent } = useEventStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleActivate = async (event: EventWeek) => {
    if (event.isActive) return
    haptic.selection()
    await activateEvent(event.id)
    haptic.success()
    onClose()
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    haptic.light()
    await createEvent(newName.trim(), newStart || undefined, newEnd || undefined)
    if (!useEventStore.getState().error) {
      haptic.success()
      setShowCreate(false)
      setNewName('')
      setNewStart('')
      setNewEnd('')
      onClose()
    } else {
      setToast(useEventStore.getState().error || 'Failed')
      haptic.error()
    }
  }

  const resetCreate = () => {
    setShowCreate(false)
    setNewName('')
    setNewStart('')
    setNewEnd('')
  }

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      {toast && <Toast message={toast} type="error" onClose={() => setToast(null)} />}

      <div className="absolute inset-0 bg-black/50" />

      <div
        className="absolute bottom-0 left-0 right-0 max-w-app mx-auto bg-[#000000] rounded-t-[20px] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-[36px] h-[4px] rounded-full bg-white/20" />
        </div>

        <div className="px-4 pb-6 max-h-[70vh] overflow-y-auto">
          <h2 className="text-[18px] font-bold mb-4">Event weeks</h2>

          {loading && events.length === 0 ? (
            <p className="text-pingr-secondary text-[14px] py-4 text-center">Loading...</p>
          ) : events.length === 0 && !showCreate ? (
            <p className="text-pingr-secondary text-[14px] py-4 text-center">No event weeks yet</p>
          ) : (
            <div className="space-y-2 mb-4">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleActivate(event)}
                  className={`w-full text-left px-4 py-3 rounded-[12px] transition-colors ${
                    event.isActive
                      ? 'bg-pingr-success/10 border border-pingr-success/30'
                      : 'bg-white/[0.04] border border-transparent active:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium truncate">{event.name}</p>
                      {(event.startDate || event.endDate) && (
                        <p className="text-[13px] text-pingr-secondary mt-0.5">
                          {formatDateEU(event.startDate)}{event.endDate ? ` → ${formatDateEU(event.endDate)}` : ''}
                        </p>
                      )}
                    </div>
                    {event.isActive && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-pingr-success bg-pingr-success/20 px-2 py-0.5 rounded-full ml-3 shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {showCreate ? (
            <div className="pt-3 border-t border-white/[0.06]">
              <input
                placeholder="Event name (e.g. Token2049 Singapore)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-[10px] px-3.5 py-3 text-[15px] text-pingr-text placeholder:text-white/25 outline-none focus:border-white/15 transition-colors mb-3"
              />

              <div className="flex gap-3 mb-4">
                <DateField label="Start" value={newStart} onChange={setNewStart} />
                <DateField label="End" value={newEnd} onChange={setNewEnd} />
              </div>

              <Button onClick={handleCreate} disabled={!newName.trim() || loading}>
                {loading ? 'Creating...' : 'Create & activate'}
              </Button>
              <button
                onClick={resetCreate}
                className="w-full text-center py-3 text-pingr-secondary text-[14px] font-medium active:text-white/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                haptic.light()
                setShowCreate(true)
              }}
              className="w-full text-center py-3 text-pingr-link text-[15px] font-medium active:opacity-70 transition-opacity"
            >
              + Create new event week
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
