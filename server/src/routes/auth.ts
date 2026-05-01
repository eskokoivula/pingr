import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { telegramAuth } from '../middleware/telegram-auth.js'
import type { AppEnv } from '../types.js'

const auth = new Hono<AppEnv>()

auth.post('/init', telegramAuth, async (c) => {
  const tgUser = c.get('telegramUser')
  const telegramId = String(tgUser.id)
  const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1)

  if (existing.length > 0) {
    const user = existing[0]
    if (tgUser.username && tgUser.username !== user.username) {
      await db
        .update(users)
        .set({ username: tgUser.username, updatedAt: new Date() })
        .where(eq(users.id, user.id))
    }
    return c.json({ user: { ...user, username: tgUser.username || user.username } })
  }

  const [newUser] = await db
    .insert(users)
    .values({
      telegramId,
      username: tgUser.username || null,
      name: name || null,
    })
    .returning()

  return c.json({ user: newUser })
})

export { auth }
