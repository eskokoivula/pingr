export const DEFAULT_CATEGORIES = [
  { name: 'Investor', color: '#818CF8' },
  { name: 'KOL', color: '#F472B6' },
  { name: 'Marketing', color: '#FBBF24' },
  { name: 'Dev', color: '#4ADE80' },
  { name: 'Founder', color: '#C084FC' },
  { name: 'BD', color: '#60A5FA' },
  { name: 'Media', color: '#FB923C' },
  { name: 'Other', color: '#9CA3AF' },
] as const

export type CategoryName = typeof DEFAULT_CATEGORIES[number]['name']
