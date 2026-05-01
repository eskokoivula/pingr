import { useState } from 'react'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { api } from '../../../lib/api'
import { useUserStore } from '../../../stores/user'

type Phase = 'idle' | 'requesting' | 'phoneFallback' | 'code' | '2fa' | 'verified'

interface Props {
  onConnected: () => void
}

// Try to get phone via Telegram native dialog, fall back to manual input
async function requestPhoneFromTelegram(): Promise<string | null> {
  const webApp = (window as any).Telegram?.WebApp
  if (!webApp?.requestContact) return null

  return new Promise((resolve) => {
    try {
      webApp.requestContact((sent: boolean, event?: any) => {
        if (sent && event?.responseUnsafe?.contact?.phone_number) {
          resolve(event.responseUnsafe.contact.phone_number)
        } else {
          resolve(null)
        }
      })
    } catch {
      resolve(null)
    }
  })
}

export function ConnectStep({ onConnected }: Props) {
  const { user, setUser } = useUserStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [phoneCodeHash, setPhoneCodeHash] = useState('')
  const [partialSession, setPartialSession] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendCode = async (phoneNumber: string) => {
    const res = await api<{ ok: boolean; phoneCodeHash: string; partialSession: string; error?: string }>(
      '/api/mtproto-auth',
      { method: 'POST', body: JSON.stringify({ action: 'send-code', phone: phoneNumber }) }
    )
    if (!res.ok) throw new Error(res.error || 'Failed to send code')
    setPhone(phoneNumber)
    setPhoneCodeHash(res.phoneCodeHash)
    setPartialSession(res.partialSession)
    setPhase('code')
  }

  const handleVerifyPhone = async () => {
    setLoading(true)
    setError(null)
    setPhase('requesting')

    try {
      const phoneNumber = await requestPhoneFromTelegram()

      if (phoneNumber) {
        // Got phone from native dialog — send code automatically
        await sendCode(phoneNumber)
      } else {
        // Native dialog not available or user cancelled — show manual input
        setPhase('phoneFallback')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setPhase('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSendCode = async () => {
    if (!phone.trim()) return
    setLoading(true)
    setError(null)
    try {
      await sendCode(phone.trim())
    } catch (err: any) {
      setError(err.message || 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await api<{ ok: boolean; needs2FA?: boolean; partialSession?: string; error?: string }>(
        '/api/mtproto-auth',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'sign-in',
            phone,
            code: code.trim(),
            phoneCodeHash,
            partialSession,
          }),
        }
      )
      if (res.needs2FA) {
        setPartialSession(res.partialSession || partialSession)
        setPhase('2fa')
        return
      }
      if (!res.ok) {
        setError(res.error || 'Verification failed')
        return
      }
      if (user) setUser({ ...user, mtprotoSessionValid: true })
      setPhase('verified')
      setTimeout(onConnected, 1000)
    } catch (err: any) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!password) return
    setLoading(true)
    setError(null)
    try {
      const res = await api<{ ok: boolean; error?: string }>(
        '/api/mtproto-auth',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'sign-in-2fa', password, partialSession }),
        }
      )
      if (!res.ok) {
        setError(res.error || '2FA verification failed')
        return
      }
      if (user) setUser({ ...user, mtprotoSessionValid: true })
      setPhase('verified')
      setTimeout(onConnected, 1000)
    } catch (err: any) {
      setError(err.message || '2FA verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (phase === 'verified') {
    return (
      <div className="flex flex-col items-center justify-center pt-12">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <span className="text-green-400 text-[28px]">&#10003;</span>
        </div>
        <h2 className="text-[22px] font-bold">Verified!</h2>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-[22px] font-bold mb-2">Verify your phone</h2>
      <p className="text-pingr-secondary text-[15px] mb-6">
        {(phase === 'idle' || phase === 'requesting') && 'pingr needs to verify your phone to send messages for you.'}
        {phase === 'phoneFallback' && 'Enter the phone number linked to your Telegram.'}
        {phase === 'code' && 'Enter the code from your Telegram messages.'}
        {phase === '2fa' && 'Enter your Telegram password.'}
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-[12px] px-3 py-2.5 mb-4">
          <p className="text-red-400 text-[14px]">{error}</p>
        </div>
      )}

      {(phase === 'idle' || phase === 'requesting') && (
        <Button onClick={handleVerifyPhone} disabled={loading}>
          {loading ? 'Verifying...' : 'Verify phone number'}
        </Button>
      )}

      {phase === 'phoneFallback' && (
        <div className="space-y-4">
          <Input
            placeholder="+358 40 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus
            type="tel"
          />
          <Button onClick={handleManualSendCode} disabled={loading || !phone.trim()}>
            {loading ? 'Sending...' : 'Send code'}
          </Button>
        </div>
      )}

      {phase === 'code' && (
        <div className="space-y-4">
          <Input
            placeholder="12345"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            type="text"
            inputMode="numeric"
          />
          <Button onClick={handleVerifyCode} disabled={loading || !code.trim()}>
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </div>
      )}

      {phase === '2fa' && (
        <div className="space-y-4">
          <Input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            type="password"
          />
          <Button onClick={handleVerify2FA} disabled={loading || !password}>
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </div>
      )}
    </div>
  )
}
