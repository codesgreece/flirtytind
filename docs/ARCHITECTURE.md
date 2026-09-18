# Flirty Greece — Technical Architecture

## Overview

Production-structured dating app monorepo:

- `apps/api` — NestJS REST + Socket.IO
- `apps/mobile` — Expo React Native (Expo Router)
- `packages/shared` — types, events, constants
- `packages/validation` — Zod schemas
- `prisma` — schema + migrations + seed (dev only)

## Data flow

```
Mobile (TanStack Query + Zustand)
   │ REST /api/v1/*
   ▼
NestJS Controllers → Services → Prisma → PostgreSQL
   │
   ├─ Socket.IO (auth JWT) ↔ Redis adapter / presence
   └─ StorageService (S3-compatible abstraction)
   └─ BillingProvider (dev adapter; webhook-ready)
```

## Auth

- Register / login with email+password (phone flow UI; email primary for accounts)
- Access JWT (short) + refresh token (rotated, hashed in DB)
- bcrypt password hashing
- Guards on REST + Socket handshake

## Matching

`Like` unique(fromUserId, toUserId). On create, if reciprocal like exists → transaction creates `Match` + `Conversation` + participants + notifications + emit `match.created`.

## Entitlements

Server-authoritative counters keyed by UTC day/week. Plans: FREE, PLUS, GOLD, PLATINUM. Consumables create ledger entries; spend is atomic.

## Realtime events

`match.created`, `message.created`, `message.read`, `user.typing`, `user.online`, `user.offline`, `notification.created`, `like.created`, `boost.started`, `boost.expired`, `subscription.updated`

## Storage

`StorageProvider` interface: local filesystem in development; S3-compatible in production via env.

## Billing

`BillingProvider` interface with `DevBillingProvider` confirming purchases without cards. Webhook handler stub for future Stripe/RevenueCat.
