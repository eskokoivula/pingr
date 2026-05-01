import { Input } from '../../../components/ui/Input'

interface Props {
  value: string
  onChange: (v: string) => void
}

export function RoleStep({ value, onChange }: Props) {
  return (
    <div>
      <h2 className="text-[22px] font-bold mb-2">Your role</h2>
      <p className="text-pingr-secondary text-[15px] mb-6">Optional. Helps contacts remember you.</p>
      <Input
        placeholder="e.g. Co-founder & CEO"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
    </div>
  )
}
