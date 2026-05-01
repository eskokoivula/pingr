import { useState, useEffect } from 'react'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Toast } from '../../../components/ui/Toast'
import { api } from '../../../lib/api'
import { haptic } from '../../../lib/telegram'
import { useUserStore } from '../../../stores/user'

type Phase = 'loading' | 'disconnected' | 'phone' | 'code' | '2fa' | 'connected'

export function TelegramAccountSection() {
  const { user, setUser } = useUserStore()
  const [phase, setPhase] = useState<Phase>('loading')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [phoneCodeHash, setPhoneCodeHash] = useState('')
  const [partialSession, setPartialSession] = useState('')
  const [connectedUsername, setConnectedUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const res = await api<{ ok: boolean; connected: boolean; expired?: boolean; username?: string }>(
        '/api/mtproto-auth',
        { method: 'POST', body: JSON.stringify({ action: 'check-session' }) }
      )
      if (res.connected) {
        setConnectedUsername(res.username || null)
        setPhase('connected')
      } else if (res.expired) {
        setPhase('disconnected')
        setError('Session expired. Please reconnect.')
      } else {
        setPhase('disconnected')
      }
    } catch {
      setPhase('disconnected')
    }
  }

  const handleSendCode = async () => {
    if (!phone.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await api<{ ok: boolean; phoneCodeHash: string; partialSession: string; error?: string }>(
        '/api/mtproto-auth',
        { method: 'POST', body: JSON.stringify({ action: 'send-code', phone: phone.trim() }) }
      )
      if (!res.ok) {
        setError(res.error || 'Failed to send code')
        return
      }
      setPhoneCodeHash(res.phoneCodeHash)
      setPartialSession(res.partialSession)
      setPhase('code')
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
          body: JSON.stringify({ action: 'sign-in', phone: phone.trim(), code: code.trim(), phoneCodeHash, partialSession }),
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
      haptic.success()
      if (user) setUser({ ...user, mtprotoSessionValid: true })
      setToast('Connected!')
      setPhase('connected')
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
        { method: 'POST', body: JSON.stringify({ action: 'sign-in-2fa', password, partialSession }) }
      )
      if (!res.ok) {
        setError(res.error || '2FA verification failed')
        return
      }
      haptic.success()
      if (user) setUser({ ...user, mtprotoSessionValid: true })
      setToast('Connected!')
      setPhase('connected')
    } catch (err: any) {
      setError(err.message || '2FA verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      await api('/api/mtproto-auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'revoke' }),
      })
      haptic.success()
      if (user) setUser({ ...user, mtprotoSessionValid: false })
      setConnectedUsername(null)
      setPhase('disconnected')
      setToast('Disconnected')
    } catch {
      setError('Failed to disconnect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pt-4">
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}

      {phase === 'loading' && (
        <p className="text-pingr-secondary text-[15px]">Checking connection...</p>
      )}

      {phase === 'connected' && (
        <div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-[12px] px-4 py-3 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400 text-[16px]">&#10003;</span>
              <p className="text-green-400 text-[15px] font-medium">Connected</p>
            </div>
            {connectedUsername && (
              <p className="text-pingr-secondary text-[13px]">Logged in as @{connectedUsername}</p>
            )}
          </div>
          <p className="text-pingr-secondary text-[14px] mb-4">
            Messages and group chats are sent from your Telegram account.
          </p>
          <Button variant="secondary" onClick={handleDisconnect} disabled={loading}>
            {loading ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </div>
      )}

      {(phase === 'disconnected' || phase === 'phone') && (
        <div>
          <p className="text-pingr-secondary text-[15px] mb-4">
            Connect your Telegram account to send messages as yourself.
          </p>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[12px] px-3 py-2.5 mb-4">
              <p className="text-red-400 text-[14px]">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <Input
              placeholder="+358 40 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
            />
            <Button onClick={handleSendCode} disabled={loading || !phone.trim()}>
              {loading ? 'Sending...' : 'Send code'}
            </Button>
          </div>
        </div>
      )}

      {phase === 'code' && (
        <div>
          <p className="text-pingr-secondary text-[15px] mb-4">
            Enter the verification code sent to your Telegram.
          </p>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[12px] px-3 py-2.5 mb-4">
              <p className="text-red-400 text-[14px]">{error}</p>
            </div>
          )}
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
        </div>
      )}

      {phase === '2fa' && (
        <div>
          <p className="text-pingr-secondary text-[15px] mb-4">
            Enter your two-factor authentication password.
          </p>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[12px] px-3 py-2.5 mb-4">
              <p className="text-red-400 text-[14px]">{error}</p>
            </div>
          )}
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
        </div>
      )}
    </div>
  )
}
