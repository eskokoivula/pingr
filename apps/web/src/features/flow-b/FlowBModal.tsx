import { useState } from 'react'
import { StepIndicator } from '../../components/ui/StepIndicator'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Toast } from '../../components/ui/Toast'
import { useContactsStore } from '../../stores/contacts'
import { useEventStore } from '../../stores/events'
import { haptic } from '../../lib/telegram'
import { CategoryStep } from '../flow-a/steps/CategoryStep'
import { DetailsStep } from '../flow-a/steps/DetailsStep'
import { SuccessScreen } from '../flow-a/SuccessScreen'

interface FlowBModalProps {
  onClose: () => void
}

const TOTAL_STEPS = 3

export function FlowBModal({ onClose }: FlowBModalProps) {
  const { createContact, checkDuplicate } = useContactsStore()
  const { activeEvent } = useEventStore()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null)

  // Form state
  const [username, setUsername] = useState('')
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [notes, setNotes] = useState('')
  const [pingNextWeek, setPingNextWeek] = useState(false)

  const cleanUsername = username.replace('@', '').trim()
  const isFirstStep = step === 0
  const isLastStep = step === TOTAL_STEPS - 1

  const canProceed = step === 0 ? cleanUsername.length >= 3
    : step === 1 ? category !== ''
    : true

  const handleDuplicateCheck = async () => {
    if (!cleanUsername) return
    const exists = await checkDuplicate(cleanUsername)
    if (exists) {
      setToast({ message: `You've met @${cleanUsername} before!`, type: 'warning' })
    }
  }

  const handleNext = () => {
    haptic.light()
    if (isLastStep) {
      handleSave()
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    haptic.light()
    if (step > 0) setStep(step - 1)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await createContact({
        telegramUsername: cleanUsername,
        category,
        name: name || undefined,
        company: company || undefined,
        notes: notes || undefined,
        pingNextWeek,
        eventWeekId: activeEvent?.id,
      } as any)

      if (result) {
        haptic.success()
        setShowSuccess(true)
        setTimeout(() => { setShowSuccess(false); onClose() }, 1800)
      } else {
        const err = useContactsStore.getState().error
        setToast({ message: err || 'Failed to save', type: 'error' })
      }
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Error', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (showSuccess) return <SuccessScreen />

  const renderStep = () => {
    if (step === 0) return (
      <div>
        <h2 className="text-[22px] font-bold mb-1">Add contact</h2>
        <p className="text-pingr-secondary text-[15px] mb-6">Enter their Telegram @username</p>
        <Input
          placeholder="@username"
          value={username}
          onChange={(e) => {
            let v = e.target.value
            if (v && !v.startsWith('@')) v = '@' + v
            setUsername(v)
          }}
          onBlur={handleDuplicateCheck}
          autoFocus
        />
      </div>
    )
    if (step === 1) return <CategoryStep selected={category} onSelect={setCategory} />
    if (step === 2) return (
      <DetailsStep
        name={name} onNameChange={setName}
        company={company} onCompanyChange={setCompany}
        notes={notes} onNotesChange={setNotes}
        pingNextWeek={pingNextWeek} onPingChange={setPingNextWeek}
      />
    )
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] bg-pingr-bg text-pingr-text animate-slideUp flex flex-col">
      {toast && <Toast message={toast.message} type={toast.type} duration={3500} onClose={() => setToast(null)} />}

      <div className="px-4 pt-4 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={isFirstStep ? onClose : handleBack}
          className="text-[20px] w-8 h-8 flex items-center justify-center"
        >
          {isFirstStep ? '✕' : '‹'}
        </button>
        <div className="flex-1">
          <StepIndicator total={TOTAL_STEPS} current={step} />
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 overflow-y-auto">
        {renderStep()}
      </div>

      <div className="px-4 pb-8 pt-4 shrink-0">
        <Button onClick={handleNext} disabled={!canProceed || saving}>
          {saving ? 'Saving...' : isLastStep ? 'Save contact' : 'Next'}
        </Button>
      </div>
    </div>
  )
}
