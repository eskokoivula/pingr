import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { TopBar } from '../../components/layout/TopBar'
import { Button } from '../../components/ui/Button'
import { Toast } from '../../components/ui/Toast'
import { ScanIcon, ChevronDownIcon } from '../../components/ui/Icons'
import { useUserStore } from '../../stores/user'
import { useEventStore } from '../../stores/events'
import { EventPicker } from '../../features/event-picker/EventPicker'
import { FlowAModal } from '../../features/flow-a/FlowAModal'
import { haptic } from '../../lib/telegram'

// Parse QR data — returns { username, raw } or { phone, raw } or { unknown, raw }
function parseQrData(data: string): { type: 'username'; value: string } | { type: 'phone'; value: string } | { type: 'unknown'; value: string } {
  if (!data) return { type: 'unknown', value: '' }
  const trimmed = data.trim()

  // t.me/username (NOT starting with +)
  const usernameMatch = trimmed.match(/t\.me\/([a-zA-Z][a-zA-Z0-9_]{2,})/)
  if (usernameMatch) return { type: 'username', value: usernameMatch[1] }

  // t.me/+phone (phone number link)
  const phoneMatch = trimmed.match(/t\.me\/\+(\d+)/)
  if (phoneMatch) return { type: 'phone', value: phoneMatch[1] }

  // tg://resolve?domain=username
  const domainMatch = trimmed.match(/domain=([a-zA-Z0-9_]{3,})/)
  if (domainMatch) return { type: 'username', value: domainMatch[1] }

  // tg://user?id=123
  const userIdMatch = trimmed.match(/user\?id=(\d+)/)
  if (userIdMatch) return { type: 'unknown', value: trimmed }

  // Bare username (not a URL)
  if (!trimmed.includes('://') && !trimmed.includes('/')) {
    const bare = trimmed.replace(/^@/, '')
    if (/^[a-zA-Z0-9_]{3,32}$/.test(bare)) return { type: 'username', value: bare }
  }

  return { type: 'unknown', value: trimmed }
}

export function HomePage() {
  const { user } = useUserStore()
  const { activeEvent, fetchEvents } = useEventStore()
  const [showEventPicker, setShowEventPicker] = useState(false)
  const [scannedUsername, setScannedUsername] = useState<string | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualHandle, setManualHandle] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const username = user?.username
  const qrUrl = username ? `https://t.me/${username}` : ''

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleScan = () => {
    haptic.medium()
    try {
      const webApp = window.Telegram?.WebApp
      if (webApp?.showScanQrPopup) {
        webApp.showScanQrPopup({ text: 'Scan a Telegram QR code' }, (data: string) => {
          const result = parseQrData(data)

          try { webApp.closeScanQrPopup() } catch {}

          if (result.type === 'username') {
            setScannedUsername(result.value)
          } else if (result.type === 'phone') {
            setToast('This person has no @username set. Enter their handle manually.')
            setShowManualEntry(true)
          } else {
            // Unknown format — show raw data so we can debug
            setToast('QR: ' + result.value.slice(0, 60))
            setShowManualEntry(true)
          }
          return true
        })
      } else {
        setShowManualEntry(true)
      }
    } catch {
      setShowManualEntry(true)
    }
  }

  const submitManualHandle = () => {
    const handle = manualHandle.replace('@', '').trim()
    if (handle) {
      haptic.light()
      setScannedUsername(handle)
      setShowManualEntry(false)
      setManualHandle('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {toast && <Toast message={toast} type="success" duration={2000} onClose={() => setToast(null)} />}

      {/* Manual entry overlay */}
      {showManualEntry && (
        <div className="fixed inset-0 z-[55]" onClick={() => setShowManualEntry(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 max-w-app mx-auto bg-[#000000] border-t border-white/[0.08] px-4 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[13px] text-pingr-secondary mb-2">Enter Telegram @handle</p>
            <div className="flex gap-2">
              <input
                value={manualHandle}
                onChange={(e) => {
                  let v = e.target.value
                  if (v && !v.startsWith('@')) v = '@' + v
                  setManualHandle(v)
                }}
                placeholder="@username"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') submitManualHandle() }}
                className="flex-1 rounded-[12px] bg-white/[0.06] border-[1.5px] border-white/[0.08] px-4 py-3 text-[16px] text-pingr-text placeholder:text-pingr-secondary/50 outline-none focus:border-white/20"
              />
              <button
                onClick={submitManualHandle}
                disabled={!manualHandle.replace('@', '').trim()}
                className="px-5 py-3 bg-white text-[#000000] rounded-[12px] text-[15px] font-bold disabled:opacity-30"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      )}

      {showEventPicker && <EventPicker onClose={() => setShowEventPicker(false)} />}
      {scannedUsername && (
        <FlowAModal
          username={scannedUsername}
          onClose={() => setScannedUsername(null)}
        />
      )}
      <TopBar />

      {/* Event indicator */}
      <button
        onClick={() => {
          haptic.light()
          setShowEventPicker(true)
        }}
        className="mx-4 mb-3 -mt-[2px] flex items-center gap-2 px-3 py-2.5 rounded-[12px] bg-white/[0.04]"
      >
        {activeEvent ? (
          <>
            <span className="w-[8px] h-[8px] rounded-full bg-pingr-success shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
            <span className="text-pingr-text text-[14px] font-medium">{activeEvent.name}</span>
          </>
        ) : (
          <span className="text-pingr-secondary text-[14px]">No active event — tap to set</span>
        )}
        <ChevronDownIcon size={14} className="text-pingr-secondary ml-auto opacity-60" />
      </button>

      {/* QR Code */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-[20px] p-6 mb-6">
          {qrUrl ? (
            <QRCodeSVG
              value={qrUrl}
              size={200}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
            />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center text-pingr-secondary text-[14px]">
              No username set
            </div>
          )}
        </div>

        <p className="text-[18px] font-bold">{user?.name || 'Your Name'}</p>
        {username && (
          <p className="text-pingr-secondary text-[14px] mt-0.5">@{username}</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-[90px] space-y-3">
        <Button onClick={handleScan}>
          <span className="flex items-center justify-center gap-2">
            <ScanIcon size={20} />
            Scan QR Code
          </span>
        </Button>

        <button
          onClick={() => {
            haptic.light()
            setShowManualEntry(true)
          }}
          className="w-full text-center py-2 text-pingr-secondary text-[14px] font-medium"
        >
          Or enter @handle manually
        </button>
      </div>
    </div>
  )
}
