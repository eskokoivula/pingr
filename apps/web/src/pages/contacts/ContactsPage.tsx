import { useEffect, useState, useMemo } from 'react'
import { TopBar } from '../../components/layout/TopBar'
import { Toast } from '../../components/ui/Toast'
import { useContactsStore, type Contact } from '../../stores/contacts'
import { useEventStore } from '../../stores/events'
import { ContactDetail } from '../../features/contact-detail/ContactDetail'
import { FlowBModal } from '../../features/flow-b/FlowBModal'
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

type ViewMode = 'contacts' | 'groups'

export function ContactsPage() {
  const { contacts, loading, fetchContacts } = useContactsStore()
  const { events, fetchEvents } = useEventStore()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showFlowB, setShowFlowB] = useState(false)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [toast, setToast] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('contacts')

  useEffect(() => { fetchContacts(); fetchEvents() }, [fetchContacts, fetchEvents])

  // Filter contacts
  const filtered = useMemo(() => {
    let result = contacts
    if (activeFilter === 'Ping') result = result.filter(c => c.pingNextWeek)
    else if (activeFilter !== 'All') result = result.filter(c => c.category === activeFilter)
    if (eventFilter !== 'all') {
      const eid = eventFilter === 'general' ? null : Number(eventFilter)
      result = result.filter(c => c.eventWeekId === eid)
    }
    if (search.trim()) {
      const s = search.toLowerCase()
      result = result.filter(c =>
        c.name?.toLowerCase().includes(s) ||
        c.company?.toLowerCase().includes(s) ||
        c.telegramUsername.toLowerCase().includes(s)
      )
    }
    return result
  }, [contacts, activeFilter, eventFilter, search])

  // Groups — contacts that have team chat created
  const groups = useMemo(() =>
    contacts.filter(c => c.teamChatCreated && c.groupName)
  , [contacts])

  const openGroupChat = (contact: Contact) => {
    haptic.light()
    if (contact.groupChatId) {
      // Open group via Telegram deep link
      window.open(`https://t.me/c/${contact.groupChatId}`, '_blank')
    } else {
      setToast('Group chat link not available')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {toast && <Toast message={toast} type="success" duration={2000} onClose={() => setToast(null)} />}
      {selectedContact && (
        <ContactDetail
          contact={selectedContact}
          onClose={() => { setSelectedContact(null); fetchContacts() }}
        />
      )}
      {showFlowB && (
        <FlowBModal onClose={() => { setShowFlowB(false); fetchContacts() }} />
      )}

      {/* Top bar with + button */}
      <TopBar
        title="Contacts"
        right={
          <button
            onClick={() => { haptic.light(); setShowFlowB(true) }}
            className="w-8 h-8 flex items-center justify-center text-[22px] text-pingr-text"
          >
            +
          </button>
        }
      />

      {/* View toggle: Contacts / Groups */}
      <div className="px-4 pb-2 flex gap-1 bg-white/[0.03] mx-4 rounded-[10px] p-1">
        <button
          onClick={() => { haptic.selection(); setViewMode('contacts') }}
          className={`flex-1 py-2 rounded-[8px] text-[13px] font-semibold text-center transition-colors ${
            viewMode === 'contacts' ? 'bg-white/[0.1] text-pingr-text' : 'text-pingr-secondary'
          }`}
        >
          Contacts
        </button>
        <button
          onClick={() => { haptic.selection(); setViewMode('groups') }}
          className={`flex-1 py-2 rounded-[8px] text-[13px] font-semibold text-center transition-colors ${
            viewMode === 'groups' ? 'bg-white/[0.1] text-pingr-text' : 'text-pingr-secondary'
          }`}
        >
          Groups{groups.length > 0 ? ` (${groups.length})` : ''}
        </button>
      </div>

      {viewMode === 'contacts' ? (
        <>
          {/* Search */}
          <div className="px-4 py-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-pingr-secondary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, company, @username..."
                className="w-full rounded-[12px] bg-white/[0.06] border-[1.5px] border-white/[0.08] pl-9 pr-4 py-2.5 text-[14px] text-pingr-text placeholder:text-pingr-secondary/40 outline-none focus:border-white/15"
              />
            </div>
          </div>

          {/* Filters row */}
          <div className="px-4 pb-3 flex gap-2">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="flex-1 rounded-[10px] bg-white/[0.06] border border-white/[0.08] px-3 py-2 text-[13px] text-pingr-text outline-none [color-scheme:dark]"
            >
              <option value="All">All categories</option>
              {CATEGORIES.map(({ name }) => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value="Ping">🔔 Ping</option>
            </select>
            {events.length > 0 && (
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="flex-1 rounded-[10px] bg-white/[0.06] border border-white/[0.08] px-3 py-2 text-[13px] text-pingr-text outline-none [color-scheme:dark]"
              >
                <option value="all">All events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={String(ev.id)}>{ev.name}</option>
                ))}
                <option value="general">General (no event)</option>
              </select>
            )}
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto px-4 pb-[90px]">
            {loading && contacts.length === 0 ? (
              <p className="text-pingr-secondary text-[14px] py-8 text-center">Loading...</p>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="text-[40px] mb-3 opacity-40">📇</span>
                <p className="text-pingr-secondary text-[14px] text-center">
                  {contacts.length === 0 ? 'No contacts yet. Scan a QR code to get started!' : 'No contacts match your filters.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((contact) => {
                  const color = CATEGORY_COLORS[contact.category] || '#9CA3AF'
                  return (
                    <button
                      key={contact.id}
                      onClick={() => { haptic.light(); setSelectedContact(contact) }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors text-left"
                    >
                      <div
                        className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[16px] font-bold shrink-0"
                        style={{ backgroundColor: color + '20', color }}
                      >
                        {(contact.name || contact.telegramUsername)[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[15px] font-medium truncate">
                            {contact.name || `@${contact.telegramUsername}`}
                          </p>
                          {contact.pingNextWeek && <span className="text-[12px]">🔔</span>}
                          {contact.teamChatCreated && <span className="text-[12px]">👥</span>}
                        </div>
                        {contact.company && (
                          <p className="text-[13px] text-pingr-secondary truncate">{contact.company}</p>
                        )}
                      </div>
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ color, backgroundColor: color + '20' }}
                      >
                        {contact.category}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Groups view */
        <div className="flex-1 overflow-y-auto px-4 pb-[90px] pt-2">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-[40px] mb-3 opacity-40">👥</span>
              <p className="text-pingr-secondary text-[14px] text-center">
                No team groups yet. Create one when saving a contact.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((contact) => {
                const color = CATEGORY_COLORS[contact.category] || '#9CA3AF'
                return (
                  <button
                    key={contact.id}
                    onClick={() => openGroupChat(contact)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors text-left"
                  >
                    <div className="w-[40px] h-[40px] rounded-full bg-pingr-link/20 flex items-center justify-center text-[16px] shrink-0">
                      👥
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium truncate">{contact.groupName}</p>
                      <p className="text-[13px] text-pingr-secondary truncate">
                        {contact.name || `@${contact.telegramUsername}`}
                        {contact.company ? ` · ${contact.company}` : ''}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ color, backgroundColor: color + '20' }}
                    >
                      {contact.category}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
