import { useEffect, useState, useCallback, useRef } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { initTelegramApp, getTelegramUser, getTelegramWebApp, haptic } from '../lib/telegram'
import { useUserStore } from '../stores/user'
import { useSettingsStore } from '../stores/settings'
import { useUIStore } from '../stores/ui'
import { TabBar } from '../components/layout/TabBar'
import { SettingsModal } from '../features/settings/SettingsModal'
import { JoinTeamScreen } from '../features/teams/JoinTeamScreen'
import { OnboardingPage } from '../pages/onboarding/OnboardingPage'
import { HomePage } from '../pages/home/HomePage'
import { ContactsPage } from '../pages/contacts/ContactsPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'

export function App() {
  const { user, loading, error, init } = useUserStore()
  const { showSettings, closeSettings } = useUIStore()
  const [joinCode, setJoinCode] = useState<string | null>(null)
  const [splashDone, setSplashDone] = useState(false)
  const [showTapPrompt, setShowTapPrompt] = useState(false)
  const tapToContinueRef = useRef(useSettingsStore.getState().tapToContinue)
  const pingAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    initTelegramApp()
    init()

    // Preload ping sound
    const audio = new Audio('/sounds/ping.mp3')
    audio.preload = 'auto'
    audio.load()
    pingAudioRef.current = audio

    // Check for team invite in start param (from Direct Link)
    const startParam = getTelegramWebApp()?.startParam
    if (startParam && startParam.length >= 6) {
      setJoinCode(startParam)
    }
    // Also check URL params (fallback)
    const urlParams = new URLSearchParams(window.location.search)
    const joinParam = urlParams.get('join')
    if (joinParam) setJoinCode(joinParam)
  }, [init])

  const handleDotLanded = useCallback(() => {
    if (tapToContinueRef.current) {
      setShowTapPrompt(true)
    } else {
      setSplashDone(true)
    }
  }, [])

  const handleSplashTap = useCallback(() => {
    if (!showTapPrompt) return
    if (pingAudioRef.current) {
      pingAudioRef.current.currentTime = 0
      pingAudioRef.current.play().catch(() => {})
    }
    haptic.medium()
    setSplashDone(true)
  }, [showTapPrompt])

  if (loading || !splashDone) {
    return (
      <div
        className="relative h-full bg-pingr-bg text-pingr-text overflow-hidden"
        onClick={handleSplashTap}
      >
        <svg viewBox="0 0 1536 1024" className="w-[320px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0,1024) scale(0.1,-0.1)" fill="#ffffff" stroke="none">
            <path d="M4505 6470 c-174 -27 -294 -71 -418 -154 -136 -90 -231 -207 -287 -352 -54 -140 -53 -138 -54 -1002 -1 -784 -1 -804 18 -818 16 -11 70 -14 275 -14 141 0 261 4 268 8 29 18 33 70 33 383 l0 319 49 -35 c140 -101 346 -138 548 -100 153 29 288 101 403 215 90 89 149 176 190 283 54 139 64 197 64 372 1 179 -14 250 -80 395 -116 251 -337 424 -624 486 -89 19 -301 27 -385 14z m289 -551 c72 -26 145 -93 181 -166 28 -54 30 -65 30 -173 0 -106 -2 -120 -29 -177 -64 -140 -210 -214 -375 -192 -79 11 -146 43 -199 97 -68 68 -82 107 -82 244 0 183 20 245 101 310 95 77 256 101 373 57z"/>
            <path d="M5742 6358 c-9 -9 -12 -200 -12 -799 l0 -788 22 -15 c19 -14 63 -16 276 -16 l253 0 24 25 25 24 0 774 c0 643 -2 776 -14 792 -13 18 -16 18 -86 -14 -124 -57 -281 -55 -419 5 -63 28 -54 27 -69 12z"/>
            <path d="M7140 6470 c-261 -31 -486 -172 -584 -367 -14 -28 -36 -87 -48 -130 -23 -77 -23 -86 -23 -641 0 -546 1 -564 19 -578 16 -11 70 -14 273 -14 240 0 254 1 273 20 19 19 20 33 20 493 0 259 5 490 10 511 31 135 203 189 311 99 65 -55 64 -47 67 -593 2 -488 3 -495 23 -512 19 -16 48 -18 269 -18 229 0 250 1 271 19 l24 19 2 474 c2 539 -4 662 -42 773 -108 323 -442 495 -865 445z"/>
            <path d="M8935 6471 c-110 -13 -221 -47 -335 -103 -92 -46 -117 -64 -201 -147 -108 -108 -151 -177 -198 -317 -78 -232 -60 -497 49 -720 41 -85 63 -116 132 -186 136 -139 293 -214 502 -240 169 -21 358 21 504 112 l65 41 -5 -84 c-3 -68 -9 -92 -32 -131 -110 -187 -479 -227 -863 -94 -140 50 -137 53 -213 -245 -39 -150 -36 -163 37 -200 71 -36 224 -83 353 -107 101 -20 137 -22 329 -17 193 4 227 7 321 31 190 49 372 156 465 273 58 72 117 193 146 298 22 76 23 102 27 550 5 585 -5 681 -88 846 -102 202 -340 364 -625 425 -85 18 -274 26 -370 15z m224 -531 c114 -19 201 -81 252 -180 19 -38 24 -64 27 -163 5 -141 -7 -181 -73 -250 -166 -173 -476 -140 -584 63 -77 144 -49 346 61 445 61 56 124 80 243 94 6 0 39 -4 74 -9z"/>
            <path d="M10738 6429 c-221 -23 -423 -152 -511 -327 -70 -141 -72 -160 -72 -779 0 -439 3 -555 13 -565 20 -20 520 -24 547 -4 19 14 20 29 25 483 l5 468 26 56 c51 108 137 141 372 144 133 2 161 5 175 19 15 15 17 44 17 246 0 207 -2 231 -18 247 -16 16 -41 18 -265 18 -136 0 -277 -3 -314 -6z"/>
          </g>
          <g className="animate-dotFall" onAnimationEnd={handleDotLanded}>
            <g transform="translate(0,1024) scale(0.1,-0.1)" fill="#0088CC" stroke="none">
              <path d="M5925 7136 c-63 -20 -98 -41 -144 -87 -53 -53 -76 -97 -91 -176 -30 -150 46 -297 192 -375 37 -20 57 -23 148 -23 100 0 108 2 166 33 113 61 176 168 177 297 1 122 -51 224 -146 287 -82 55 -209 73 -302 44z"/>
            </g>
          </g>
        </svg>
        {showTapPrompt && (
          <p className="absolute left-0 right-0 text-center text-[15px] text-pingr-secondary animate-fadeIn" style={{ top: 'calc(50% + 120px)' }}>
            Tap to continue
          </p>
        )}
      </div>
    )
  }

  if (error) {
    const tgUser = getTelegramUser()
    const displayName = user?.name || tgUser?.first_name || 'there'
    return (
      <div className="flex flex-col h-full bg-pingr-bg text-pingr-text items-center justify-center p-6">
        <img src="/logo-pingr.png" alt="pingr" className="w-[140px] mb-4" />
        <p className="text-pingr-text text-[15px] mb-1">Hey{tgUser ? `, ${displayName}` : ''}!</p>
        <p className="text-pingr-secondary text-[13px]">Connecting to server...</p>
        <p className="text-pingr-secondary text-[11px] mt-2 opacity-50">{error}</p>
      </div>
    )
  }

  // Show join screen if invite link was used
  if (joinCode && user) {
    return <JoinTeamScreen inviteCode={joinCode} onDone={() => setJoinCode(null)} />
  }

  const needsOnboarding = user && !user.onboardingCompleted

  return (
    <HashRouter>
      <div className="flex flex-col h-full bg-pingr-bg text-pingr-text">
        {showSettings && <SettingsModal onClose={closeSettings} />}
        {needsOnboarding ? (
          <Routes>
            <Route path="*" element={<OnboardingPage />} />
          </Routes>
        ) : (
          <>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <TabBar />
          </>
        )}
      </div>
    </HashRouter>
  )
}
