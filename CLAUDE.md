# pingr

Telegram Mini App for crypto event networking. Scan QR → save contact → send greeting → inform team. Under 15 seconds.

**Owner is not a developer.** Always explain what you're doing and why. Ask confirmation before major steps. If something breaks, explain simply and fix it.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + @telegram-apps/sdk-react (tma.js v3)
- **Backend:** Node.js + TypeScript + Hono + Drizzle ORM + PostgreSQL
- **Bot:** grammY (Bot API) + GramJS (MTProto — group creation)
- **State:** Zustand (portable to Flutter later)
- **Monorepo:** pnpm workspaces + Turborepo

## Architecture

```
apps/web/        → Telegram Mini App (React, deploys to Vercel)
apps/bot/        → Telegram Bot + GramJS client (grammY)
server/          → API server (Hono, deploys to Railway/Fly.io)
packages/shared/ → Shared types and validators
```

## Commands

```bash
pnpm dev          # Start all services (frontend + backend + bot)
pnpm dev:web      # Frontend only (Vite, port 5173)
pnpm dev:server   # API server only
pnpm dev:bot      # Bot only
pnpm build        # Build all
pnpm db:push      # Push schema changes to database
pnpm db:studio    # Open Drizzle Studio (database viewer)
```

## Full Specification

**Read `pingr-complete-prompt.md` in project root** for the complete spec including:
- Database schema (section 4)
- Telegram SDK integration details (section 5)
- GramJS group creation flow (section 6)
- All views and user flows with exact UI specs (section 7)
- Bot commands and automated actions (section 8)
- All API endpoints (section 9)
- Visual design system — colors, typography, components (section 10)
- VPN-resilient architecture requirements (section 11)
- Environment variables needed (section 12)
- Implementation order — 11 phases (section 13)

## Key Decisions

- **Telegram Mini App first**, Flutter port later. Backend and business logic must stay cleanly separated from UI.
- **GramJS creates groups** via a service account (MTProto). The Bot API cannot create groups. If group creation fails, save the contact anyway and notify the user.
- **Bot can only message users who have started it** (/start). Handle this gracefully — never block contact saving.
- **QR scanning** uses Telegram's native `showScanQrPopup()`. Parse `t.me/username` to extract @username.
- **initData validation** (HMAC-SHA256) is mandatory on every API call. Never trust client data without it.
- **Max width 430px**, dark theme (#1A1A1D), mobile-first. Use Telegram CSS variables for theming.
- **VPN resilience:** aggressive caching (DeviceStorage API), optimistic UI, exponential backoff retries.

## Env Variables

Backend `.env` — ask the user for these values when needed:
```
BOT_TOKEN=           # from @BotFather
TELEGRAM_API_ID=     # from my.telegram.org
TELEGRAM_API_HASH=   # from my.telegram.org
GRAMJS_SESSION=      # generated via scripts/generate-session.ts
DATABASE_URL=        # PostgreSQL connection string
REDIS_URL=           # Redis connection string
FRONTEND_URL=        # Vercel URL after deploy
```

Frontend `.env`:
```
VITE_API_URL=        # backend URL
VITE_BOT_USERNAME=   # bot username without @
```

## Working With This Project

- No git workflow — developing locally for now.
- Always test in Telegram after changes (not just browser). Use ngrok or Vite SSL for HTTPS during dev.
- After each implementation phase, ask the user to confirm it works before moving on.
- When compacting, preserve: current implementation phase, list of completed features, any pending issues.
