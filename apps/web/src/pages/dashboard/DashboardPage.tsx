import { useEffect, useState, useMemo } from 'react'
import { TopBar } from '../../components/layout/TopBar'
import { Toast } from '../../components/ui/Toast'
import { useContactsStore, type Contact } from '../../stores/contacts'
import { useEventStore } from '../../stores/events'
import { useTeamsStore } from '../../stores/teams'
import { useOrgTeamsStore, type TeamMember } from '../../stores/orgTeams'
import { ContactDetail } from '../../features/contact-detail/ContactDetail'
import { haptic } from '../../lib/telegram'

type ListFilter = null | 'noGreeting' | 'noTeamChat'

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

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function DashboardPage() {
  const { contacts, fetchContacts } = useContactsStore()
  const { events, fetchEvents } = useEventStore()
  const { teams, fetchTeams } = useTeamsStore()
  const { teams: orgTeams, fetchTeams: fetchOrgTeams, fetchMembers, fetchMemberContacts } = useOrgTeamsStore()
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [listFilter, setListFilter] = useState<ListFilter>(null)
  const [selectedOrgTeam, setSelectedOrgTeam] = useState<number | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [memberContacts, setMemberContacts] = useState<{ userId: number; contacts: Contact[] } | null>(null)

  useEffect(() => { fetchContacts(); fetchEvents(); fetchTeams(); fetchOrgTeams() }, [fetchContacts, fetchEvents, fetchTeams, fetchOrgTeams])

  // Load team members when org team selected
  useEffect(() => {
    const teamId = selectedOrgTeam || orgTeams[0]?.id
    if (teamId) {
      setSelectedOrgTeam(teamId)
      fetchMembers(teamId).then(setTeamMembers)
    }
  }, [orgTeams, selectedOrgTeam, fetchMembers])

  const handleViewMemberContacts = async (teamId: number, userId: number) => {
    haptic.light()
    if (memberContacts?.userId === userId) {
      setMemberContacts(null)
      return
    }
    const c = await fetchMemberContacts(teamId, userId)
    setMemberContacts({ userId, contacts: c })
  }

  const filtered = useMemo(() => {
    if (eventFilter === 'all') return contacts
    if (eventFilter === 'general') return contacts.filter(c => !c.eventWeekId)
    return contacts.filter(c => c.eventWeekId === Number(eventFilter))
  }, [contacts, eventFilter])

  // Today's contacts
  const today = todayISO()
  const todayCount = useMemo(() => filtered.filter(c => c.metDate === today).length, [filtered, today])

  // Action needed
  const noGreeting = useMemo(() => filtered.filter(c => !c.greetingSent), [filtered])
  const noTeamChat = useMemo(() => filtered.filter(c => !c.teamChatCreated), [filtered])
  const hasTeams = teams.length > 0

  // Category stats
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1 })
    const total = filtered.length || 1
    return CATEGORIES
      .map(cat => ({ ...cat, count: counts[cat.name] || 0, pct: Math.round(((counts[cat.name] || 0) / total) * 100) }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [filtered])

  // Networking score — check if one category dominates
  const networkingHint = useMemo(() => {
    if (filtered.length < 5 || categoryStats.length === 0) return null
    const top = categoryStats[0]
    if (top.pct >= 60) return `${top.pct}% ${top.name} — consider diversifying`
    if (categoryStats.length >= 4) return null
    return null
  }, [filtered, categoryStats])

  // Recent contacts (last 5)
  const recent = useMemo(() =>
    [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
  , [filtered])

  return (
    <div className="flex flex-col h-full">
      {toast && <Toast message={toast} type="success" duration={2000} onClose={() => setToast(null)} />}
      {selectedContact && (
        <ContactDetail contact={selectedContact} onClose={() => { setSelectedContact(null); fetchContacts() }} />
      )}

      <TopBar title="Dashboard" />

      <div className="flex-1 overflow-y-auto px-4 pb-[90px] space-y-4">

        {/* Event filter */}
        {events.length > 0 && (
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="w-full rounded-[10px] bg-white/[0.06] border border-white/[0.08] px-3 py-2 text-[13px] text-pingr-text outline-none [color-scheme:dark]"
          >
            <option value="all">All events</option>
            {events.map(ev => (
              <option key={ev.id} value={String(ev.id)}>{ev.name}</option>
            ))}
            <option value="general">General (no event)</option>
          </select>
        )}

        {/* Stats row: total + today */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-[16px] p-4 bg-gradient-to-br from-[#818CF8] to-[#C084FC]">
            <p className="text-white/70 text-[12px] font-medium mb-0.5">Total</p>
            <p className="text-white text-[36px] font-black leading-none">{filtered.length}</p>
          </div>
          <div className="flex-1 rounded-[16px] p-4 bg-white/[0.06]">
            <p className="text-pingr-secondary text-[12px] font-medium mb-0.5">Today</p>
            <p className="text-pingr-text text-[36px] font-black leading-none">{todayCount}</p>
          </div>
        </div>

        {/* Action needed */}
        {filtered.length > 0 && (noGreeting.length > 0 || (hasTeams && noTeamChat.length > 0)) && (
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2">Action needed</p>
            <div className="space-y-2">
              {noGreeting.length > 0 && (
                <button
                  onClick={() => { haptic.light(); setListFilter(listFilter === 'noGreeting' ? null : 'noGreeting') }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors ${
                    listFilter === 'noGreeting' ? 'bg-pingr-warning/20 border-2 border-pingr-warning/40' : 'bg-pingr-warning/10 border border-pingr-warning/20'
                  }`}
                >
                  <span className="text-[20px]">💬</span>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-pingr-text">{noGreeting.length} without greeting</p>
                    <p className="text-[12px] text-pingr-secondary">Tap to see list</p>
                  </div>
                  <span className="text-pingr-secondary text-[14px]">{listFilter === 'noGreeting' ? '▾' : '›'}</span>
                </button>
              )}
              {hasTeams && noTeamChat.length > 0 && (
                <button
                  onClick={() => { haptic.light(); setListFilter(listFilter === 'noTeamChat' ? null : 'noTeamChat') }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors ${
                    listFilter === 'noTeamChat' ? 'bg-pingr-link/20 border-2 border-pingr-link/40' : 'bg-pingr-link/10 border border-pingr-link/20'
                  }`}
                >
                  <span className="text-[20px]">👥</span>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-pingr-text">{noTeamChat.length} without team group</p>
                    <p className="text-[12px] text-pingr-secondary">Tap to see list</p>
                  </div>
                  <span className="text-pingr-secondary text-[14px]">{listFilter === 'noTeamChat' ? '▾' : '›'}</span>
                </button>
              )}
            </div>

            {/* Filtered contact list */}
            {listFilter && (
              <div className="mt-2 space-y-1.5">
                {(listFilter === 'noGreeting' ? noGreeting : noTeamChat).map(contact => {
                  const color = CATEGORY_COLORS[contact.category] || '#9CA3AF'
                  return (
                    <button
                      key={contact.id}
                      onClick={() => { haptic.light(); setSelectedContact(contact) }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-[10px] bg-white/[0.04] active:bg-white/[0.08] text-left"
                    >
                      <div
                        className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                        style={{ backgroundColor: color + '20', color }}
                      >
                        {(contact.name || contact.telegramUsername)[0].toUpperCase()}
                      </div>
                      <p className="text-[14px] font-medium truncate flex-1">
                        {contact.name || `@${contact.telegramUsername}`}
                      </p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ color, backgroundColor: color + '20' }}>
                        {contact.category}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Category breakdown */}
        {categoryStats.length > 0 && (
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-3">By category</p>
            <div className="space-y-2.5">
              {categoryStats.map(({ name, color, count, pct }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium" style={{ color }}>{name}</span>
                    <span className="text-[13px] text-pingr-secondary">{count} · {pct}%</span>
                  </div>
                  <div className="h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Networking hint */}
            {networkingHint && (
              <p className="text-[12px] text-pingr-secondary mt-2 italic">{networkingHint}</p>
            )}
          </div>
        )}

        {/* Ping list */}
        {filtered.filter(c => c.pingNextWeek).length > 0 && (
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2">🔔 Ping list</p>
            <div className="space-y-1.5">
              {filtered.filter(c => c.pingNextWeek).map(contact => (
                <button
                  key={contact.id}
                  onClick={() => { haptic.light(); setSelectedContact(contact) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] bg-pingr-warning/10 text-left"
                >
                  <span className="text-[13px] font-medium text-pingr-text truncate">
                    {contact.name || `@${contact.telegramUsername}`}
                  </span>
                  {contact.company && (
                    <span className="text-[12px] text-pingr-secondary truncate">{contact.company}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent contacts */}
        {recent.length > 0 && (
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2">Recent</p>
            <div className="space-y-1.5">
              {recent.map(contact => {
                const color = CATEGORY_COLORS[contact.category] || '#9CA3AF'
                return (
                  <button
                    key={contact.id}
                    onClick={() => { haptic.light(); setSelectedContact(contact) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-white/[0.04] active:bg-white/[0.08] text-left"
                  >
                    <div
                      className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                      style={{ backgroundColor: color + '20', color }}
                    >
                      {(contact.name || contact.telegramUsername)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium truncate">
                        {contact.name || `@${contact.telegramUsername}`}
                      </p>
                      <p className="text-[12px] text-pingr-secondary truncate">
                        {contact.company || `@${contact.telegramUsername}`}
                        {contact.metDate ? ` · ${formatDateEU(contact.metDate)}` : ''}
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
          </div>
        )}

        {/* Team activity */}
        {orgTeams.length > 0 && (
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2">Team activity</p>

            {orgTeams.length > 1 && (
              <select
                value={String(selectedOrgTeam || '')}
                onChange={(e) => { setSelectedOrgTeam(Number(e.target.value)); setMemberContacts(null) }}
                className="w-full rounded-[10px] bg-white/[0.06] border border-white/[0.08] px-3 py-2 text-[13px] text-pingr-text outline-none [color-scheme:dark] mb-2"
              >
                {orgTeams.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
              </select>
            )}

            {orgTeams.length === 1 && (
              <p className="text-[14px] font-medium text-pingr-text mb-2">{orgTeams[0].name}</p>
            )}

            <div className="space-y-1.5">
              {teamMembers.map(member => {
                const isExpanded = memberContacts?.userId === member.userId
                return (
                  <div key={member.userId}>
                    <button
                      onClick={() => handleViewMemberContacts(selectedOrgTeam || orgTeams[0]?.id, member.userId)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors ${
                        isExpanded ? 'bg-white/[0.08]' : 'bg-white/[0.04] active:bg-white/[0.08]'
                      }`}
                    >
                      <div className="w-[32px] h-[32px] rounded-full bg-pingr-link/20 flex items-center justify-center text-[13px] font-bold text-pingr-link shrink-0">
                        {(member.name || member.username || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium truncate">{member.name || `@${member.username}`}</p>
                        {member.company && <p className="text-[12px] text-pingr-secondary truncate">{member.company}</p>}
                      </div>
                      <span className="text-[13px] text-pingr-secondary font-medium shrink-0">{member.contactCount}</span>
                    </button>

                    {/* Expanded member contacts */}
                    {isExpanded && memberContacts && (
                      <div className="ml-11 mt-1 space-y-1 mb-2">
                        {memberContacts.contacts.length === 0 ? (
                          <p className="text-[12px] text-pingr-secondary py-1">No contacts yet</p>
                        ) : (
                          memberContacts.contacts.slice(0, 10).map(contact => {
                            const color = CATEGORY_COLORS[contact.category] || '#9CA3AF'
                            return (
                              <div key={contact.id} className="flex items-center gap-2 py-1">
                                <p className="text-[13px] text-pingr-text truncate flex-1">
                                  {contact.name || `@${contact.telegramUsername}`}
                                </p>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ color, backgroundColor: color + '20' }}>
                                  {contact.category}
                                </span>
                              </div>
                            )
                          })
                        )}
                        {memberContacts.contacts.length > 10 && (
                          <p className="text-[12px] text-pingr-secondary">+{memberContacts.contacts.length - 10} more</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-[40px] mb-3 opacity-40">📊</span>
            <p className="text-pingr-secondary text-[14px] text-center">
              Dashboard will appear once you have contacts.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
