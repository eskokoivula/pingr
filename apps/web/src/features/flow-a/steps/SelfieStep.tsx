import { useRef } from 'react'
import { Button } from '../../../components/ui/Button'

interface Props {
  selfieUrl: string | null
  onSelfieChange: (url: string | null) => void
  onAdvance: () => void
}

export function SelfieStep({ selfieUrl, onSelfieChange, onAdvance }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      onSelfieChange(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUsePhoto = () => {
    onAdvance()
  }

  const handleSkip = () => {
    onSelfieChange(null)
    onAdvance()
  }

  return (
    <div>
      <h2 className="text-[22px] font-bold mb-1">Take a selfie</h2>
      <p className="text-pingr-secondary text-[15px] mb-6">A photo together helps you remember the conversation</p>

      {/* Hidden file input — uses native camera on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview or placeholder */}
      <div className="aspect-[3/4] w-full max-w-[280px] mx-auto mb-4 rounded-[16px] overflow-hidden bg-white/[0.04]">
        {selfieUrl ? (
          <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[16px]">
            <span className="text-[40px] mb-2 opacity-30">📷</span>
            <p className="text-pingr-secondary text-[13px]">Front camera</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {selfieUrl ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              onSelfieChange(null)
              fileInputRef.current?.click()
            }}>
              Retake
            </Button>
            <Button onClick={handleUsePhoto}>Use photo</Button>
          </div>
        ) : (
          <>
            <Button onClick={() => fileInputRef.current?.click()}>Take photo</Button>
            <button
              onClick={handleSkip}
              className="w-full text-center py-2 text-pingr-secondary text-[14px]"
            >
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  )
}
