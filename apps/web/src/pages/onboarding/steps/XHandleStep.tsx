import { Input } from '../../../components/ui/Input'

interface Props {
  value: string
  onChange: (v: string) => void
}

export function XHandleStep({ value, onChange }: Props) {
  return (
    <div>
      <h2 className="text-[22px] font-bold mb-2">Your X handle</h2>
      <p className="text-pingr-secondary text-[15px] mb-6">Optional. Shown on your QR code screen.</p>
      <Input
        placeholder="@username"
        value={value}
        onChange={(e) => {
          let v = e.target.value
          if (v && !v.startsWith('@')) v = '@' + v
          onChange(v)
        }}
        autoFocus
      />
    </div>
  )
}
