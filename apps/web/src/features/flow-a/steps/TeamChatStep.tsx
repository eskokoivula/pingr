import { useEffect } from 'react'
import { Toggle } from '../../../components/ui/Toggle'
import { Input } from '../../../components/ui/Input'
import { useTeamsStore, type TeamTemplate } from '../../../stores/teams'
import { haptic } from '../../../lib/telegram'

interface Props {
  createGroupChat: boolean
  onCreateGroupChatChange: (v: boolean) => void
  selectedTeam: TeamTemplate | null
  onTeamSelect: (team: TeamTemplate) => void
  theirCompany: string
  onTheirCompanyChange: (v: string) => void
  userCompany: string
}

export function TeamChatStep({
  createGroupChat, onCreateGroupChatChange,
  selectedTeam, onTeamSelect,
  theirCompany, onTheirCompanyChange,
  userCompany,
}: Props) {
  const { teams, fetchTeams } = useTeamsStore()

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const groupName = `${userCompany || 'Pingr'} <> ${theirCompany || '...'}`

  return (
    <div>
      <h2 className="text-[22px] font-bold mb-1">Team chat</h2>
      <p className="text-pingr-secondary text-[15px] mb-6">Create a group with your team and this contact</p>

      <Toggle
        checked={createGroupChat}
        onChange={onCreateGroupChatChange}
        label="Create group chat?"
      />

      {createGroupChat && (
        <div className="mt-5 space-y-4">
          {/* Team template selection */}
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2">
              Team template
            </label>
            <div className="flex flex-wrap gap-2">
              {teams.map((team) => {
                const isSelected = selectedTeam?.id === team.id
                return (
                  <button
                    key={team.id}
                    onClick={() => {
                      haptic.selection()
                      onTeamSelect(team)
                    }}
                    className={`px-4 py-2 rounded-[10px] text-[14px] font-medium transition-all border ${
                      isSelected
                        ? 'bg-pingr-link/20 border-pingr-link/40 text-pingr-link'
                        : 'bg-white/[0.04] border-white/[0.08] text-pingr-text'
                    }`}
                  >
                    {team.name}
                  </button>
                )
              })}
              {teams.length === 0 && (
                <p className="text-pingr-secondary text-[13px]">No team templates yet. Create them in Settings.</p>
              )}
            </div>
          </div>

          {/* Their company */}
          <Input
            label="Their company"
            placeholder="e.g. Sequoia Capital"
            value={theirCompany}
            onChange={(e) => onTheirCompanyChange(e.target.value)}
          />

          {/* Preview */}
          <div className="bg-white/[0.04] rounded-[12px] p-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2">Preview</p>
            <p className="text-[15px] font-semibold text-pingr-text mb-1">{groupName}</p>
            {selectedTeam && (
              <p className="text-[13px] text-pingr-secondary">
                Members: {selectedTeam.members.map((m) => `@${m}`).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
