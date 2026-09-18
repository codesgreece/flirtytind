# Flirty Greece

Production-structured dating application (Expo + NestJS + PostgreSQL + Redis + Socket.IO).

UI references in `ui-references/` and inventory in `docs/UI_INVENTORY.md` are the visual source of truth. The API/database/realtime stack is the functional source of truth.

## Stack

| Layer | Tech |
|-------|------|
| Mobile | Expo, React Native, Expo Router, Reanimated, Gesture Handler, TanStack Query, Zustand |
| API | NestJS, Prisma, Zod, JWT access/refresh |
| Realtime | Socket.IO + Redis presence |
| Data | PostgreSQL |
| Cache | Redis |
| Storage | Local (dev) / S3-compatible abstraction |
| Billing | `BillingProvider` + `DevBillingProvider` (no cards stored) |

## Monorepo

```
apps/api          NestJS API + Prisma
apps/mobile       Expo React Native app
packages/shared   Plans, entitlements, realtime event names
packages/validation Zod schemas
docs/             Architecture + UI inventory
ui-references/    Screenshot source of truth
docker-compose.yml PostgreSQL + Redis
```

## Prerequisites

- Node 20+
- pnpm 10+
- PostgreSQL 16
- Redis 7

Or use Docker Compose for Postgres/Redis:

```bash
docker compose up -d
```

## Setup

```bash
cp .env.example .env
pnpm install
node node_modules/prisma/build/index.js generate --schema=apps/api/prisma/schema.prisma
node node_modules/prisma/build/index.js migrate deploy --schema=apps/api/prisma/schema.prisma
pnpm --filter @flirty/shared build
pnpm --filter @flirty/validation build
cd apps/api && pnpm exec tsx prisma/seed.ts
```

Seed creates **DEV ONLY** accounts (`seed.alice@flirty.local`, `seed.bob@flirty.local`, `seed.cara@flirty.local`, `seed.admin@flirty.local`) with password `SeedPass123!`. Never use these as production users.

## Run

### Infrastructure (if not using Docker)

```bash
sudo service postgresql start
sudo service redis-server start
```

### API

```bash
pnpm --filter @flirty/api start:dev
# http://localhost:3001/api/v1/health
```

### Mobile

```bash
cp apps/mobile/.env.example apps/mobile/.env   # EXPO_PUBLIC_API_URL=http://localhost:3001
pnpm --filter @flirty/mobile start
```

Use a device/emulator that can reach the API host (replace `localhost` with your LAN IP for physical devices).

## Plans & entitlements (server-enforced)

| Plan | Price | Highlights |
|------|-------|------------|
| FREE | €0 | 50 likes/day, 1 rewind/day, 1 Super Like/week, 1 DM/day |
| PLUS | €7.99 | Unlimited likes, Passport, Incognito, 5 Super Likes/week, 3 DMs/day |
| GOLD | €14.99 | Who Likes You, Top Picks, 10 Super Likes/week, 10 DMs/day, 1 Boost/month |
| PLATINUM | €24.99 | Unlimited DMs, 20 Super Likes/week, 2 Boosts/month, priority, message before match |

Consumables: 5 Super Likes €4.99 · Boost 30m €3.99 · First Message €2.99 · Spotlight 30m €4.99

## API surface (prefix `/api/v1`)

- `auth` — register, login, refresh, logout
- `users` — me, delete
- `profiles` / `interests` / `photos`
- `preferences` — discovery filters, passport fields, incognito
- `discover/feed` — real ranked feed
- `swipes` / `swipes/rewind`
- `matches` / `likes/received`
- `messages` — conversations, history, send, read, direct
- `notifications`
- `blocks` / `reports`
- `subscriptions` / `entitlements` / `consumables` / `boosts`
- `passport` / `top-picks` / `flirts`
- `admin/*` — ADMIN role
- `health`

## Realtime events

`match.created`, `message.created`, `message.read`, `user.typing`, `user.online`, `user.offline`, `notification.created`, `like.created`, `boost.started`, `boost.expired`, `subscription.updated`

## Tests

```bash
pnpm --filter @flirty/api test
pnpm --filter @flirty/api test:e2e
pnpm --filter @flirty/api typecheck
pnpm --filter @flirty/mobile typecheck
```

## Production notes

1. Rotate `JWT_*` secrets and `BILLING_WEBHOOK_SECRET`.
2. Set `STORAGE_DRIVER=s3` and S3 credentials.
3. Replace `DevBillingProvider` with a real provider implementing `BillingProvider` (webhooks + idempotency already structured).
4. Enable Redis Socket.IO adapter for multi-instance.
5. Do not run seed in production.
6. Configure CORS, rate limits, and TLS termination at the edge.

## Docs

- [UI inventory](docs/UI_INVENTORY.md)
- [Architecture](docs/ARCHITECTURE.md)
