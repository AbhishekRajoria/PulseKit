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

## Current Status — In-App Notifications + Dashboard

The core schema, ingestion API, **multi-channel async delivery path**, **real-time live feed**, and **in-app notification consumption** are in place: `POST /api/v1/events` enqueues a BullMQ job, a separate worker process fans out to the project's **enabled channels** (email via Resend, in-app via the `notifications` table, Slack via incoming webhook), appends a delivery attempt to `delivery_logs` per channel, and **publishes each delivery update to Redis pub/sub**. A WebSocket server shares the Express HTTP server, subscribes to that channel, and broadcasts updates to the dashboard's live feed. The in-app channel writes notification rows that are now consumed by `GET /v1/notifications/:userId` (returns notifications + unread count), `PATCH /v1/notifications/:id/read` (marks as read), and `PATCH /v1/notifications/read-all` (marks all as read for a user). The dashboard wire-up includes a full notifications page with user selector, expand-to-read, mark-as-read, and mark-all-read — all connected to the Express API.

### Database schema (PostgreSQL)

Five tables plus a `channels` JSONB column on `projects`, ordered by foreign-key dependency:

| Migration | Table | Purpose |
|---|---|---|
| `001_create_users.sql` | `users` | PulseKit account owners |
| `002_create_projects.sql` | `projects` | A user's app(s), each with an `api_key` + `rate_limit_per_min` + `channels` config |
| `003_create_events.sql` | `events` | Ingested events (`event_name`, `user_id`, `payload`) |
| `004_create_delivery_logs.sql` | `delivery_logs` | **Append-only** — one row per delivery attempt, never updated |
| `005_create_notifications.sql` | `notifications` | User-facing notification records |
| `006_add_channels_to_projects.sql` | `projects` | Adds `channels` JSONB (`{"email": {...}, "inapp": {}, ...}`) |

Key design decisions:

- **`events` has no `status` or `channel`** — those live on `delivery_logs`. An `Event` returned by the API is a **joined view** of `events` + latest `delivery_logs` row.
- **`delivery_logs` is append-only** — every attempt is a new row (retry history, no destructive updates).
- **Canonical channels:** `email | slack | webhook | inapp`
- **Canonical statuses:** `pending | delivered | failed | rate_limited | deduplicated`
- **Channels are configured per project** (`channels` JSONB on `projects`) — which channels an event fans out to is the developer's config, not the sender's choice.

### Ingestion API (Express)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/events` | API key | List project's events (joined view) |
| `POST` | `/api/v1/events` | API key | Ingest an event |
| `GET` | `/api/v1/events/:id` | API key | Fetch one event with its delivery logs |
| `GET` | `/api/v1/notifications/:userId` | API key | Fetch in-app notifications + unread count |
| `PATCH` | `/api/v1/notifications/read-all` | API key | Mark all notifications as read for a user |
| `PATCH` | `/api/v1/notifications/:id/read` | API key | Mark a notification as read |
| `GET` | `/health` | None | Liveness/readiness probe — pings Postgres (`SELECT 1`), 200 if reachable, 503 otherwise |

- **Versioned routes** — `/api/v1/...` so future breaking changes add v2 without breaking deployed SDKs.
- **API-key auth middleware** (`apiKeyAuth`) — reads `Authorization: Bearer <api_key>`, resolves the `project_id` from the `projects` table, and attaches it to the request. All queries are scoped to that project.
- **Rate limiting** — the ingest route (`POST /events`) is limited per **project** (not per IP) by a Redis sliding-window limiter. The `apiKeyAuth` middleware resolves the project's `rate_limit_per_min` from the `projects` table and attaches it to the request; the limiter keys on `ratelimit:project:<project_id>`. Exceeding the quota returns `429` with a `Retry-After: 60` header, and **blocked requests consume no quota** (Lua script does the check-then-add atomically). The client owns retry. `rate_limited` as a delivery status belongs to the *delivery* side (provider throttling on send), not ingest.
- **`GET /events` uses a LEFT JOIN** so events with no `delivery_logs` row yet (still `pending`) are visible with `status: null`.
- **`GET /events/:id` aggregates** each event's `delivery_logs` into a nested `logs` array via `json_agg` (COALESCE + `FILTER (WHERE d.id IS NOT NULL)` so an event with no logs returns `[]`, not null).
- **Dev mode** — if no `api_key` is sent (e.g. the browser dashboard) and `NODE_ENV !== 'production'`, the middleware falls back to a hardcoded dev key.

### Async multi-channel delivery (BullMQ + Resend + Slack + in-app)

- **Producer** — `createEvent` enqueues a job onto the `email` queue (`src/lib/queue.ts`) with `event_id`/`project_id`/`user_id`/`event_name`/`payload`/`to`, then returns `202 Accepted` (delivery is deferred to a background worker).
- **Fan-out** — the worker loads the project's `channels` JSONB config and delivers to every enabled channel in one pass. **One queue, one worker, internal fan-out** (channel routing is a concern of the worker, not transport). A `channels` config example: `{"email": {"to": "dev@example.com"}, "inapp": {}, "slack": {"webhook_url": "https://hooks.slack.com/services/..."}}`.
- **Channel implementations** — email via Resend; in-app by inserting a row into `notifications`; **Slack via an incoming-webhook POST** (`fetch` with `redirect: "manual"` so a bad/expired webhook URL redirecting to slack.com is treated as a failure, not a silent "delivered").
- **Per-channel isolation** — each channel runs in its own `try/catch`. A failing channel writes its own `failed` `delivery_logs` row and publishes a `failed` update, but **the job still resolves** so a failure in one channel never re-delivers the others (no duplicate emails). Channel failures are logged once (`attempt_number: 1`) and are not retried — that's the per-channel audit trail.
- **Catastrophic failures only retry** — a throw *outside* the channel branches (e.g. project config read / DB down) rejects the job, so BullMQ's `attempts: 5` + exponential backoff + jitter still apply — but only when **no channel could be attempted**.
- **Dead-letter queue** — the `failed` listener now fires only for catastrophic failures: on exhaustion (`attemptsMade >= opts.attempts`) it quarantines the job data into a separate `email-dlq` queue and appends a sentinel `delivery_logs` row (`status='failed'`, `attempt_number = attemptsMade + 1`) so the audit trail closes out honestly.
- **Resend test mode** — without a verified domain, Resend only allows sending to the account owner's own address; real multi-recipient sends require a verified domain (deploy step).
- **Real-time live feed** — after each delivery attempt the worker `PUBLISH`es a `delivery_update` to the Redis `delivery_updates` channel. The API (`src/lib/websocket.ts`) runs a `WebSocketServer` on the **same HTTP server as Express** (one port, HTTP + WS), subscribes via a dedicated Redis subscriber client, and broadcasts to connected dashboard clients. The dashboard's `LiveFeed` client component opens a browser `WebSocket`, filters by `projectId`, prepends updates, and reconnects with backoff.

### Dashboard (Next.js)

App Router dashboard under `apps/web` with a `(dashboard)` route group. Server components fetch the Express API directly (`/api/v1/events...` with a Bearer API key — server-side `fetch` needs absolute URLs; relative `/api` paths are client-only). The events list page shows each event's latest delivery attempt (status/channel) with a delivery count; the detail page renders the full nested `logs` table (channel, status, attempt, error, delivered time). The **notifications page** (client component) fetches `GET /v1/notifications/:userId`, displays an inbox-style list with expand-to-read, mark-as-read, and mark-all-read. Client API routes (`/api/notifications/[id]/route.ts`, `/api/notifications/[id]/read/route.ts`, and `/api/notifications/read-all/route.ts`) proxy to Express. FE types mirror the API's snake_case + nested `logs` shape. The events list page is `force-dynamic` so `next build` skips prerendering the server-side fetch (build succeeds even when the API isn't running, and the page always serves fresh data).

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
  api/                 # Express API + BullMQ multi-channel worker
    db/migrations/     # canonical schema (001–006)
    src/
      controllers/     # event.controller, notification.controller
      middleware/      # apiKeyAuth, rateLimiter
      routes/          # event.routes.ts, notification.routes.ts
      lib/queue.ts     # BullMQ producer (email queue)
      lib/redis.ts     # shared ioredis clients (general + subscriber)
      lib/websocket.ts # WebSocket server (Redis pub/sub → WS broadcast)
      workers/         # email.worker.ts: multi-channel fan-out (email/Slack/in-app) + per-channel isolation + pub/sub publish
      types/           # EventRow, DeliveryRow, Event (joined), ApiResponse
      db.ts            # pg Pool
  web/                 # Next.js dashboard
    app/
      (dashboard)/     # route group — shared layout + sidebar
        components/
          Sidebar.tsx  # collapsible nav (icon-only desktop, overlay mobile)
        events/        # list + detail pages
        notifications/ # inbox page (client component)
      api/notifications/  # proxy routes to Express
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
- [x] **Mini 7** — Multi-channel fan-out (single queue, per-channel isolation: email + in-app + Slack live; webhook pending)
- [x] **Mini 8** — In-app notification consumption (GET notifications + unread count, PATCH mark-as-read, dashboard inbox UI)
- Then assemble **PulseKit MVP**: one SDK endpoint, email delivery, real-time feed, rate limiting.

## License

MIT © 2026 Abhishek Rajoria
