import { haptic } from '../../lib/telegram'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
}

export function Button({ variant = 'primary', fullWidth = true, children, onClick, ...props }: ButtonProps) {
  const base = 'rounded-[14px] px-6 py-4 text-[16px] font-bold transition-opacity active:opacity-80 disabled:opacity-40'
  const variants = {
    primary: 'bg-white text-[#000000]',
    secondary: 'bg-white/[0.06] text-pingr-text border-[1.5px] border-white/[0.08]',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
      onClick={(e) => {
        haptic.light()
        onClick?.(e)
      }}
      {...props}
    >
      {children}
    </button>
  )
}
