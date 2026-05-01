interface StepIndicatorProps {
  total: number
  current: number
}

export function StepIndicator({ total, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-[4px] rounded-[4px] transition-all duration-300 ${
            i <= current
              ? 'w-[24px] bg-white'
              : 'w-[8px] bg-white/20'
          }`}
        />
      ))}
    </div>
  )
}
