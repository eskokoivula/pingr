# Pingr

**Telegram Mini App for crypto event networking.**
Scan QR → save contact → send greeting → inform team. Under 15 seconds.

Built for events where you meet many people fast and need to capture, qualify, and follow up without losing context.

---

## How it works

1. You meet someone at an event and they show their Telegram QR code.
2. Open Pingr inside Telegram, tap **Scan**, and the contact is saved instantly.
3. Pingr sends them a personalized greeting on your behalf.
4. A private group chat is created automatically with you, the contact, and your team — so follow-up happens in one place.

---

## Tech stack

| Layer       | Tech                                                          |
| ----------- | ------------------------------------------------------------- |
| Frontend    | React 18 + TypeScript + Vite + Tailwind CSS                   |
| Telegram    | `@telegram-apps/sdk-react` (tma.js v3)                        |
| Backend     | Node.js + TypeScript + Hono                                   |
| Database    | PostgreSQL + Drizzle ORM                                      |
| Bot         | grammY (Bot API) + GramJS (MTProto, for group creation)       |
| State       | Zustand (kept portable for a future Flutter port)             |
| Monorepo    | pnpm workspaces + Turborepo                                   |
| Deployment  | Vercel (frontend + API), Neon (Postgres)                      |

---

## Project structure

```
apps/web/         → Telegram Mini App (React, deploys to Vercel)
apps/bot/         → Telegram Bot + GramJS client (grammY)
server/           → API server (Hono, deploys to Vercel)
packages/shared/  → Shared types and validators
scripts/          → One-off tooling (e.g. GramJS session generator)
```

---

## Setup

### Prerequisites

- Node.js 20+
- pnpm 10+
- A PostgreSQL database (Neon recommended)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- Telegram API credentials from [my.telegram.org](https://my.telegram.org)

### Install

```bash
pnpm install
```

### Configure environment

Each app has its own `.env`. Copy the example files and fill in real values:

```bash
cp server/.env.example server/.env
cp apps/web/.env.example apps/web/.env
cp apps/bot/.env.example apps/bot/.env
```

Generate the GramJS session (one-time, interactive):

```bash
pnpm tsx scripts/generate-session.ts
```

Push the database schema:

```bash
pnpm db:push
```

---

## Commands

```bash
pnpm dev          # Start frontend + backend + bot
pnpm dev:web      # Frontend only (Vite, port 5173)
pnpm dev:server   # API server only
pnpm dev:bot      # Bot only
pnpm build        # Build all packages
pnpm db:push      # Push schema changes to database
pnpm db:studio    # Open Drizzle Studio (database viewer)
```

---

## Environment variables

### `server/.env`

| Variable                | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `BOT_TOKEN`             | Telegram bot token (from @BotFather)       |
| `TELEGRAM_API_ID`       | Telegram API ID (my.telegram.org)          |
| `TELEGRAM_API_HASH`     | Telegram API hash (my.telegram.org)        |
| `GRAMJS_SESSION`        | GramJS session string (generated locally)  |
| `MTPROTO_ENCRYPTION_KEY`| Key used to encrypt the GramJS session     |
| `DATABASE_URL`          | PostgreSQL connection string               |
| `REDIS_URL`             | Redis URL (optional)                       |
| `FRONTEND_URL`          | Frontend origin (used for CORS)            |
| `PORT`                  | Local API port (default `3001`)            |

### `apps/web/.env`

| Variable             | Purpose                                |
| -------------------- | -------------------------------------- |
| `VITE_API_URL`       | API base URL                           |
| `VITE_BOT_USERNAME`  | Bot username (without `@`)             |

### `apps/bot/.env`

| Variable            | Purpose                              |
| ------------------- | ------------------------------------ |
| `BOT_TOKEN`         | Telegram bot token                   |
| `TELEGRAM_API_ID`   | Telegram API ID                      |
| `TELEGRAM_API_HASH` | Telegram API hash                    |
| `FRONTEND_URL`      | Frontend origin                      |

---

## Architecture notes

- **Mini App first, Flutter later.** Business logic lives in the backend so the UI can be rebuilt natively without touching the rest.
- **GramJS creates the group chats** via a service account, because the Bot API cannot create groups. If group creation fails, the contact is still saved and the user is notified.
- **The bot can only message users who have started it (`/start`).** This is handled gracefully — it never blocks contact saving.
- **QR scanning** uses Telegram's native `showScanQrPopup()` and parses `t.me/username` links to extract the `@username`.
- **`initData` validation** (HMAC-SHA256) is enforced on every API call. Client data is never trusted without it.
- **Mobile-first**, max width 430px, dark theme (`#1A1A1D`). Telegram CSS variables are used for theming.
- **VPN-resilient by design:** aggressive caching via the DeviceStorage API, optimistic UI, and exponential-backoff retries on every network call.

---

## Documentation

- [`pingr-complete-prompt.md`](./pingr-complete-prompt.md) — full Finnish-language specification including database schema, all views, bot commands, API endpoints, and the visual design system.
- [`CLAUDE.md`](./CLAUDE.md) — project context for Claude Code sessions.

---

## Status

Active development. Not yet released publicly.
