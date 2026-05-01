import { useState } from 'react'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'

interface Team {
  name: string
  members: string
}

interface Props {
  teams: Team[]
  onChange: (teams: Team[]) => void
}

export function TeamsStep({ teams, onChange }: Props) {
  const [name, setName] = useState('')
  const [members, setMembers] = useState('')

  const addTeam = () => {
    if (!name.trim()) return
    onChange([...teams, { name: name.trim(), members: members.trim() }])
    setName('')
    setMembers('')
  }

  const removeTeam = (index: number) => {
    onChange(teams.filter((_, i) => i !== index))
  }

  return (
    <div>
      <h2 className="text-[22px] font-bold mb-2">Team templates</h2>
      <p className="text-pingr-secondary text-[15px] mb-6">
        Optional. Create teams to quickly add members to group chats.
      </p>

      {teams.map((team, i) => (
        <div key={i} className="flex items-center gap-2 mb-3 bg-white/[0.06] rounded-[12px] px-3 py-2.5">
          <div className="flex-1">
            <p className="text-[15px] font-medium">{team.name}</p>
            <p className="text-[13px] text-pingr-secondary">{team.members}</p>
          </div>
          <button onClick={() => removeTeam(i)} className="text-pingr-secondary text-[18px] px-1">×</button>
        </div>
      ))}

      <div className="space-y-3 mt-4">
        <Input
          placeholder="Team name (e.g. BD Team)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Members (@anna, @mikko)"
          value={members}
          onChange={(e) => setMembers(e.target.value)}
        />
        <Button variant="secondary" onClick={addTeam} disabled={!name.trim()}>
          + Add team
        </Button>
      </div>
    </div>
  )
}
