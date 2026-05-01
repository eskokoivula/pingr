import { haptic } from '../../lib/telegram'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <button
      type="button"
      className="flex items-center justify-between w-full py-2"
      onClick={() => {
        haptic.selection()
        onChange(!checked)
      }}
    >
      <div className="flex-1 mr-3 text-left">
        {label && <p className="text-[15px] text-pingr-text">{label}</p>}
        {description && <p className="text-[13px] text-pingr-secondary mt-0.5">{description}</p>}
      </div>
      <div
        className={`w-[48px] h-[28px] rounded-full transition-colors flex items-center px-[2px] flex-shrink-0 ${
          checked ? 'bg-pingr-success' : 'bg-white/10'
        }`}
      >
        <div
          className={`w-[24px] h-[24px] rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[20px]' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  )
}
