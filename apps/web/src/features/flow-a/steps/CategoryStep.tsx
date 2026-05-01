import { haptic } from '../../../lib/telegram'

const CATEGORIES = [
  { name: 'Investor', color: '#818CF8' },
  { name: 'KOL', color: '#F472B6' },
  { name: 'Marketing', color: '#FBBF24' },
  { name: 'Dev', color: '#4ADE80' },
  { name: 'Founder', color: '#C084FC' },
  { name: 'BD', color: '#60A5FA' },
  { name: 'Media', color: '#FB923C' },
  { name: 'Other', color: '#9CA3AF' },
]

interface Props {
  selected: string
  onSelect: (category: string) => void
}

export function CategoryStep({ selected, onSelect }: Props) {
  return (
    <div>
      <h2 className="text-[22px] font-bold mb-1">Category</h2>
      <p className="text-pingr-secondary text-[15px] mb-6">How would you classify this contact?</p>

      <div className="flex flex-wrap gap-2.5">
        {CATEGORIES.map(({ name, color }) => {
          const isSelected = selected === name
          return (
            <button
              key={name}
              onClick={() => {
                haptic.selection()
                onSelect(name)
              }}
              className="px-4 py-2.5 rounded-[10px] text-[14px] font-semibold transition-all"
              style={{
                color: isSelected ? '#fff' : color,
                backgroundColor: isSelected ? color : color + '18',
                borderWidth: '1.5px',
                borderStyle: 'solid',
                borderColor: isSelected ? color : color + '30',
              }}
            >
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
