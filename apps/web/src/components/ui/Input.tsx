interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full rounded-[12px] bg-white/[0.06] border-[1.5px] border-white/[0.08] px-4 py-[14px] text-[15px] text-pingr-text placeholder:text-pingr-secondary/50 outline-none focus:border-white/20 transition-colors ${className}`}
        {...props}
      />
    </div>
  )
}

import { forwardRef } from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full rounded-[12px] bg-white/[0.06] border-[1.5px] border-white/[0.08] px-4 py-[14px] text-[15px] text-pingr-text placeholder:text-pingr-secondary/50 outline-none focus:border-white/20 transition-colors resize-none ${className}`}
          {...props}
        />
      </div>
    )
  }
)
