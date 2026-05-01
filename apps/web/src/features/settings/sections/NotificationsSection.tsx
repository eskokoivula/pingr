import { useState } from 'react'
import { Toggle } from '../../../components/ui/Toggle'
import { Button } from '../../../components/ui/Button'
import { Toast } from '../../../components/ui/Toast'
import { useUserStore } from '../../../stores/user'
import { haptic } from '../../../lib/telegram'

export function NotificationsSection() {
  const { user, updateProfile } = useUserStore()
  const [dailySummary, setDailySummary] = useState(user?.onboardingCompleted ? true : false)
  const [pingReminders, setPingReminders] = useState(true)
  const [monthlyFollowUp, setMonthlyFollowUp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({
        notifDailySummary: dailySummary,
        notifPingReminders: pingReminders,
        notifMonthlyFollowUp: monthlyFollowUp,
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
    <div className="px-4 pt-2 pb-8 space-y-2">
      {toast && <Toast message={toast} type={toast === 'Saved!' ? 'success' : 'error'} duration={2000} onClose={() => setToast(null)} />}
      <Toggle
        checked={dailySummary}
        onChange={setDailySummary}
        label="Daily summary"
        description="Recap at 22:00 local time during events"
      />
      <Toggle
        checked={pingReminders}
        onChange={setPingReminders}
        label="Ping reminders"
        description="Monday at 12:00 UTC after events"
      />
      <Toggle
        checked={monthlyFollowUp}
        onChange={setMonthlyFollowUp}
        label="Monthly follow-up"
        description="Reminder for contacts you haven't reached"
      />
      <div className="pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
