/**
 * Telegram Mini App helpers.
 * Uses the raw window.Telegram.WebApp API for broad compatibility.
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            username?: string
            first_name?: string
            last_name?: string
          }
        }
        showScanQrPopup: (params: { text?: string }, callback?: (data: string) => boolean | void) => void
        closeScanQrPopup: () => void
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        themeParams: Record<string, string>
        colorScheme: 'light' | 'dark'
        isExpanded: boolean
        viewportHeight: number
        viewportStableHeight: number
        startParam?: string
      }
    }
  }
}

export function getTelegramWebApp() {
  return window.Telegram?.WebApp
}

export function getInitData(): string {
  return getTelegramWebApp()?.initData || ''
}

export function getTelegramUser() {
  return getTelegramWebApp()?.initDataUnsafe?.user
}

// Haptic feedback wrappers
export const haptic = {
  light: () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('light'),
  medium: () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('medium'),
  heavy: () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('heavy'),
  success: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('success'),
  error: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('error'),
  warning: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('warning'),
  selection: () => getTelegramWebApp()?.HapticFeedback?.selectionChanged(),
}

// Initialize Telegram Mini App
export function initTelegramApp() {
  const webApp = getTelegramWebApp()
  if (webApp) {
    webApp.ready()
    webApp.expand()
  }
}
