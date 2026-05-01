import { useState } from 'react'
import { type Contact, useContactsStore } from '../../stores/contacts'
import { useEventStore } from '../../stores/events'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { Toggle } from '../../components/ui/Toggle'
import { Toast } from '../../components/ui/Toast'
import { haptic } from '../../lib/telegram'

const CATEGORIES = [
  { name: 'Investor', color: '#818CF8' },
  { name: 'KOL', color: '#F472B6' },
  { name: 'Marketing', color: '#FBBF24' },
  { name: 'Dev', color: '#4ADE80' },
  { name: 'Founder', color: '#C084FC' },
  { name: 'BD', color: '#60A5FA' },
  { name: 'Media', color: '#FB923C' },
  { name: 'Other', color: '#9CA3AF' },
]

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.name, c.color]))

function formatDateEU(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${parseInt(d)}.${parseInt(m)}.${y}`
}

interface Props {
  contact: Contact
  onClose: () => void
}

export function ContactDetail({ contact, onClose }: Props) {
  const { events } = useEventStore()
  const { fetchContacts } = useContactsStore()
  const color = CATEGORY_COLORS[contact.category] || '#9CA3AF'
  const eventName = contact.eventWeekId
    ? events.find((e) => e.id === contact.eventWeekId)?.name || null
    : null

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(contact.name || '')
  const [editCompany, setEditCompany] = useState(contact.company || '')
  const [editCategory, setEditCategory] = useState(contact.category)
  const [editNotes, setEditNotes] = useState(contact.notes || '')
  const [editPing, setEditPing] = useState(contact.pingNextWeek)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const editColor = CATEGORY_COLORS[editCategory] || '#9CA3AF'

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const { api } = await import('../../lib/api')
      await api(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName || null,
          company: editCompany || null,
          category: editCategory,
          notes: editNotes || null,
          pingNextWeek: editPing,
        }),
      })
      haptic.success()
      setToast('Saved!')
      setEditing(false)
      fetchContacts()
    } catch {
      haptic.error()
      setToast('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this contact?')) return
    try {
      const { api } = await import('../../lib/api')
      await api(`/api/contacts/${contact.id}`, { method: 'DELETE' })
      haptic.success()
      fetchContacts()
      onClose()
    } catch {
      haptic.error()
      setToast('Failed to delete')
    }
  }

  const openTelegramChat = () => {
    haptic.light()
    window.open(`https://t.me/${contact.telegramUsername}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-[60] bg-pingr-bg text-pingr-text animate-slideUp flex flex-col">
      {toast && <Toast message={toast} type={toast === 'Saved!' ? 'success' : 'error'} duration={2000} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
        <button onClick={onClose} className="text-[20px] w-8 h-8 flex items-center justify-center">✕</button>
        {editing ? (
          <button onClick={handleSaveEdit} disabled={saving} className="text-pingr-link text-[15px] font-semibold">
            {saving ? 'Saving...' : 'Done'}
          </button>
        ) : (
          <button onClick={() => setEditing(true)} className="text-pingr-secondary text-[15px] font-medium">
            Edit
          </button>
        )}
      </div>

      {/* Profile header */}
      <div className="flex flex-col items-center px-4 pt-2 pb-4">
        <div
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[28px] font-bold mb-3"
          style={{ backgroundColor: (editing ? editColor : color) + '20', color: editing ? editColor : color }}
        >
          {((editing ? editName : contact.name) || contact.telegramUsername)[0].toUpperCase()}
        </div>
        {editing ? (
          <div className="w-full max-w-[260px]">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Name"
              className="w-full text-center text-[20px] font-bold bg-transparent border-b border-white/10 pb-1 outline-none text-pingr-text placeholder:text-pingr-secondary/40"
            />
          </div>
        ) : (
          <h2 className="text-[22px] font-bold">{contact.name || `@${contact.telegramUsername}`}</h2>
        )}
        <p className="text-pingr-secondary text-[14px] mt-0.5">@{contact.telegramUsername}</p>
      </div>

      {/* Details */}
      <div className="flex-1 px-4 overflow-y-auto space-y-4 pb-4">
        {editing ? (
          <>
            {/* Category chips */}
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(({ name: catName, color: catColor }) => {
                  const isSelected = editCategory === catName
                  return (
                    <button
                      key={catName}
                      onClick={() => { haptic.selection(); setEditCategory(catName) }}
                      className="px-3 py-1.5 rounded-[8px] text-[13px] font-semibold transition-all"
                      style={{
                        color: isSelected ? '#fff' : catColor,
                        backgroundColor: isSelected ? catColor : catColor + '18',
                        borderWidth: '1px', borderStyle: 'solid',
                        borderColor: isSelected ? catColor : catColor + '30',
                      }}
                    >
                      {catName}
                    </button>
                  )
                })}
              </div>
            </div>
            <Input label="Company" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} placeholder="Company" />
            <Textarea label="Notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes..." rows={3} />
            <Toggle checked={editPing} onChange={setEditPing} label="Ping next week" description="Shows up in your ping list" />

            <button
              onClick={handleDelete}
              className="w-full text-left py-3 mt-4 text-pingr-error text-[14px] font-medium"
            >
              Delete contact
            </button>
          </>
        ) : (
          <>
            {contact.company && <Field label="Company" value={contact.company} />}
            {eventName && <Field label="Met in" value={eventName} />}
            {contact.metDate && <Field label="Met on" value={formatDateEU(contact.metDate)} />}
            {contact.notes && <Field label="Notes" value={contact.notes} />}
            {contact.pingNextWeek && (
              <div className="flex items-center gap-2 py-1">
                <span className="text-[14px]">🔔</span>
                <span className="text-[14px] text-pingr-text">Ping next week</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action button */}
      {!editing && (
        <div className="px-4 pb-8 pt-4 shrink-0">
          <Button onClick={openTelegramChat}>
            Message @{contact.telegramUsername}
          </Button>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-1">{label}</p>
      <p className="text-[15px] text-pingr-text">{value}</p>
    </div>
  )
}
