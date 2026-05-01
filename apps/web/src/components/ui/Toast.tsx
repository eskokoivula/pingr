import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'warning' | 'error'
  duration?: number
  onClose: () => void
}

const colors = {
  success: 'bg-pingr-success/20 text-pingr-success border-pingr-success/30',
  warning: 'bg-pingr-warning/20 text-pingr-warning border-pingr-warning/30',
  error: 'bg-pingr-error/20 text-pingr-error border-pingr-error/30',
}

export function Toast({ message, type = 'success', duration = 2000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 200)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-[12px] backdrop-blur-md border text-[14px] font-medium transition-opacity duration-200 ${
        colors[type]
      } ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {message}
    </div>
  )
}
