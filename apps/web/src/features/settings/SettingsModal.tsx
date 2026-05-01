import { useState } from 'react'
import { haptic } from '../../lib/telegram'
import { Toggle } from '../../components/ui/Toggle'
import { useSettingsStore } from '../../stores/settings'
import { ProfileSection } from './sections/ProfileSection'
import { GreetingSection } from './sections/GreetingSection'
import { EventsSection } from './sections/EventsSection'
import { TeamsSection } from './sections/TeamsSection'
import { NotificationsSection } from './sections/NotificationsSection'
type Section = null | 'profile' | 'greeting' | 'events' | 'teams' | 'notifications'

const MENU_ITEMS: { key: Section; emoji: string; title: string; subtitle: string }[] = [
  { key: 'profile', emoji: '👤', title: 'Profile', subtitle: 'Name, company, role' },
  { key: 'greeting', emoji: '💬', title: 'Greeting template', subtitle: 'Customize your greeting' },
  { key: 'events', emoji: '📅', title: 'Event weeks', subtitle: 'Manage events' },
  { key: 'teams', emoji: '👥', title: 'Teams', subtitle: 'Your teams & group chat templates' },
  { key: 'notifications', emoji: '🔔', title: 'Notifications', subtitle: 'Bot alerts' },
]

interface Props {
  onClose: () => void
}

export function SettingsModal({ onClose }: Props) {
  const [section, setSection] = useState<Section>(null)
  const { tapToContinue, setTapToContinue } = useSettingsStore()

  const handleBack = () => {
    haptic.light()
    if (section) {
      setSection(null)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-pingr-bg text-pingr-text animate-slideUp flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3 shrink-0">
        <button onClick={handleBack} className="text-[20px] w-8 h-8 flex items-center justify-center">
          {section ? '‹' : '✕'}
        </button>
        <h1 className="text-[18px] font-bold">
          {section ? MENU_ITEMS.find(m => m.key === section)?.title || 'Settings' : 'Settings'}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!section && (
          <div className="px-4 pt-2">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => { haptic.light(); setSection(item.key) }}
                className="w-full flex items-center gap-3 py-4 border-b border-white/[0.06] text-left active:bg-white/[0.04]"
              >
                <span className="text-[22px] w-8 text-center">{item.emoji}</span>
                <div className="flex-1">
                  <p className="text-[15px] font-medium">{item.title}</p>
                  <p className="text-[13px] text-pingr-secondary">{item.subtitle}</p>
                </div>
                <span className="text-pingr-secondary text-[16px]">›</span>
              </button>
            ))}

            <div className="pt-4">
              <Toggle
                checked={tapToContinue}
                onChange={setTapToContinue}
                label="Tap to continue"
                description="Play ping sound on startup"
              />
            </div>
          </div>
        )}

        {section === 'profile' && <ProfileSection />}
        {section === 'greeting' && <GreetingSection />}
        {section === 'events' && <EventsSection />}
        {section === 'teams' && <TeamsSection />}
        {section === 'notifications' && <NotificationsSection />}
      </div>
    </div>
  )
}
