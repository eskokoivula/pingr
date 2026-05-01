import { useLocation, useNavigate } from 'react-router-dom'
import { haptic } from '../../lib/telegram'
import { HomeIcon, ContactsIcon, DashboardIcon } from '../ui/Icons'

const tabs = [
  { path: '/', label: 'Home', Icon: HomeIcon },
  { path: '/contacts', label: 'Contacts', Icon: ContactsIcon },
  { path: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
]

export function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-app mx-auto bg-[#000000] border-t border-white/[0.08]">
        <div className="flex h-[70px] pb-2">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path
            return (
              <button
                key={tab.path}
                onClick={() => {
                  haptic.selection()
                  navigate(tab.path)
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? 'text-white' : 'text-pingr-secondary'
                }`}
              >
                <tab.Icon size={22} />
                <span className="text-[11px] font-semibold">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
