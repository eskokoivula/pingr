import { Input } from '../../../components/ui/Input'

interface Props {
  value: string
  onChange: (v: string) => void
}

export function NameStep({ value, onChange }: Props) {
  return (
    <div>
      <h2 className="text-[22px] font-bold mb-2">What's your name?</h2>
      <p className="text-pingr-secondary text-[15px] mb-6">This is shown on your profile and in greetings.</p>
      <Input
        placeholder="e.g. Alex Thompson"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
    </div>
  )
}
