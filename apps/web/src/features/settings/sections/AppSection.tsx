import { Toggle } from '../../../components/ui/Toggle'
import { useSettingsStore } from '../../../stores/settings'

export function AppSection() {
  const { tapToContinue, setTapToContinue } = useSettingsStore()

  return (
    <div className="px-4 pt-2">
      <Toggle
        checked={tapToContinue}
        onChange={setTapToContinue}
        label="Tap to continue"
        description="Play ping sound on startup"
      />
    </div>
  )
}
