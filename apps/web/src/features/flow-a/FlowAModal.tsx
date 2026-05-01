import { useState, useEffect } from 'react'
import { StepIndicator } from '../../components/ui/StepIndicator'
import { Button } from '../../components/ui/Button'
import { Toast } from '../../components/ui/Toast'
import { useContactsStore } from '../../stores/contacts'
import { useUserStore } from '../../stores/user'
import { useEventStore } from '../../stores/events'
import { useTeamsStore, type TeamTemplate } from '../../stores/teams'
import { haptic, getInitData } from '../../lib/telegram'
import { CategoryStep } from './steps/CategoryStep'
import { DetailsStep } from './steps/DetailsStep'
import { TeamChatStep } from './steps/TeamChatStep'
import { SelfieStep } from './steps/SelfieStep'
import { GreetingStep } from './steps/GreetingStep'
import { SuccessScreen } from './SuccessScreen'
import { ConnectStep } from '../../pages/onboarding/steps/ConnectStep'

interface FlowAModalProps {
  username: string
  onClose: () => void
}

export function FlowAModal({ username, onClose }: FlowAModalProps) {
  const { createContact, checkDuplicate } = useContactsStore()
  const { user } = useUserStore()
  const { activeEvent } = useEventStore()
  const { teams, fetchTeams } = useTeamsStore()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showVerify, setShowVerify] = useState(false)
  const [pendingGreetingPayload, setPendingGreetingPayload] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null)

  // Form state
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [notes, setNotes] = useState('')
  const [pingNextWeek, setPingNextWeek] = useState(false)
  const [createGroupChat, setCreateGroupChat] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<TeamTemplate | null>(null)
  const [theirCompany, setTheirCompany] = useState('')
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null)
  const [greetingMessage, setGreetingMessage] = useState('')
  const [sendBlurb, setSendBlurb] = useState(!!user?.blurb)

  useEffect(() => { fetchTeams() }, [fetchTeams])

  useEffect(() => { setSendBlurb(!!user?.blurb) }, [user?.blurb])

  useEffect(() => {
    checkDuplicate(username).then((exists) => {
      if (exists) setToast({ message: `You've met @${username} before!`, type: 'warning' })
    })
  }, [username, checkDuplicate])

  // Build greeting message (without blurb — blurb is sent as separate message)
  useEffect(() => {
    const template = user?.greetingTemplate || "Hey! Great meeting you at {event}! 👋"
    const eventName = activeEvent?.name || 'the event'
    const msg = template.replace('{event}', eventName)
    setGreetingMessage(msg)
  }, [user, activeEvent])

  useEffect(() => {
    if (company && !theirCompany) setTheirCompany(company)
  }, [company, theirCompany])

  // Steps — computed without useMemo to avoid stale closure issues
  const hasTeams = teams.length > 0
  const totalSteps = hasTeams ? 5 : 4
  const selfieStepIndex = hasTeams ? 3 : 2
  const isSelfieStep = step === selfieStepIndex
  const isFirstStep = step === 0
  const isLastStep = step === totalSteps - 1
  const canProceed = step === 0 ? category !== '' : true

  const goToNextStep = () => setStep(step + 1)

  const sendGreeting = (payload: any) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    fetch(`${API_URL}/api/send-greeting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': getInitData(),
      },
      body: JSON.stringify(payload),
    }).then(res => res.json()).then(data => {
      if (data?.error === 'NO_SESSION' || data?.error === 'SESSION_EXPIRED') {
        setPendingGreetingPayload(payload)
        setShowVerify(true)
      }
    }).catch(() => {})
  }

  const handleVerified = () => {
    setShowVerify(false)
    // Retry greeting after verification
    if (pendingGreetingPayload) {
      sendGreeting(pendingGreetingPayload)
      setPendingGreetingPayload(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await createContact({
        telegramUsername: username,
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

        // Send greeting message via GramJS in background (don't block UI)
        const contactId = result.contact.id
        const greetingPayload = {
          contactId,
          greetingMessage,
          selfieData: selfieUrl || undefined,
          blurb: sendBlurb ? (user?.blurb || undefined) : undefined,
          createGroup: createGroupChat && selectedTeam,
          groupName: createGroupChat ? `${user?.company || 'Pingr'} <> ${theirCompany || company || username}` : undefined,
          teamMembers: createGroupChat && selectedTeam ? selectedTeam.members : undefined,
        }
        sendGreeting(greetingPayload)

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

  // Render current step content
  const renderStep = () => {
    const stepIndex = step
    if (stepIndex === 0) return <CategoryStep selected={category} onSelect={setCategory} />
    if (stepIndex === 1) return <DetailsStep name={name} onNameChange={setName} company={company} onCompanyChange={setCompany} notes={notes} onNotesChange={setNotes} pingNextWeek={pingNextWeek} onPingChange={setPingNextWeek} />
    if (hasTeams && stepIndex === 2) return <TeamChatStep createGroupChat={createGroupChat} onCreateGroupChatChange={setCreateGroupChat} selectedTeam={selectedTeam} onTeamSelect={setSelectedTeam} theirCompany={theirCompany} onTheirCompanyChange={setTheirCompany} userCompany={user?.company || ''} />
    if (stepIndex === selfieStepIndex) return <SelfieStep selfieUrl={selfieUrl} onSelfieChange={setSelfieUrl} onAdvance={goToNextStep} />
    if (stepIndex === totalSteps - 1) return <GreetingStep message={greetingMessage} onMessageChange={setGreetingMessage} sendBlurb={sendBlurb} onSendBlurbChange={setSendBlurb} blurb={user?.blurb || null} />
    return null
  }

  if (showVerify) {
    return (
      <div className="fixed inset-0 z-[70] bg-pingr-bg text-pingr-text flex flex-col">
        <div className="px-4 pt-4 pb-2 shrink-0">
          <button onClick={() => setShowVerify(false)} className="text-[20px] w-8 h-8 flex items-center justify-center">✕</button>
        </div>
        <div className="flex-1 px-4 pt-6">
          <ConnectStep onConnected={handleVerified} />
        </div>
      </div>
    )
  }

  if (showSuccess) return <SuccessScreen />

  return (
    <div className="fixed inset-0 z-[60] bg-pingr-bg text-pingr-text animate-slideUp flex flex-col">
      {toast && <Toast message={toast.message} type={toast.type} duration={3500} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={isFirstStep ? onClose : handleBack}
          className="text-[20px] w-8 h-8 flex items-center justify-center"
        >
          {isFirstStep ? '✕' : '‹'}
        </button>
        <div className="flex-1">
          <StepIndicator total={totalSteps} current={step} />
        </div>
        <p className="text-pingr-secondary text-[13px]">@{username}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-4 overflow-y-auto">
        {renderStep()}
      </div>

      {/* Bottom button — hidden on selfie step */}
      {!isSelfieStep && (
        <div className="px-4 pb-8 pt-4 shrink-0">
          <Button onClick={handleNext} disabled={!canProceed || saving}>
            {saving ? 'Saving...' : isLastStep ? 'Send & Save' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  )
}
