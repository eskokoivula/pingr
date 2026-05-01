import type { VercelRequest, VercelResponse } from '@vercel/node'
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { Api } from 'telegram/tl/index.js'
import { CustomFile } from 'telegram/client/uploads.js'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import { pgTable, serial, varchar, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core'
import { decryptSession } from '../src/crypto.js'
import { getTelegramIdFromInitData } from '../src/telegram-utils.js'

// Node.js runtime — required for GramJS MTProto
export const config = { runtime: 'nodejs', maxDuration: 30 }

// Inline schema for tables needed in this function
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: varchar('telegram_id').unique().notNull(),
  mtprotoSession: text('mtproto_session'),
  mtprotoSessionValid: boolean('mtproto_session_valid').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
})

const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  telegramUsername: varchar('telegram_username').notNull(),
  name: varchar('name'),
  company: varchar('company'),
  category: varchar('category').notNull(),
  greetingSent: boolean('greeting_sent').default(false),
  teamChatCreated: boolean('team_chat_created').default(false),
  groupName: varchar('group_name'),
  groupChatId: varchar('group_chat_id'),
  updatedAt: timestamp('updated_at').defaultNow(),
})

function getDb() {
  const sql = neon(process.env.DATABASE_URL!)
  return drizzle(sql)
}

// Convert HTML greeting to Telegram HTML format
function cleanHtmlForTelegram(html: string): string {
  if (!html) return ''

  let text = html

  // Remove literal \n and \r from HTML — contentEditable artifacts
  text = text.replace(/[\n\r]/g, '')

  // Normalize whitespace between tags
  text = text.replace(/>\s+</g, '><')

  // Convert <br> tags to newlines
  text = text.replace(/(<br\s*\/?>){2,}/gi, '\n\n')
  text = text.replace(/(<br\s*\/?>)/gi, '\n')

  // Remove unsupported HTML tags (keep a, b, i, code, pre, u, s)
  text = text.replace(/<(?!\/?(?:a|b|i|code|pre|u|s)\b)[^>]+>/gi, '')

  // Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')

  // Max 2 consecutive newlines
  text = text.replace(/\n{3,}/g, '\n\n')

  // Trim each line
  text = text.split('\n').map(line => line.trim()).join('\n')

  return text.trim()
}

function getTelegramId(req: VercelRequest): string | null {
  return getTelegramIdFromInitData(req.headers['x-telegram-init-data'] as string)
}

async function createGramJSClient(userId: number, db: ReturnType<typeof getDb>): Promise<TelegramClient> {
  const apiId = Number(process.env.TELEGRAM_API_ID)
  const apiHash = process.env.TELEGRAM_API_HASH!

  if (!apiId || !apiHash) throw new Error('Missing GramJS API credentials')

  // Look up user's encrypted session from DB
  const [user] = await db.select({
    mtprotoSession: users.mtprotoSession,
    mtprotoSessionValid: users.mtprotoSessionValid,
  }).from(users).where(eq(users.id, userId)).limit(1)

  if (!user?.mtprotoSession) {
    throw new Error('NO_SESSION')
  }

  if (!user.mtprotoSessionValid) {
    throw new Error('SESSION_EXPIRED')
  }

  const sessionString = decryptSession(user.mtprotoSession)
  const session = new StringSession(sessionString)
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 3,
  })

  try {
    await client.connect()
  } catch (err) {
    // Mark session as invalid on connection failure
    await db.update(users).set({
      mtprotoSessionValid: false,
      updatedAt: new Date(),
    }).where(eq(users.id, userId))
    throw new Error('SESSION_EXPIRED')
  }

  return client
}

// Create group with graceful per-member adding
async function createGroupChat(
  client: TelegramClient,
  contactUsername: string,
  groupName: string,
  teamMembers: string[],
): Promise<{ inviteLink: string | null; chatId: string | null; failedMembers: string[] }> {
  const failedMembers: string[] = []

  // Step 1: Create group with just the contact
  const result = await client.invoke(new Api.messages.CreateChat({
    users: [contactUsername],
    title: groupName,
  }))

  const chatId = (result as any)?.chats?.[0]?.id?.toString()
  if (!chatId) throw new Error('Failed to extract chat ID')

  // Step 2: Add team members one by one
  for (const member of teamMembers) {
    try {
      await client.invoke(new Api.messages.AddChatUser({
        chatId: chatId as any,
        userId: member,
        fwdLimit: 0,
      }))
    } catch (err) {
      console.error(`Failed to add ${member} to group:`, err)
      failedMembers.push(member)
    }
  }

  // Step 3: Generate invite link
  let inviteLink: string | null = null
  try {
    const invite = await client.invoke(new Api.messages.ExportChatInvite({
      peer: chatId,
    }))
    inviteLink = (invite as any)?.link || null
  } catch (err) {
    console.error('Failed to export invite link:', err)
  }

  return { inviteLink, chatId, failedMembers }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-Init-Data')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { contactId, greetingMessage, selfieData, blurb, createGroup, groupName, teamMembers } = req.body || {}

  if (!contactId) return res.status(400).json({ error: 'contactId required' })

  const db = getDb()
  let client: TelegramClient | null = null

  try {
    // Get contact from DB
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1)
    if (!contact) return res.status(404).json({ error: 'Contact not found' })

    // Identify the user from initData header (required)
    const telegramId = getTelegramId(req)
    if (!telegramId) {
      return res.status(401).json({ ok: false, error: 'Missing init data', greetingSent: false })
    }

    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.telegramId, telegramId)).limit(1)
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found', greetingSent: false })
    }
    const userId = user.id

    const username = contact.telegramUsername

    // Connect with user's own MTProto session
    try {
      client = await createGramJSClient(userId, db)
    } catch (err: any) {
      if (err.message === 'NO_SESSION' || err.message === 'SESSION_EXPIRED') {
        return res.status(200).json({
          ok: false,
          error: err.message,
          greetingSent: false,
        })
      }
      throw err
    }

    let groupInviteLink: string | null = null
    let failedMembers: string[] = []

    // Step 1: Create group chat if requested
    if (createGroup && groupName && teamMembers?.length > 0) {
      try {
        const result = await createGroupChat(client, username, groupName, teamMembers)
        groupInviteLink = result.inviteLink
        failedMembers = result.failedMembers

        if (result.chatId) {
          await db.update(contacts).set({
            teamChatCreated: true,
            groupName,
            groupChatId: result.chatId,
            updatedAt: new Date(),
          }).where(eq(contacts.id, contactId))
        }
      } catch (err) {
        console.error('Group creation failed:', err)
        // Continue — send greeting without group link
      }
    }

    // Step 2: Send messages — greeting, selfie, group link, blurb
    try {
      const cleanBlurb = blurb ? cleanHtmlForTelegram(blurb) : ''
      const hasBlurb = cleanBlurb.length > 0
      const hasSelfie = !!selfieData
      const hasGroupLink = !!groupInviteLink

      const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

      // Message 1: Greeting
      if (greetingMessage) {
        const greeting = cleanHtmlForTelegram(greetingMessage)
        if (greeting) {
          const isLast = !hasSelfie && !hasGroupLink && !hasBlurb
          await client.sendMessage(username, {
            message: isLast ? greeting + '\n\nSent via pingr' : greeting,
            parseMode: 'html',
          })
          console.log('Greeting sent to', username)
        }
      }

      // Message 2: Selfie photo (if taken)
      if (hasSelfie) {
        const dataUriMatch = (selfieData as string).match(/^data:(image\/[\w+.-]+);base64,(.+)$/)
        if (!dataUriMatch) {
          console.error('selfieData is not a valid data URI — skipping selfie')
        } else {
          const mimeType = dataUriMatch[1]
          const ext = mimeType.split('/')[1]
          const raw = dataUriMatch[2]
          const approxBytes = raw.length * 0.75
          if (approxBytes > 3 * 1024 * 1024) {
            console.error('selfieData too large:', Math.round(approxBytes / 1024), 'KB — skipping')
          } else {
            await delay(800)
            const imageBuffer = Buffer.from(raw, 'base64')
            const file = new CustomFile(`selfie.${ext}`, imageBuffer.length, '', imageBuffer)
            const isLast = !hasGroupLink && !hasBlurb
            await client.sendFile(username, {
              file,
              caption: isLast ? 'Sent via pingr' : undefined,
              forceDocument: false,
              workers: 1,
            } as any)
            console.log('Selfie sent to', username)
          }
        }
      }

      // Message 3: Group invite link (if created)
      if (hasGroupLink) {
        await delay(800)
        const isLast = !hasBlurb
        await client.sendMessage(username, {
          message: isLast
            ? "Here's a group chat with our team: " + groupInviteLink + '\n\nSent via pingr'
            : "Here's a group chat with our team: " + groupInviteLink,
        })
        console.log('Group link sent to', username)
      }

      // Message 4: Blurb (if user has one)
      if (hasBlurb) {
        await delay(800)
        await client.sendMessage(username, {
          message: cleanBlurb + '\n\nSent via pingr',
          parseMode: 'html',
        })
        console.log('Blurb sent to', username)
      }

      await db.update(contacts).set({
        greetingSent: true,
        updatedAt: new Date(),
      }).where(eq(contacts.id, contactId))
    } catch (err) {
      console.error('Message send failed:', err)
      return res.status(200).json({
        ok: false,
        error: `Could not message @${username} — they may have privacy restrictions`,
        greetingSent: false,
      })
    }

    return res.status(200).json({
      ok: true,
      greetingSent: true,
      groupCreated: !!groupInviteLink,
      groupInviteLink,
      failedMembers: failedMembers.length > 0 ? failedMembers : undefined,
    })

  } catch (err: any) {
    console.error('GramJS error:', err)

    // Handle flood wait
    if (err.errorMessage?.startsWith('FLOOD_WAIT')) {
      return res.status(200).json({
        ok: false,
        error: 'FLOOD_WAIT',
        retryAfter: err.seconds || 60,
        greetingSent: false,
      })
    }

    return res.status(200).json({
      ok: false,
      error: err instanceof Error ? err.message : 'GramJS connection failed',
      greetingSent: false,
    })
  } finally {
    if (client) {
      try { await client.disconnect() } catch {}
    }
  }
}
