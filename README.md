# PulseKit

Developer-facing notification and alerting infrastructure. Instrument your app with a tiny SDK, define rules in a dashboard, and PulseKit handles multi-channel delivery (email, Slack, webhook, in-app) with retries, rate limiting, deduplication, and real-time status.

> 🚧 **Work in progress.** Currently in the mini-project phase: each core concept is built independently first, then assembled into PulseKit.

## The Problem

Every app eventually needs to notify people — users and developers. Building email logic, Slack integration, retries, deduplication, and rate limiting yourself is painful. PulseKit takes care of it so you don't have to.

```js
import { PulseKit } from 'pulsekit'

const pulse = new PulseKit({ apiKey: 'your-key' })

pulse.notify({
  event: 'payment.failed',
  user: 'user_123',
  data: { amount: 499, reason: 'card_declined' }
})
```

## Current Status — Core Schema + Ingestion API

PulseKit's canonical database schema and the Express ingestion API that writes to it are in place. This is the foundation the delivery workers (email, Slack, webhook, in-app) will later read from.

### Database schema (PostgreSQL)

Five tables, ordered by foreign-key dependency:

| Migration | Table | Purpose |
|---|---|---|
| `001_create_users.sql` | `users` | PulseKit account owners |
| `002_create_projects.sql` | `projects` | A user's app(s), each with an `api_key` |
| `003_create_events.sql` | `events` | Ingested events (`event_name`, `user_id`, `payload`) |
| `004_create_delivery_logs.sql` | `delivery_logs` | **Append-only** — one row per delivery attempt, never updated |
| `005_create_notifications.sql` | `notifications` | User-facing notification records |

Key design decisions:

- **`events` has no `status` or `channel`** — those live on `delivery_logs`. An `Event` returned by the API is a **joined view** of `events` + latest `delivery_logs` row.
- **`delivery_logs` is append-only** — every attempt is a new row (retry history, no destructive updates).
- **Canonical channels:** `email | slack | webhook | inapp`
- **Canonical statuses:** `pending | delivered | failed | rate_limited | deduplicated`

### Ingestion API (Express)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/events` | API key | List project's events (joined view) |
| `POST` | `/api/v1/events` | API key | Ingest an event |
| `GET` | `/api/v1/events/:id` | API key | Fetch one event with its delivery logs |

- **Versioned routes** — `/api/v1/...` so future breaking changes add v2 without breaking deployed SDKs.
- **API-key auth middleware** (`apiKeyAuth`) — reads `Authorization: Bearer <api_key>`, resolves the `project_id` from the `projects` table, and attaches it to the request. All queries are scoped to that project.
- **Rate limiting** — Post route is rate-limited by a Redis sliding-window limiter.
- **`GET /events` uses a LEFT JOIN** so events with no `delivery_logs` row yet (still `pending`) are visible with `status: null`.
- **`GET /events/:id` aggregates** each event's `delivery_logs` into a nested `logs` array via `json_agg` (COALESCE + `FILTER (WHERE d.id IS NOT NULL)` so an event with no logs returns `[]`, not null).
- **Dev mode** — if no `api_key` is sent (e.g. the browser dashboard) and `NODE_ENV !== 'production'`, the middleware falls back to a hardcoded dev key.

### Dashboard (Next.js)

App Router dashboard under `apps/web`. Server components fetch the Express API directly (`/api/v1/events...` with a Bearer API key — server-side `fetch` needs absolute URLs; relative `/api` paths are client-only). The list page shows each event's latest delivery attempt (status/channel) with a delivery count; the detail page renders the full nested `logs` table (channel, status, attempt, error, delivered time). FE types mirror the API's snake_case + nested `logs` shape.

## Tech Stack

| Layer | Tech |
|---|---|
| API | Node.js + Express + TypeScript |
| API auth | Bearer API-key middleware, project-scoped |
| Database | PostgreSQL 18 (`gen_random_uuid()` built in) |
| Cache / rate limit | Redis (ioredis) + Lua script |
| Dashboard | Next.js (App Router) |
| Test | Vitest |

## Run it

```bash
# API — needs Postgres + Redis
cd apps/api
npm install
npm run dev   # serves on :8080, reads .env.local
```

```bash
# Dashboard
cd apps/web
npm install
npm run dev   # serves on :3000, API_URL in .env
```

## Code layout

```
apps/
  api/                 # Express API
    db/migrations/     # canonical schema (001–005)
    src/
      controllers/     # event.controller: list/create/get-one (project-scoped)
      middleware/      # apiKeyAuth, rateLimiter
      routes/          # event.routes.ts
      types/           # EventRow, DeliveryRow, Event (joined), ApiResponse
      db.ts            # pg Pool
  web/                 # Next.js dashboard
```

## Roadmap

Building toward the full PulseKit platform via independent mini-projects:

- [x] **Mini 1** — Redis sliding-window rate limiter
- [x] **Schema** — canonical Postgres model (events + append-only delivery_logs)
- [x] **Ingestion API** — versioned, API-key auth, project-scoped event CRUD
- [ ] **Mini 2** — Background job queue (BullMQ) + email via Resend
- [ ] **Mini 3** — Retry with exponential backoff + dead-letter queue
- [ ] **Mini 4** — Real-time with WebSocket
- [ ] **Mini 6** — Queue + WebSocket combined
- [ ] **Mini 7** — Multi-channel fan-out (delivery workers reading delivery_logs)
- Then assemble **PulseKit MVP**: one SDK endpoint, email delivery, real-time feed, rate limiting.

## License

MIT © 2026 Abhishek Rajoria
