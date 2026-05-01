import { MoreIcon } from '../ui/Icons'
import { useUIStore } from '../../stores/ui'

interface TopBarProps {
  title?: string
  showSettings?: boolean
  onSettings?: () => void
  right?: React.ReactNode
}

export function TopBar({ title = 'pingr', showSettings = true, onSettings, right }: TopBarProps) {
  const { openSettings } = useUIStore()

  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-1">
      {title === 'pingr' ? (
        <img src="/logo-pingr.png" alt="pingr" className="h-[85px] -my-[24px] -ml-[24px]" />
      ) : (
        <h1 className="text-[22px] font-black tracking-[-0.02em]">{title}</h1>
      )}
      {right || (showSettings && (
        <button onClick={onSettings || openSettings} className="p-1 text-pingr-secondary">
          <MoreIcon size={20} />
        </button>
      ))}
    </div>
  )
}
