import { useState } from 'react'
import { Textarea } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Toast } from '../../../components/ui/Toast'
import { useUserStore } from '../../../stores/user'
import { haptic } from '../../../lib/telegram'

export function GreetingSection() {
  const { user, updateProfile } = useUserStore()
  const [template, setTemplate] = useState(user?.greetingTemplate || "Hey! Great meeting you at {event}! 👋")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const preview = template.replace('{event}', 'Token2049 Singapore')

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ greetingTemplate: template } as any)
      haptic.success()
      setToast('Saved!')
    } catch {
      haptic.error()
      setToast('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 pt-2 pb-8 space-y-4">
      {toast && <Toast message={toast} type={toast === 'Saved!' ? 'success' : 'error'} duration={2000} onClose={() => setToast(null)} />}
      <div>
        <p className="text-pingr-secondary text-[13px] mb-3">
          Use <span className="text-pingr-link font-mono">{'{event}'}</span> to insert the active event name automatically.
        </p>
        <Textarea
          label="Template"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={4}
        />
      </div>
      <div>
        <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2">Preview</p>
        <div className="p-3 rounded-[12px] bg-white/[0.04] text-[14px] text-pingr-text leading-relaxed">
          {preview}
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save template'}
      </Button>
    </div>
  )
}
