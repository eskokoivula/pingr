import type { VercelRequest, VercelResponse } from '@vercel/node'
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { Api } from 'telegram/tl/index.js'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import { pgTable, serial, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { encryptSession, decryptSession } from '../src/crypto.js'
import { getTelegramIdFromInitData } from '../src/telegram-utils.js'

export const config = { runtime: 'nodejs', maxDuration: 30 }

// Inline schema for users table (Node.js runtime — can't share with Edge)
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: varchar('telegram_id').unique().notNull(),
  username: varchar('username'),
  mtprotoSession: text('mtproto_session'),
  mtprotoSessionValid: boolean('mtproto_session_valid').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
})

function getDb() {
  const sql = neon(process.env.DATABASE_URL!)
  return drizzle(sql)
}

function getApiCredentials() {
  const apiId = Number(process.env.TELEGRAM_API_ID)
  const apiHash = process.env.TELEGRAM_API_HASH!
  if (!apiId || !apiHash) throw new Error('Missing TELEGRAM_API_ID or TELEGRAM_API_HASH')
  return { apiId, apiHash }
}

function getTelegramId(req: VercelRequest): string | null {
  return getTelegramIdFromInitData(req.headers['x-telegram-init-data'] as string)
}

async function handleSendCode(req: VercelRequest, res: VercelResponse) {
  const { phone } = req.body || {}
  if (!phone) return res.status(400).json({ ok: false, error: 'Phone number required' })

  const telegramId = getTelegramId(req)
  if (!telegramId) return res.status(401).json({ ok: false, error: 'Missing init data' })

  const { apiId, apiHash } = getApiCredentials()
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
    timeout: 15,
  })

  try {
    await client.connect()

    // Use GramJS internal sendCode helper — manual invoke causes API_ID_INVALID on serverless
    const result = await (client as any).sendCode(
      { apiId: client.apiId, apiHash: client.apiHash },
      phone
    )

    // Encrypt the partial session before sending to client
    const rawPartialSession = (client.session.save() as unknown) as string
    const partialSession = encryptSession(rawPartialSession)

    return res.status(200).json({
      ok: true,
      phoneCodeHash: result.phoneCodeHash,
      partialSession,
    })
  } catch (err: any) {
    console.error('sendCode error:', err?.errorMessage || err?.message || err)

    if (err.errorMessage === 'PHONE_NUMBER_INVALID') {
      return res.status(400).json({ ok: false, error: 'Invalid phone number. Use international format (+358...)' })
    }
    if (err.errorMessage?.startsWith('FLOOD_WAIT')) {
      const seconds = err.seconds || 60
      return res.status(429).json({ ok: false, error: 'Too many attempts. Try again later.', retryAfter: seconds })
    }

    // Return actual error for debugging
    const errorMsg = err.errorMessage || err.message || 'Unknown error'
    return res.status(500).json({ ok: false, error: `Failed to send code: ${errorMsg}` })
  } finally {
    try { await client.disconnect() } catch {}
  }
}

async function handleSignIn(req: VercelRequest, res: VercelResponse) {
  const { phone, code, phoneCodeHash, partialSession } = req.body || {}
  if (!phone || !code || !phoneCodeHash || !partialSession) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' })
  }

  const telegramId = getTelegramId(req)
  if (!telegramId) return res.status(401).json({ ok: false, error: 'Missing init data' })

  const { apiId, apiHash } = getApiCredentials()
  const decryptedSession = decryptSession(partialSession)
  const client = new TelegramClient(new StringSession(decryptedSession), apiId, apiHash, {
    connectionRetries: 3,
  })

  try {
    await client.connect()

    await client.invoke(new Api.auth.SignIn({
      phoneNumber: phone,
      phoneCodeHash,
      phoneCode: code,
    }))

    // Success — save the authenticated session
    const sessionString = (client.session.save() as unknown) as string
    const encrypted = encryptSession(sessionString)

    const db = getDb()
    await db.update(users).set({
      mtprotoSession: encrypted,
      mtprotoSessionValid: true,
      updatedAt: new Date(),
    }).where(eq(users.telegramId, telegramId))

    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('signIn error:', err)

    // 2FA required
    if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
      const rawSession = (client.session.save() as unknown) as string
      const updatedPartialSession = encryptSession(rawSession)
      return res.status(200).json({
        ok: false,
        needs2FA: true,
        partialSession: updatedPartialSession,
      })
    }

    if (err.errorMessage === 'PHONE_CODE_INVALID') {
      return res.status(400).json({ ok: false, error: 'Invalid code. Please try again.' })
    }
    if (err.errorMessage === 'PHONE_CODE_EXPIRED') {
      return res.status(400).json({ ok: false, error: 'Code expired. Please request a new one.' })
    }
    if (err.errorMessage?.startsWith('FLOOD_WAIT')) {
      const seconds = err.seconds || 60
      return res.status(429).json({ ok: false, error: 'Too many attempts. Try again later.', retryAfter: seconds })
    }

    return res.status(500).json({ ok: false, error: 'Sign in failed' })
  } finally {
    try { await client.disconnect() } catch {}
  }
}

async function handleSignIn2FA(req: VercelRequest, res: VercelResponse) {
  const { password, partialSession } = req.body || {}
  if (!password || !partialSession) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' })
  }

  const telegramId = getTelegramId(req)
  if (!telegramId) return res.status(401).json({ ok: false, error: 'Missing init data' })

  const { apiId, apiHash } = getApiCredentials()
  const decryptedSession = decryptSession(partialSession)
  const client = new TelegramClient(new StringSession(decryptedSession), apiId, apiHash, {
    connectionRetries: 3,
  })

  try {
    await client.connect()

    // GramJS checkPassword helper handles SRP computation
    await (client as any).checkPassword(password)

    // Success — save the authenticated session
    const sessionString = (client.session.save() as unknown) as string
    const encrypted = encryptSession(sessionString)

    const db = getDb()
    await db.update(users).set({
      mtprotoSession: encrypted,
      mtprotoSessionValid: true,
      updatedAt: new Date(),
    }).where(eq(users.telegramId, telegramId))

    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('2FA error:', err)

    if (err.errorMessage === 'PASSWORD_HASH_INVALID') {
      return res.status(400).json({ ok: false, error: 'Wrong password. Please try again.' })
    }

    return res.status(500).json({ ok: false, error: '2FA verification failed' })
  } finally {
    try { await client.disconnect() } catch {}
  }
}

async function handleCheckSession(req: VercelRequest, res: VercelResponse) {
  const telegramId = getTelegramId(req)
  if (!telegramId) return res.status(401).json({ ok: false, error: 'Missing init data' })

  const db = getDb()
  const [user] = await db.select({
    mtprotoSession: users.mtprotoSession,
    mtprotoSessionValid: users.mtprotoSessionValid,
  }).from(users).where(eq(users.telegramId, telegramId)).limit(1)

  if (!user?.mtprotoSession) {
    return res.status(200).json({ ok: true, connected: false })
  }

  if (!user.mtprotoSessionValid) {
    return res.status(200).json({ ok: true, connected: false, expired: true })
  }

  // Optionally verify the session is still valid by connecting
  const { apiId, apiHash } = getApiCredentials()
  let client: TelegramClient | null = null
  try {
    const sessionString = decryptSession(user.mtprotoSession)
    client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
      connectionRetries: 2,
    })
    await client.connect()

    const me = await client.getMe() as any
    return res.status(200).json({
      ok: true,
      connected: true,
      username: me?.username || null,
      firstName: me?.firstName || null,
    })
  } catch (err) {
    console.error('Session check failed:', err)
    // Mark session as invalid
    await db.update(users).set({
      mtprotoSessionValid: false,
      updatedAt: new Date(),
    }).where(eq(users.telegramId, telegramId))

    return res.status(200).json({ ok: true, connected: false, expired: true })
  } finally {
    if (client) { try { await client.disconnect() } catch {} }
  }
}

async function handleRevoke(req: VercelRequest, res: VercelResponse) {
  const telegramId = getTelegramId(req)
  if (!telegramId) return res.status(401).json({ ok: false, error: 'Missing init data' })

  const db = getDb()
  const [user] = await db.select({
    mtprotoSession: users.mtprotoSession,
  }).from(users).where(eq(users.telegramId, telegramId)).limit(1)

  // Try to log out from Telegram if we have a valid session
  if (user?.mtprotoSession) {
    const { apiId, apiHash } = getApiCredentials()
    let client: TelegramClient | null = null
    try {
      const sessionString = decryptSession(user.mtprotoSession)
      client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
        connectionRetries: 2,
      })
      await client.connect()
      await client.invoke(new Api.auth.LogOut())
    } catch (err) {
      console.error('Logout failed (continuing with revoke):', err)
    } finally {
      if (client) { try { await client.disconnect() } catch {} }
    }
  }

  // Clear session from DB regardless
  await db.update(users).set({
    mtprotoSession: null,
    mtprotoSessionValid: false,
    updatedAt: new Date(),
  }).where(eq(users.telegramId, telegramId))

  return res.status(200).json({ ok: true })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-Init-Data')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action } = req.body || {}

  switch (action) {
    case 'send-code':
      return handleSendCode(req, res)
    case 'sign-in':
      return handleSignIn(req, res)
    case 'sign-in-2fa':
      return handleSignIn2FA(req, res)
    case 'check-session':
      return handleCheckSession(req, res)
    case 'revoke':
      return handleRevoke(req, res)
    default:
      return res.status(400).json({ ok: false, error: `Unknown action: ${action}` })
  }
}
