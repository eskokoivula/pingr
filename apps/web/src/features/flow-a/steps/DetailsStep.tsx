import { Input, Textarea } from '../../../components/ui/Input'
import { Toggle } from '../../../components/ui/Toggle'

interface Props {
  name: string
  onNameChange: (v: string) => void
  company: string
  onCompanyChange: (v: string) => void
  notes: string
  onNotesChange: (v: string) => void
  pingNextWeek: boolean
  onPingChange: (v: boolean) => void
}

export function DetailsStep({
  name, onNameChange,
  company, onCompanyChange,
  notes, onNotesChange,
  pingNextWeek, onPingChange,
}: Props) {
  return (
    <div>
      <h2 className="text-[22px] font-bold mb-1">Contact details</h2>
      <p className="text-pingr-secondary text-[15px] mb-6">You can fill these in later too</p>

      <div className="space-y-4">
        <Input
          label="Name"
          placeholder="e.g. Alex Thompson"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <Input
          label="Company"
          placeholder="e.g. Sequoia Capital"
          value={company}
          onChange={(e) => onCompanyChange(e.target.value)}
        />
        <Textarea
          label="Notes"
          placeholder="Anything you want to remember..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
        />
        <div className="pt-2">
          <Toggle
            checked={pingNextWeek}
            onChange={onPingChange}
            label="Ping next week"
            description="Shows up in your ping list the Monday after the event"
          />
        </div>
      </div>
    </div>
  )
}
