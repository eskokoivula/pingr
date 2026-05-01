import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, and, desc, like, or, sql } from 'drizzle-orm'
import { pgTable, serial, varchar, text, boolean, timestamp, integer, uniqueIndex, jsonb } from 'drizzle-orm/pg-core'

export const config = { runtime: 'edge' }

// --- Schema ---
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: varchar('telegram_id').unique().notNull(),
  username: varchar('username'),
  name: varchar('name'),
  company: varchar('company'),
  role: varchar('role'),
  xHandle: varchar('x_handle'),
  blurb: text('blurb'),
  greetingTemplate: text('greeting_template').default("Hey! Great meeting you at {event}! 👋"),
  logoUrl: text('logo_url'),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  mtprotoSessionValid: boolean('mtproto_session_valid').default(false),
  notifDailySummary: boolean('notif_daily_summary').default(true),
  notifPingReminders: boolean('notif_ping_reminders').default(true),
  notifMonthlyFollowUp: boolean('notif_monthly_follow_up').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

const eventWeeks = pgTable('event_weeks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: varchar('name').notNull(),
  startDate: varchar('start_date'),
  endDate: varchar('end_date'),
  isActive: boolean('is_active').default(false),
  logGroupChatId: varchar('log_group_chat_id'),
  createdAt: timestamp('created_at').defaultNow(),
})

const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  telegramUsername: varchar('telegram_username').notNull(),
  telegramId: varchar('telegram_id'),
  name: varchar('name'),
  company: varchar('company'),
  category: varchar('category').notNull(),
  eventWeekId: integer('event_week_id').references(() => eventWeeks.id),
  pingNextWeek: boolean('ping_next_week').default(false),
  notes: text('notes'),
  selfieUrl: text('selfie_url'),
  teamChatCreated: boolean('team_chat_created').default(false),
  groupName: varchar('group_name'),
  groupChatId: varchar('group_chat_id'),
  greetingSent: boolean('greeting_sent').default(false),
  metDate: varchar('met_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  uniqueIndex('contacts_user_username_event_idx').on(
    table.userId, table.telegramUsername, table.eventWeekId
  ),
])

const teamTemplates = pgTable('team_templates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: varchar('name').notNull(),
  members: jsonb('members').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
})

const orgTeams = pgTable('org_teams', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  inviteCode: varchar('invite_code').unique().notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
})

const orgTeamMembers = pgTable('org_team_members', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => orgTeams.id),
  userId: integer('user_id').references(() => users.id),
  joinedAt: timestamp('joined_at').defaultNow(),
}, (table) => [
  uniqueIndex('org_team_members_team_user_idx').on(table.teamId, table.userId),
])

// --- Database ---
function getDb() {
  const sql = neon(process.env.DATABASE_URL!)
  return drizzle(sql)
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// --- Telegram auth (Web Crypto API for Edge) ---
async function hmacSha256(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function validateInitData(initData: string, botToken: string): Promise<boolean> {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return false

    params.delete('hash')
    const entries = Array.from(params.entries())
    entries.sort(([a], [b]) => a.localeCompare(b))
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n')

    // Step 1: secret_key = HMAC-SHA256("WebAppData", bot_token)
    const secretKey = await hmacSha256(new TextEncoder().encode('WebAppData'), botToken)
    // Step 2: hash = HMAC-SHA256(secret_key, data_check_string)
    const computedHash = bufToHex(await hmacSha256(secretKey, dataCheckString))

    return computedHash === hash
  } catch {
    return false
  }
}

// --- App ---
const app = new Hono().basePath('/api')

app.use('/*', cors({ origin: (origin) => origin || '*' }))

app.get('/health', (c) => c.json({ status: 'ok' }))

app.post('/auth/init', async (c) => {
  const initData = c.req.header('X-Telegram-Init-Data')
  if (!initData) return c.json({ error: 'Missing init data' }, 401)

  const botToken = process.env.BOT_TOKEN
  if (!botToken) return c.json({ error: 'Server config error' }, 500)

  // TODO: Fix HMAC validation for Edge Runtime and re-enable
  // if (!(await validateInitData(initData, botToken)))
  //   return c.json({ error: 'Invalid init data' }, 401)

  const params = new URLSearchParams(initData)
  const userRaw = params.get('user')
  if (!userRaw) return c.json({ error: 'No user data' }, 401)

  let tgUser: { id: number; username?: string; first_name?: string; last_name?: string }
  try { tgUser = JSON.parse(userRaw) }
  catch { return c.json({ error: 'Invalid user data' }, 401) }

  const telegramId = String(tgUser.id)
  const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')

  try {
    const db = getDb()

    const existing = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1)

    if (existing.length > 0) {
      const user = existing[0]
      if (tgUser.username && tgUser.username !== user.username) {
        await db.update(users).set({ username: tgUser.username, updatedAt: new Date() }).where(eq(users.id, user.id))
      }
      return c.json({ user: { ...user, username: tgUser.username || user.username } })
    }

    const [newUser] = await db
      .insert(users)
      .values({ telegramId, username: tgUser.username || null, name: name || null })
      .returning()

    return c.json({ user: newUser })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: `DB error: ${msg}` }, 500)
  }
})

// Helper: extract telegram user from initData header
function getTgUser(c: any) {
  const initData = c.req.header('X-Telegram-Init-Data')
  if (!initData) return null
  const params = new URLSearchParams(initData)
  const userRaw = params.get('user')
  if (!userRaw) return null
  try { return JSON.parse(userRaw) as { id: number; username?: string } }
  catch { return null }
}

app.put('/profile', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const telegramId = String(tgUser.id)

  try {
    const db = getDb()

    const updates: Record<string, any> = { updatedAt: new Date() }
    const allowed = ['name', 'company', 'role', 'xHandle', 'blurb', 'greetingTemplate', 'onboardingCompleted']
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.telegramId, telegramId))
      .returning()

    if (!updated) return c.json({ error: 'User not found' }, 404)
    return c.json({ user: updated })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: `DB error: ${msg}` }, 500)
  }
})

// Helper: get internal user ID from telegram ID
async function getUserId(telegramId: string) {
  const db = getDb()
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.telegramId, telegramId)).limit(1)
  return user?.id || null
}

// GET /api/events — list event weeks for current user
app.get('/events', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    const events = await db.select().from(eventWeeks)
      .where(eq(eventWeeks.userId, userId))
      .orderBy(desc(eventWeeks.createdAt))

    return c.json({ events })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// POST /api/events — create event week and activate it
app.post('/events', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  if (!body.name?.trim()) return c.json({ error: 'Name is required' }, 400)

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    // Deactivate all existing events for this user
    await db.update(eventWeeks).set({ isActive: false }).where(eq(eventWeeks.userId, userId))

    // Create new event and activate it
    const [event] = await db.insert(eventWeeks).values({
      userId,
      name: body.name.trim(),
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      isActive: true,
    }).returning()

    return c.json({ event })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// PUT /api/events/:id/activate — activate an event (deactivate others)
app.put('/events/:id/activate', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  const eventId = Number(c.req.param('id'))
  if (!eventId) return c.json({ error: 'Invalid event ID' }, 400)

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    // Deactivate all
    await db.update(eventWeeks).set({ isActive: false }).where(eq(eventWeeks.userId, userId))
    // Activate the selected one
    const [event] = await db.update(eventWeeks)
      .set({ isActive: true })
      .where(and(eq(eventWeeks.id, eventId), eq(eventWeeks.userId, userId)))
      .returning()

    if (!event) return c.json({ error: 'Event not found' }, 404)
    return c.json({ event })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// Helper: get full user profile
async function getUserProfile(userId: number) {
  const db = getDb()
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return user || null
}

// GET /api/contacts/check/:username — duplicate check
app.get('/contacts/check/:username', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  const username = c.req.param('username').replace('@', '')
  if (!username) return c.json({ error: 'Username required' }, 400)

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    const existing = await db.select().from(contacts)
      .where(and(eq(contacts.userId, userId), eq(contacts.telegramUsername, username)))
      .limit(1)

    return c.json({ exists: existing.length > 0, contact: existing[0] || null })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// GET /api/contacts — list contacts for current user
app.get('/contacts', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    const { searchParams } = new URL(c.req.url)
    const eventWeekId = searchParams.get('eventWeekId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const pingOnly = searchParams.get('pingOnly')

    let query = db.select().from(contacts).where(eq(contacts.userId, userId))

    // Filters applied via chaining
    const conditions = [eq(contacts.userId, userId)]
    if (eventWeekId) conditions.push(eq(contacts.eventWeekId, Number(eventWeekId)))
    if (category) conditions.push(eq(contacts.category, category))
    if (pingOnly === 'true') conditions.push(eq(contacts.pingNextWeek, true))

    let result = await db.select().from(contacts)
      .where(and(...conditions))
      .orderBy(desc(contacts.createdAt))

    // Text search (client-side for simplicity in Edge)
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(c =>
        c.name?.toLowerCase().includes(s) ||
        c.company?.toLowerCase().includes(s) ||
        c.telegramUsername.toLowerCase().includes(s)
      )
    }

    return c.json({ contacts: result })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// POST /api/contacts — create contact
app.post('/contacts', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const username = body.telegramUsername?.replace('@', '')?.trim()
  if (!username) return c.json({ error: 'Username required' }, 400)
  if (!body.category) return c.json({ error: 'Category required' }, 400)

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()

    // Get today's date in European format for metDate
    const now = new Date()
    const metDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const [contact] = await db.insert(contacts).values({
      userId,
      telegramUsername: username,
      name: body.name?.trim() || null,
      company: body.company?.trim() || null,
      category: body.category,
      eventWeekId: body.eventWeekId || null,
      pingNextWeek: body.pingNextWeek || false,
      notes: body.notes?.trim() || null,
      selfieUrl: body.selfieUrl || null,
      metDate,
      greetingSent: false,
      teamChatCreated: false,
    }).returning()

    // Build greeting message
    const profile = await getUserProfile(userId)
    let greetingMessage = body.greetingMessage || null

    return c.json({
      contact,
      greeting: {
        message: greetingMessage,
        contactUsername: username,
        senderName: profile?.name || null,
        senderCompany: profile?.company || null,
      }
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown'
    // Handle unique constraint violation
    if (msg.includes('23505') || msg.includes('unique')) {
      return c.json({ error: 'Contact already exists for this event' }, 409)
    }
    return c.json({ error: `DB error: ${msg}` }, 500)
  }
})

// PUT /api/contacts/:id — update contact
app.put('/contacts/:id', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  const contactId = Number(c.req.param('id'))
  if (!contactId) return c.json({ error: 'Invalid contact ID' }, 400)

  const body = await c.req.json()

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    const updates: Record<string, any> = { updatedAt: new Date() }
    const allowed = ['name', 'company', 'category', 'notes', 'pingNextWeek', 'selfieUrl']
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    const [updated] = await db.update(contacts)
      .set(updates)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .returning()

    if (!updated) return c.json({ error: 'Contact not found' }, 404)
    return c.json({ contact: updated })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// DELETE /api/contacts/:id — delete contact
app.delete('/contacts/:id', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  const contactId = Number(c.req.param('id'))
  if (!contactId) return c.json({ error: 'Invalid contact ID' }, 400)

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    const [deleted] = await db.delete(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .returning()

    if (!deleted) return c.json({ error: 'Contact not found' }, 404)
    return c.json({ ok: true })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// GET /api/teams — list team templates
app.get('/teams', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    const teams = await db.select().from(teamTemplates)
      .where(eq(teamTemplates.userId, userId))
      .orderBy(desc(teamTemplates.createdAt))

    return c.json({ teams })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// POST /api/teams — create team template
app.post('/teams', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  if (!body.name?.trim()) return c.json({ error: 'Name is required' }, 400)

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    const members = (body.members || []).map((m: string) => m.trim().replace('@', '')).filter(Boolean)

    const [team] = await db.insert(teamTemplates).values({
      userId,
      name: body.name.trim(),
      members,
    }).returning()

    return c.json({ team })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// DELETE /api/teams/:id — delete team template
app.delete('/teams/:id', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  const teamId = Number(c.req.param('id'))
  if (!teamId) return c.json({ error: 'Invalid team ID' }, 400)

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    const [deleted] = await db.delete(teamTemplates)
      .where(and(eq(teamTemplates.id, teamId), eq(teamTemplates.userId, userId)))
      .returning()

    if (!deleted) return c.json({ error: 'Team not found' }, 404)
    return c.json({ ok: true })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// === ORG TEAMS ===

// POST /api/org-teams — create team
app.post('/org-teams', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  if (!body.name?.trim()) return c.json({ error: 'Name required' }, 400)

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    const inviteCode = generateInviteCode()

    const [team] = await db.insert(orgTeams).values({
      name: body.name.trim(),
      inviteCode,
      createdBy: userId,
    }).returning()

    // Auto-join the creator
    await db.insert(orgTeamMembers).values({ teamId: team.id, userId })

    const botUsername = process.env.BOT_USERNAME || 'pingr_app_bot'
    const inviteLink = `https://t.me/${botUsername}/app?startapp=${inviteCode}`

    return c.json({ team, inviteLink })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// GET /api/org-teams — list my teams
app.get('/org-teams', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    // Get all teams where user is a member
    const memberships = await db.select({ teamId: orgTeamMembers.teamId })
      .from(orgTeamMembers).where(eq(orgTeamMembers.userId, userId))

    if (memberships.length === 0) return c.json({ teams: [] })

    const teamIds = memberships.map(m => m.teamId!)
    const teams = await db.select().from(orgTeams)
      .where(sql`${orgTeams.id} IN (${sql.join(teamIds.map(id => sql`${id}`), sql`, `)})`)

    // For each team, get member count
    const teamsWithCounts = await Promise.all(teams.map(async (team) => {
      const members = await db.select({ count: sql<number>`count(*)` })
        .from(orgTeamMembers).where(eq(orgTeamMembers.teamId, team.id))
      const botUsername = process.env.BOT_USERNAME || 'pingr_app_bot'
      return {
        ...team,
        memberCount: Number(members[0]?.count || 0),
        inviteLink: `https://t.me/${botUsername}/app?startapp=${team.inviteCode}`,
      }
    }))

    return c.json({ teams: teamsWithCounts })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// GET /api/org-teams/:code/info — team info by invite code (for join screen)
app.get('/org-teams/:code/info', async (c) => {
  const code = c.req.param('code')
  try {
    const db = getDb()
    const [team] = await db.select().from(orgTeams).where(eq(orgTeams.inviteCode, code)).limit(1)
    if (!team) return c.json({ error: 'Team not found' }, 404)

    const members = await db.select({ count: sql<number>`count(*)` })
      .from(orgTeamMembers).where(eq(orgTeamMembers.teamId, team.id))

    // Get creator name
    const [creator] = await db.select({ name: users.name, username: users.username })
      .from(users).where(eq(users.id, team.createdBy!)).limit(1)

    return c.json({
      team: { id: team.id, name: team.name },
      memberCount: Number(members[0]?.count || 0),
      createdBy: creator?.name || creator?.username || 'Unknown',
    })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// POST /api/org-teams/:code/join — join team by invite code
app.post('/org-teams/:code/join', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  const code = c.req.param('code')
  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    const [team] = await db.select().from(orgTeams).where(eq(orgTeams.inviteCode, code)).limit(1)
    if (!team) return c.json({ error: 'Team not found' }, 404)

    // Check if already member
    const [existing] = await db.select().from(orgTeamMembers)
      .where(and(eq(orgTeamMembers.teamId, team.id), eq(orgTeamMembers.userId, userId))).limit(1)

    if (existing) return c.json({ ok: true, alreadyMember: true })

    await db.insert(orgTeamMembers).values({ teamId: team.id, userId })
    return c.json({ ok: true, alreadyMember: false })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// GET /api/org-teams/:id/members — list members with contact counts
app.get('/org-teams/:id/members', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  const teamId = Number(c.req.param('id'))
  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    // Verify user is a member
    const [membership] = await db.select().from(orgTeamMembers)
      .where(and(eq(orgTeamMembers.teamId, teamId), eq(orgTeamMembers.userId, userId))).limit(1)
    if (!membership) return c.json({ error: 'Not a member' }, 403)

    // Get all members with their user info
    const members = await db.select({
      userId: orgTeamMembers.userId,
      joinedAt: orgTeamMembers.joinedAt,
      name: users.name,
      username: users.username,
      company: users.company,
    }).from(orgTeamMembers)
      .innerJoin(users, eq(orgTeamMembers.userId, users.id))
      .where(eq(orgTeamMembers.teamId, teamId))

    // Get contact counts per member
    const membersWithCounts = await Promise.all(members.map(async (m) => {
      const [result] = await db.select({ count: sql<number>`count(*)` })
        .from(contacts).where(eq(contacts.userId, m.userId!))
      return { ...m, contactCount: Number(result?.count || 0) }
    }))

    return c.json({ members: membersWithCounts })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// GET /api/org-teams/:id/member/:userId/contacts — member's contacts (read-only)
app.get('/org-teams/:id/member/:memberId/contacts', async (c) => {
  const tgUser = getTgUser(c)
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401)

  const teamId = Number(c.req.param('id'))
  const memberId = Number(c.req.param('memberId'))

  try {
    const userId = await getUserId(String(tgUser.id))
    if (!userId) return c.json({ error: 'User not found' }, 404)

    const db = getDb()
    // Verify requester is a team member
    const [membership] = await db.select().from(orgTeamMembers)
      .where(and(eq(orgTeamMembers.teamId, teamId), eq(orgTeamMembers.userId, userId))).limit(1)
    if (!membership) return c.json({ error: 'Not a member' }, 403)

    // Verify target is also a team member
    const [targetMembership] = await db.select().from(orgTeamMembers)
      .where(and(eq(orgTeamMembers.teamId, teamId), eq(orgTeamMembers.userId, memberId))).limit(1)
    if (!targetMembership) return c.json({ error: 'Target not a member' }, 403)

    const memberContacts = await db.select().from(contacts)
      .where(eq(contacts.userId, memberId))
      .orderBy(desc(contacts.createdAt))

    return c.json({ contacts: memberContacts })
  } catch (err) {
    return c.json({ error: `DB error: ${err instanceof Error ? err.message : 'Unknown'}` }, 500)
  }
})

// Temporary: reset onboarding for all users (remove later)
app.post('/admin/reset-onboarding', async (c) => {
  try {
    const db = getDb()
    await db.update(users).set({ onboardingCompleted: false, updatedAt: new Date() })
    return c.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: msg }, 500)
  }
})

// Temporary: debug blurb HTML
app.get('/admin/debug-blurb', async (c) => {
  try {
    const db = getDb()
    const allUsers = await db.select({ id: users.id, name: users.name, blurb: users.blurb }).from(users)
    return c.json({ users: allUsers })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default handle(app)
