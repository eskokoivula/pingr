import { useState } from 'react'
import { Input } from '../../../components/ui/Input'
import { RichTextEditor } from '../../../components/ui/RichTextEditor'
import { Button } from '../../../components/ui/Button'
import { Toast } from '../../../components/ui/Toast'
import { useUserStore } from '../../../stores/user'
import { haptic } from '../../../lib/telegram'

export function ProfileSection() {
  const { user, updateProfile } = useUserStore()
  const [name, setName] = useState(user?.name || '')
  const [company, setCompany] = useState(user?.company || '')
  const [role, setRole] = useState(user?.role || '')
  const [xHandle, setXHandle] = useState(user?.xHandle || '')
  const [blurb, setBlurb] = useState(user?.blurb || '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({
        name: name || null,
        company: company || null,
        role: role || null,
        xHandle: xHandle?.replace('@', '') || null,
        blurb: blurb || null,
      } as any)
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
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company or project" />
      <Input label="Role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Co-founder & CEO" />
      <Input label="X handle" value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="@username" />
      <RichTextEditor label="Blurb" value={blurb} onChange={setBlurb} placeholder="Short bio for greetings" rows={4} />
      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save changes'}
      </Button>
    </div>
  )
}
