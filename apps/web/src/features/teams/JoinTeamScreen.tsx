import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/Button'
import { useOrgTeamsStore } from '../../stores/orgTeams'
import { haptic } from '../../lib/telegram'
import { api } from '../../lib/api'

interface Props {
  inviteCode: string
  onDone: () => void
}

interface TeamInfo {
  team: { id: number; name: string }
  memberCount: number
  createdBy: string
}

export function JoinTeamScreen({ inviteCode, onDone }: Props) {
  const { joinTeam } = useOrgTeamsStore()
  const [info, setInfo] = useState<TeamInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<TeamInfo>(`/api/org-teams/${inviteCode}/info`)
      .then(setInfo)
      .catch(() => setError('Team not found'))
      .finally(() => setLoading(false))
  }, [inviteCode])

  const handleJoin = async () => {
    setJoining(true)
    const result = await joinTeam(inviteCode)
    if (result?.ok) {
      haptic.success()
      onDone()
    } else {
      haptic.error()
      setError('Failed to join team')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] bg-pingr-bg flex items-center justify-center">
        <p className="text-pingr-secondary">Loading...</p>
      </div>
    )
  }

  if (error || !info) {
    return (
      <div className="fixed inset-0 z-[70] bg-pingr-bg flex flex-col items-center justify-center px-6">
        <p className="text-pingr-error text-[16px] mb-4">{error || 'Team not found'}</p>
        <Button onClick={onDone}>Continue to app</Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] bg-pingr-bg flex flex-col items-center justify-center px-6">
      <div className="w-[72px] h-[72px] rounded-full bg-pingr-link/20 flex items-center justify-center text-[32px] mb-4">
        👥
      </div>
      <h1 className="text-[24px] font-bold text-pingr-text mb-1">Join {info.team.name}?</h1>
      <p className="text-pingr-secondary text-[14px] mb-1">Created by {info.createdBy}</p>
      <p className="text-pingr-secondary text-[13px] mb-8">{info.memberCount} member{info.memberCount !== 1 ? 's' : ''}</p>

      <div className="w-full max-w-[300px] space-y-3">
        <Button onClick={handleJoin} disabled={joining}>
          {joining ? 'Joining...' : 'Join team'}
        </Button>
        <button onClick={onDone} className="w-full text-center py-2 text-pingr-secondary text-[14px]">
          Skip
        </button>
      </div>
    </div>
  )
}
