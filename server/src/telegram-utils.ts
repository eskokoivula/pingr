// Extract telegramId from X-Telegram-Init-Data header
export function getTelegramIdFromInitData(initData: string | undefined | null): string | null {
  if (!initData) return null
  try {
    const params = new URLSearchParams(initData)
    const userRaw = params.get('user')
    if (!userRaw) return null
    const tgUser = JSON.parse(userRaw)
    return String(tgUser.id)
  } catch {
    return null
  }
}
