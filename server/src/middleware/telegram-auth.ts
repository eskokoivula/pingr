import { createHmac } from 'crypto'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types.js'

export const telegramAuth = createMiddleware<AppEnv>(async (c, next) => {
  const initData = c.req.header('X-Telegram-Init-Data')

  if (!initData) {
    return c.json({ error: 'Missing Telegram init data' }, 401)
  }

  const botToken = process.env.BOT_TOKEN
  if (!botToken) {
    return c.json({ error: 'Server configuration error' }, 500)
  }

  const isValid = validateInitData(initData, botToken)
  if (!isValid) {
    return c.json({ error: 'Invalid Telegram init data' }, 401)
  }

  const params = new URLSearchParams(initData)
  const userRaw = params.get('user')
  if (userRaw) {
    try {
      c.set('telegramUser', JSON.parse(userRaw))
    } catch {
      return c.json({ error: 'Invalid user data' }, 401)
    }
  }

  await next()
})

function validateInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return false

  params.delete('hash')
  const entries = Array.from(params.entries())
  entries.sort(([a], [b]) => a.localeCompare(b))
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const computedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  return computedHash === hash
}
