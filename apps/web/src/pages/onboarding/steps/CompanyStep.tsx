import { Input } from '../../../components/ui/Input'

interface Props {
  value: string
  onChange: (v: string) => void
}

export function CompanyStep({ value, onChange }: Props) {
  return (
    <div>
      <h2 className="text-[22px] font-bold mb-2">Your company or project</h2>
      <p className="text-pingr-secondary text-[15px] mb-6">Used in team group names and your profile.</p>
      <Input
        placeholder="e.g. Pingr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
    </div>
  )
}
