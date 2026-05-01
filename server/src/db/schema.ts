import { pgTable, serial, integer, varchar, text, boolean, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
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
  mtprotoSession: text('mtproto_session'),
  mtprotoSessionValid: boolean('mtproto_session_valid').default(false),
  notifDailySummary: boolean('notif_daily_summary').default(true),
  notifPingReminders: boolean('notif_ping_reminders').default(true),
  notifMonthlyFollowUp: boolean('notif_monthly_follow_up').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const eventWeeks = pgTable('event_weeks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: varchar('name').notNull(),
  startDate: varchar('start_date'),
  endDate: varchar('end_date'),
  isActive: boolean('is_active').default(false),
  logGroupChatId: varchar('log_group_chat_id'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const contacts = pgTable('contacts', {
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
    table.userId,
    table.telegramUsername,
    table.eventWeekId
  ),
])

export const teamTemplates = pgTable('team_templates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: varchar('name').notNull(),
  members: jsonb('members').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const customCategories = pgTable('custom_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: varchar('name').notNull(),
  color: varchar('color').notNull(),
})

export const orgTeams = pgTable('org_teams', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  inviteCode: varchar('invite_code').unique().notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
})

export const orgTeamMembers = pgTable('org_team_members', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => orgTeams.id),
  userId: integer('user_id').references(() => users.id),
  joinedAt: timestamp('joined_at').defaultNow(),
}, (table) => [
  uniqueIndex('org_team_members_team_user_idx').on(table.teamId, table.userId),
])
