import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StepIndicator } from '../../components/ui/StepIndicator'
import { Button } from '../../components/ui/Button'
import { Toast } from '../../components/ui/Toast'
import { useUserStore } from '../../stores/user'
import { haptic } from '../../lib/telegram'
import { ConnectStep } from './steps/ConnectStep'
import { NameStep } from './steps/NameStep'
import { CompanyStep } from './steps/CompanyStep'
import { BlurbStep } from './steps/BlurbStep'
import { TeamsStep } from './steps/TeamsStep'

const TOTAL_STEPS = 5

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, updateProfile } = useUserStore()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const [name, setName] = useState(user?.name || '')
  const [company, setCompany] = useState(user?.company || '')
  const [blurb, setBlurb] = useState(user?.blurb || '')
  const [teams, setTeams] = useState<{ name: string; members: string }[]>([])

  const isFirstStep = step === 0
  const isLastStep = step === TOTAL_STEPS - 1
  const isConnectStep = step === 0

  const handleNext = () => {
    haptic.light()
    if (isLastStep) {
      handleFinish()
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    haptic.light()
    if (!isFirstStep) {
      setStep(step - 1)
    }
  }

  const handleSkip = () => {
    haptic.light()
    if (isLastStep) {
      handleFinish()
    } else {
      setStep(step + 1)
    }
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await updateProfile({
        name: name || null,
        company: company || null,
        blurb: blurb || null,
        onboardingCompleted: true,
      } as any)
      haptic.success()
      navigate('/', { replace: true })
    } catch {
      setToast('Failed to save profile')
      haptic.error()
    } finally {
      setSaving(false)
    }
  }

  const steps = [
    <ConnectStep onConnected={() => { haptic.success(); setStep(1) }} />,
    <NameStep value={name} onChange={setName} />,
    <CompanyStep value={company} onChange={setCompany} />,
    <BlurbStep value={blurb} onChange={setBlurb} />,
    <TeamsStep teams={teams} onChange={setTeams} />,
  ]

  return (
    <div className="flex flex-col h-full bg-pingr-bg text-pingr-text">
      {toast && <Toast message={toast} type="error" onClose={() => setToast(null)} />}

      {/* Header: back button + step indicator + skip */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={handleBack}
          className={`text-[20px] w-8 h-8 flex items-center justify-center transition-opacity ${
            isFirstStep ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          ‹
        </button>
        <div className="flex-1">
          <StepIndicator total={TOTAL_STEPS} current={step} />
        </div>
        {/* No skip on verify step */}
        {!isConnectStep && (
          <button
            onClick={handleSkip}
            className="text-pingr-secondary text-[14px] font-medium"
          >
            Skip
          </button>
        )}
        {isConnectStep && <div className="w-8" />}
      </div>

      <div className="flex-1 px-4 pt-6 overflow-y-auto">
        {steps[step]}
      </div>

      {/* Hide bottom button on ConnectStep — it handles its own flow */}
      {!isConnectStep && (
        <div className="px-4 pb-8 pt-4">
          <Button onClick={handleNext} disabled={saving}>
            {saving ? 'Saving...' : isLastStep ? 'Get started' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  )
}
