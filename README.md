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

## Current Status — Async Email Delivery + Real-Time Live Feed

The core schema, ingestion API, **async email delivery path**, and **real-time live feed are in place**: `POST /api/v1/events` enqueues a BullMQ job, a separate worker process sends via Resend, appends a delivery attempt to `delivery_logs`, and **publishes each delivery update to Redis pub/sub**. A WebSocket server shares the Express HTTP server, subscribes to that channel, and broadcasts updates to the dashboard's live feed. Proven end-to-end (Resend test-mode delivered the email; the dashboard shows delivery updates streaming in real time).

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

### Async email delivery (BullMQ + Resend)

- **Producer** — `createEvent` enqueues a job onto the `email` queue (`src/lib/queue.ts`) with `event_id`/`project_id`/`user_id`/`event_name`/`payload`/`to`, then returns `202 Accepted` (delivery is deferred to a background worker).
- **Consumer** — a **separate** worker process (`src/workers/email.worker.ts`, `npm run worker`) blocks on Redis, sends via Resend (`onboarding@resend.dev` test-mode sender), and appends a `delivery_logs` row.
- **Fail-closed** — the worker throws on any failure (Resend error or DB insert), so BullMQ marks the job failed and retries; an event is never accepted-but-silently-dropped. The delivery log is the source of truth for "delivered".
- **Retry with exponential backoff + jitter** — the enqueued job is configured with `attempts: 5` and an exponential backoff starting at 2s (±20% per-job jitter to spread the thundering herd). BullMQ drives all retries; the worker's processor throws on failure and the retry engine handles re-delivery.
- **Dead-letter queue** — a `failed` event listener on the worker detects exhaustion (`attemptsMade >= opts.attempts`), quarantines the job data into a separate `email-dlq` queue (`src/workers/email.worker.ts`), and appends a sentinel `delivery_logs` row (`status='failed'`, `attempt_number = attemptsMade + 1`) so an exhausted event's audit trail closes out honestly (5 real failed attempts 1–5 + the attempt-6 sentinel).
- **Bull Board (dev only)** — a queue dashboard mounted at `/admin/queues`, gated behind `NODE_ENV !== 'production'` so it's never deployed. Visualizes waiting/active/delayed/failed jobs and allows manual inspection + retry — a teaching/demo tool, not shipped.
- **BullMQ + ioredis gotcha** — the worker's Redis connection must set `maxRetriesPerRequest: null` (BullMQ blocking commands reject ioredis's default retry cap).
- **Resend test mode** — without a verified domain, Resend only allows sending to the account owner's own address; real multi-recipient sends require a verified domain (deploy step).
- **Real-time live feed** — after each delivery attempt the worker `PUBLISH`es a `delivery_update` to the Redis `delivery_updates` channel. The API (`src/lib/websocket.ts`) runs a `WebSocketServer` on the **same HTTP server as Express** (one port, HTTP + WS), subscribes via a dedicated Redis subscriber client, and broadcasts to connected dashboard clients. The dashboard's `LiveFeed` client component opens a browser `WebSocket`, filters by `projectId`, prepends updates, and reconnects with backoff.

### Dashboard (Next.js)

App Router dashboard under `apps/web`. Server components fetch the Express API directly (`/api/v1/events...` with a Bearer API key — server-side `fetch` needs absolute URLs; relative `/api` paths are client-only). The list page shows each event's latest delivery attempt (status/channel) with a delivery count; the detail page renders the full nested `logs` table (channel, status, attempt, error, delivered time). FE types mirror the API's snake_case + nested `logs` shape.

## Tech Stack

| Layer | Tech |
|---|---|
| API | Node.js + Express + TypeScript |
| API auth | Bearer API-key middleware, project-scoped |
| Database | PostgreSQL 18 (`gen_random_uuid()` built in) |
| Cache / rate limit | Redis (ioredis) + Lua script |
| Queue | BullMQ + Redis |
| Email | Resend (test mode for dev) |
| Real-time | WebSocket (`ws`) + Redis pub/sub |
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
# Background email worker — separate process, reads the same .env.local
cd apps/api
npm run worker
```

```bash
# Dashboard — needs .env with API_URL, API_KEY, and NEXT_PUBLIC_WS_URL (ws://localhost:8080)
cd apps/web
npm install
npm run dev   # serves on :3000
```

## Code layout

```
apps/
  api/                 # Express API + BullMQ email worker
    db/migrations/     # canonical schema (001–005)
    src/
      controllers/     # event.controller: list/create/get-one (project-scoped)
      middleware/      # apiKeyAuth, rateLimiter
      routes/          # event.routes.ts
      lib/queue.ts     # BullMQ producer (email queue)
      lib/redis.ts     # shared ioredis clients (general + subscriber)
      lib/websocket.ts # WebSocket server (Redis pub/sub → WS broadcast)
      workers/         # email.worker.ts: async email delivery + pub/sub publish
      types/           # EventRow, DeliveryRow, Event (joined), ApiResponse
      db.ts            # pg Pool
  web/                 # Next.js dashboard
    app/
      components/
        LiveFeed.tsx   # live delivery feed (client WebSocket)
```

## Roadmap

Building toward the full PulseKit platform via independent mini-projects:

- [x] **Mini 1** — Redis sliding-window rate limiter
- [x] **Schema** — canonical Postgres model (events + append-only delivery_logs)
- [x] **Ingestion API** — versioned, API-key auth, project-scoped event CRUD
- [x] **Mini 2** — Background job queue (BullMQ) + email via Resend, proven end-to-end
- [x] **Mini 3** — Retry with exponential backoff + dead-letter queue + Bull Board
- [x] **Mini 4** — Real-time with WebSocket
- [x] **Mini 6** — Queue + WebSocket combined
- [ ] **Mini 7** — Multi-channel fan-out (delivery workers reading delivery_logs)
- Then assemble **PulseKit MVP**: one SDK endpoint, email delivery, real-time feed, rate limiting.

## License

MIT © 2026 Abhishek Rajoria
