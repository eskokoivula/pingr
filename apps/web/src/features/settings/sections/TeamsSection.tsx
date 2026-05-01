import { useState, useEffect } from 'react'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Toast } from '../../../components/ui/Toast'
import { useTeamsStore } from '../../../stores/teams'
import { useOrgTeamsStore } from '../../../stores/orgTeams'
import { haptic } from '../../../lib/telegram'

export function TeamsSection() {
  const { teams: templateTeams, fetchTeams: fetchTemplateTeams, createTeam: createTemplateTeam, deleteTeam: deleteTemplateTeam } = useTeamsStore()
  const { teams: orgTeams, fetchTeams: fetchOrgTeams, createTeam: createOrgTeam, joinTeam } = useOrgTeamsStore()
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [templateMembers, setTemplateMembers] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { fetchTemplateTeams(); fetchOrgTeams() }, [fetchTemplateTeams, fetchOrgTeams])

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return
    const team = await createOrgTeam(orgName.trim())
    if (team) {
      haptic.success()
      setToast('Team created!')
      setShowCreateOrg(false)
      setOrgName('')
    }
  }

  const handleJoin = async () => {
    const code = joinCode.trim()
    if (!code) return
    const result = await joinTeam(code)
    if (result?.ok) {
      haptic.success()
      setToast(result.alreadyMember ? 'Already a member!' : 'Joined team!')
      setShowJoin(false)
      setJoinCode('')
      fetchOrgTeams()
    } else {
      haptic.error()
      setToast('Invalid code or team not found')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      haptic.success()
      setToast('Code copied!')
    }).catch(() => {
      // Fallback for environments without clipboard API
      haptic.light()
      setToast('Code: ' + code)
    })
  }

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) return
    const memberList = templateMembers.split(',').map(m => m.trim().replace('@', '')).filter(Boolean)
    await createTemplateTeam(templateName.trim(), memberList)
    haptic.success()
    setToast('Template created!')
    setShowCreateTemplate(false)
    setTemplateName(''); setTemplateMembers('')
  }

  return (
    <div className="px-4 pt-2 pb-8">
      {toast && <Toast message={toast} type="success" duration={2000} onClose={() => setToast(null)} />}

      {/* Org Teams */}
      <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2">Your teams</p>
      <p className="text-[13px] text-pingr-secondary mb-3">Share contacts with your team at events</p>

      <div className="space-y-2 mb-3">
        {orgTeams.map(team => (
          <div key={team.id} className="px-4 py-3 rounded-[12px] bg-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[15px] font-medium">{team.name}</p>
              <span className="text-[12px] text-pingr-secondary">{team.memberCount} member{team.memberCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-pingr-secondary uppercase tracking-wider">Code:</span>
              <code className="text-[15px] font-mono font-bold text-pingr-link tracking-wider">{team.inviteCode}</code>
              <button
                onClick={() => handleCopyCode(team.inviteCode)}
                className="text-[12px] text-pingr-secondary ml-auto px-2 py-1 rounded bg-white/[0.06] active:bg-white/[0.12]"
              >
                Copy
              </button>
            </div>
            <p className="text-[11px] text-pingr-secondary mt-1.5">Share this code — your team enters it in Settings → Teams → Join</p>
          </div>
        ))}
      </div>

      {showJoin ? (
        <div className="space-y-3 pt-3 border-t border-white/[0.06] mb-4">
          <Input placeholder="Enter invite code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} autoFocus />
          <Button onClick={handleJoin} disabled={!joinCode.trim()}>Join team</Button>
          <button onClick={() => { setShowJoin(false); setJoinCode('') }} className="w-full text-center py-2 text-pingr-secondary text-[14px]">Cancel</button>
        </div>
      ) : showCreateOrg ? (
        <div className="space-y-3 pt-3 border-t border-white/[0.06] mb-4">
          <Input placeholder="Team name (e.g. BD Team)" value={orgName} onChange={(e) => setOrgName(e.target.value)} autoFocus />
          <Button onClick={handleCreateOrg} disabled={!orgName.trim()}>Create team</Button>
          <button onClick={() => setShowCreateOrg(false)} className="w-full text-center py-2 text-pingr-secondary text-[14px]">Cancel</button>
        </div>
      ) : (
        <div className="flex gap-3 mb-6">
          <button onClick={() => { haptic.light(); setShowCreateOrg(true) }} className="flex-1 text-center py-3 text-pingr-link text-[14px] font-medium rounded-[10px] bg-white/[0.04]">
            + Create team
          </button>
          <button onClick={() => { haptic.light(); setShowJoin(true) }} className="flex-1 text-center py-3 text-pingr-link text-[14px] font-medium rounded-[10px] bg-white/[0.04]">
            Join with code
          </button>
        </div>
      )}

      {/* Team Templates (for group chats) */}
      <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2 mt-4">Group chat templates</p>
      <p className="text-[13px] text-pingr-secondary mb-3">Used when creating Telegram group chats with contacts</p>

      <div className="space-y-2 mb-3">
        {templateTeams.map(team => (
          <div key={team.id} className="flex items-center gap-3 px-4 py-3 rounded-[12px] bg-white/[0.04]">
            <div className="flex-1">
              <p className="text-[15px] font-medium">{team.name}</p>
              <p className="text-[13px] text-pingr-secondary">
                {team.members?.map(m => `@${m}`).join(', ') || 'No members'}
              </p>
            </div>
            <button onClick={() => { haptic.light(); deleteTemplateTeam(team.id) }} className="text-pingr-error text-[13px] font-medium">Delete</button>
          </div>
        ))}
      </div>

      {showCreateTemplate ? (
        <div className="space-y-3 pt-3 border-t border-white/[0.06]">
          <Input placeholder="Template name (e.g. BD Team)" value={templateName} onChange={(e) => setTemplateName(e.target.value)} autoFocus />
          <Input placeholder="Members (@anna, @mikko)" value={templateMembers} onChange={(e) => setTemplateMembers(e.target.value)} />
          <Button onClick={handleCreateTemplate} disabled={!templateName.trim()}>Create template</Button>
          <button onClick={() => setShowCreateTemplate(false)} className="w-full text-center py-2 text-pingr-secondary text-[14px]">Cancel</button>
        </div>
      ) : (
        <button onClick={() => { haptic.light(); setShowCreateTemplate(true) }} className="w-full text-center py-3 text-pingr-link text-[15px] font-medium">
          + Add group chat template
        </button>
      )}
    </div>
  )
}
