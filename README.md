# PulseKit

[![npm version](https://img.shields.io/npm/v/pulsekit-sdk?label=pulsekit-sdk)](https://www.npmjs.com/package/pulsekit-sdk)
[![license](https://img.shields.io/github/license/AbhishekRajoria/PulseKit)](https://github.com/AbhishekRajoria/PulseKit/blob/main/LICENSE)

Developer-facing notification and alerting infrastructure — one SDK call, multi-channel delivery with retries, rate limiting, and real-time status.

**[npm](https://www.npmjs.com/package/pulsekit-sdk) · [Dashboard](https://get-pulsekit.vercel.app) · [API](https://pulsekit-api.up.railway.app) · [GitHub](https://github.com/AbhishekRajoria/PulseKit)**

---

## What it is

PulseKit accepts events from your application and fans them out to every channel your project has enabled — email via Resend, Slack via incoming webhook, in-app notification rows — with exponential-backoff retries, per-project rate limiting, and an append-only audit trail of every delivery attempt. A WebSocket feed pushes delivery updates to the dashboard in real time.

You instrument your app with one call. PulseKit handles everything after.

```ts
import { PulseKit } from 'pulsekit-sdk'

const pulse = new PulseKit({ apiKey: 'pk_live_...' })

const receipt = await pulse.notify({
  event:    'payment.failed',
  user:     'user_123',
  data:     { amount: 499, reason: 'card_declined' },
  userName: 'Priya',          // optional — rendered as email greeting
})
// → { eventId: '3f2c...', receivedAt: '2026-09-16T18:00:00.000Z' }
// → null on transient failure (5xx / 429 / network / timeout)
```

---

## How it works

`POST /api/v1/events` ingests the event, enqueues a BullMQ job, and returns `202 Accepted` in the time it takes to write one Postgres row. A background worker process loads the project's `channels` config and fans out to every enabled channel in a single pass — each channel isolated in its own `try/catch` so a Slack failure never causes a duplicate email. Every attempt appends one row to the append-only `delivery_logs` table. After each attempt the worker publishes a delivery update to Redis, which the WebSocket server broadcasts to every connected dashboard client.

---

## Install

```bash
npm install pulsekit-sdk
```

### Quickstart

1. Sign in at [get-pulsekit.vercel.app](https://get-pulsekit.vercel.app), create a project, and copy your API key — it is shown exactly once.
2. Configure at least one delivery channel in your project settings (email, Slack, or in-app).
3. Send your first event:

```ts
import { PulseKit, PulseKitError } from 'pulsekit-sdk'

const pulse = new PulseKit({ apiKey: 'pk_live_...' })

try {
  const receipt = await pulse.notify({
    event: 'user.signup',
    user:  'user_456',
    data:  { plan: 'free' },
  })

  if (!receipt) {
    // Transient failure — PulseKit is down or rate-limited.
    // Queue the event and retry; BullMQ handles delivery-side retries automatically.
  }
} catch (err) {
  if (err instanceof PulseKitError) {
    // 4xx — caller error. Fix the request; do not retry.
    console.error(err.statusCode, err.body)
  }
}
```

---

## SDK reference

### `new PulseKit(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | — | **Required.** Project API key (`pk_live_…`) |
| `baseUrl` | `string` | `https://pulsekit-api.up.railway.app/api/v1` | Override to point at a self-hosted instance |
| `timeout` | `number` | `10_000` | Request timeout in milliseconds |

### `await pulse.notify(input)`

CamelCase input is mapped to the API's snake_case contract before sending.

| Field | Type | Required | Sent as | Notes |
|---|---|---|---|---|
| `event` | `string` | ✅ | `event_name` | |
| `user` | `string` | ✅ | `user_id` | Your application's user identifier — never shown in emails |
| `data` | `object` | — | `payload` | Defaults to `{}` |
| `to` | `string` | — | `to` | Per-event email recipient — overrides the project's configured address. Does not enable a disabled channel. |
| `userName` | `string` | — | `user_name` | Rendered as "Hi {name}," in the email. Transient — never stored. |

**Return value:** `Promise<EventReceipt | null>`

```ts
type EventReceipt = {
  eventId:    string   // server-assigned UUID
  receivedAt: string   // ISO timestamp — when PulseKit accepted the event
}
```

### Error semantics

| Condition | Behaviour |
|---|---|
| `2xx` | Returns `EventReceipt` |
| `4xx` (excluding 429) | **Throws `PulseKitError`** — caller error, fix the request |
| `429`, `5xx`, network failure, timeout | Returns `null` — transient, retry at the caller's discretion |

`PulseKitError` exposes `.statusCode: number` and `.body: unknown`.

The SDK applies a 10-second `AbortController` timeout per request. It ships dual ESM + CJS output with TypeScript declarations.

---

## REST API

### Ingest an event

```
POST /api/v1/events
Authorization: Bearer <api_key>
Content-Type: application/json
```

```json
{
  "event_name": "payment.failed",
  "user_id":    "user_123",
  "payload":    { "amount": 499, "reason": "card_declined" },
  "to":         "priya@example.com",
  "user_name":  "Priya"
}
```

`to` and `user_name` are optional. `payload` defaults to `{}` when omitted.

**curl example**

```bash
curl -X POST https://pulsekit-api.up.railway.app/api/v1/events \
  -H "Authorization: Bearer pk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "payment.failed",
    "user_id":    "user_123",
    "payload":    { "amount": 499, "reason": "card_declined" }
  }'
```

**Response — `202 Accepted`**

```json
{
  "success": true,
  "data": {
    "eventId":    "3f2c1a...",
    "receivedAt": "2026-09-16T18:00:00.000Z"
  }
}
```

**Status codes**

| Code | Meaning |
|---|---|
| `202` | Event accepted and enqueued |
| `400` | Validation error — `event_name` or `user_id` missing or invalid type |
| `401` | Invalid or missing API key |
| `429` | Rate limit exceeded — see `Retry-After: 60` header |
| `500` | Server error |

---

## Rate limiting

Rate limiting is per project, not per IP — enforced by a Redis sliding-window Lua script so the check and increment are atomic.

- Default: **30 requests / minute** per project
- Configurable: 5–30 req/min (set per project in the dashboard)
- Blocked requests return `429` with `Retry-After: 60` and consume **no quota**
- The client owns retry; BullMQ handles delivery-side retries automatically

---

## Error handling

```ts
const receipt = await pulse.notify({ event: 'order.placed', user: 'u1' })

if (!receipt) {
  // PulseKit was unavailable, rate-limited, or timed out.
  // Safe to retry — the event was never ingested.
}
```

```ts
try {
  await pulse.notify({ event: 42, user: 'u1' } as any)
} catch (err) {
  if (err instanceof PulseKitError && err.statusCode === 400) {
    // Type error in the caller — fix the input, do not retry.
  }
}
```

---

## Delivery channels

Channels are configured per project in the dashboard. The worker only delivers to channels that are explicitly enabled.

| Channel | Delivery mechanism | Notes |
|---|---|---|
| **Email** | Resend — branded HTML, humanised payload, optional `user_name` greeting | Requires a verified domain for sends outside the account owner's address |
| **Slack** | Incoming webhook POST | Webhook redirects (e.g. expired URLs) are treated as failures — `redirect: "manual"` prevents false "delivered" logs |
| **In-app** | Row inserted into `notifications` — queryable via `GET /api/v1/notifications/:userId` | Unread count included; mark-as-read and mark-all-read via `PATCH` |

A per-event `to` field overrides the email recipient for that event only. It does not enable the email channel if it is not configured.

Delivery failures on one channel never re-deliver the others. Each channel attempt is logged independently.

---

## Retries and delivery audit

- **Channel-level failures** (Resend rejects, Slack webhook 4xx) — logged once to `delivery_logs` as `failed`, not retried. The job still resolves so other channels are unaffected.
- **Catastrophic failures** (project config unreadable, database unavailable) — the job rejects and BullMQ retries up to five times with exponential backoff and jitter. On exhaustion, the job moves to a dead-letter queue and a sentinel `failed` row closes the audit trail.
- `delivery_logs` is **append-only** — one row per attempt, never updated. Retry history is preserved in full.

Delivery statuses: `pending` · `delivered` · `failed` · `rate_limited`

---

## Real-time feed

The WebSocket server shares the Express HTTP server on the same port — no separate WS port to open.

```
wss://pulsekit-api.up.railway.app
```

The worker publishes a `delivery_update` message to Redis after each attempt. The WS server subscribes via a dedicated Redis client and broadcasts to connected dashboard clients. The dashboard's `LiveFeed` component filters by `projectId` and reconnects automatically with backoff.

Connecting directly from your own frontend is not part of the current API surface — the live feed is a dashboard feature.

---

## Run it yourself

**Prerequisites:** PostgreSQL running with a `pulsedev` user and `pulsedb` database; Redis on `localhost:6379`.

```bash
# Apply migrations (once)
cd apps/api
for f in db/migrations/*.sql; do
  PGPASSWORD=pulse123 psql -U pulsedev -h localhost -d pulsedb -f "$f"
done

# Seed one dev user + project + API key (once)
PGPASSWORD=pulse123 psql -U pulsedev -h localhost -d pulsedb -f db/seed.sql

# Start the API (Express + WebSocket, :8080)
npm install
node --env-file=.env.local src/index.ts

# Start the worker (separate process)
node --env-file=.env.local src/workers/email.worker.ts

# Start the dashboard (:3000)
cd ../web
npm install
npm run dev
```

**`apps/api/.env.local`**

```env
DATABASE_URL=postgres://pulsedev:pulse123@localhost:5432/pulsedb
REDIS_URL=redis://localhost:6379
RESEND_API_KEY=re_...
COOKIE_SECRET=<random-string>
```

**`apps/web/.env`**

```env
API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

### Deploy

Live deployment:
- **API + worker** — [Railway](https://railway.app), two services sharing the same `apps/api` root
- **Dashboard** — [Vercel](https://vercel.com)
- **Database** — [Neon](https://neon.tech) (Postgres 18)
- **Redis** — [Upstash](https://upstash.com) in Redis-compatible (TCP) mode — not the HTTP/serverless mode; BullMQ requires real blocking commands

| Service | Start command |
|---|---|
| `api` | `npm start` (→ `node src/index.ts`, binds to `$PORT`) |
| `worker` | `node src/workers/email.worker.ts` |

**Environment variables**

| Variable | Services | Notes |
|---|---|---|
| `DATABASE_URL` | api, worker | Neon connection string with `sslmode=require` |
| `REDIS_URL` | api, worker | Upstash `rediss://…:6379` |
| `RESEND_API_KEY` | api, worker | |
| `COOKIE_SECRET` | api | Fresh random string per environment |
| `NODE_ENV=production` | api, worker | Disables dev API-key fallback and Bull Board |
| `PORT` | api | Injected by Railway |

**Vercel environment variables (dashboard)**

```env
API_URL=https://pulsekit-api.up.railway.app
NEXT_PUBLIC_WS_URL=wss://pulsekit-api.up.railway.app
```

Apply the six migrations and seed on Neon before the first deploy. The seed creates one user and one project so the dashboard is not empty on first load.

---

## Tests

### API — integration suite

26 tests across 4 suites. Each suite runs against a dedicated `pulsedb_test` database — supertest drives the real Express app through real Postgres and Redis with no test-only code in `src/`. Suites run serially (`fileParallelism: false`); each truncates tables and flushes Redis before running.

| Suite | Tests | Covers |
|---|---|---|
| `auth.integration.test.ts` | 6 | Register, login, cookie session, logout, protected routes, orphan session |
| `project.integration.test.ts` | 13 | CRUD, ownership scoping, duplicate-name handling, auth isolation, channel config (merge/save/disable, email + Slack validation) |
| `event.integration.test.ts` | 5 | Ingest + queue assertion, validation errors, auth isolation |
| `ratelimit.integration.test.ts` | 2 | 30 pass → 429 on 31st, window reset |

The event suite asserts on queue state (`getJobCounts()`) rather than `delivery_logs` rows — queue counts are deterministic whether or not a live worker is consuming the queue.

```bash
# Prerequisites: pulsedb_test exists, migrations 001–006 applied, Postgres + Redis running
cd apps/api
npm test
```

Environment comes from `.env.test`; `vitest.setup.ts` refuses to run against any database not ending in `_test`.

### SDK — contract suite

16 mocked-fetch tests covering the full `notify()` contract: receipt shape, `PulseKitError` on 4xx, `null` on 5xx/429/network/timeout, timeout via `AbortController`, and camelCase → snake_case mapping.

```bash
cd packages/sdk
npm test
```

---

## Repo layout

```
apps/
  api/                        Express API + BullMQ worker
    db/
      migrations/             001–006 — canonical schema
      seed.sql                Dev bootstrap: 1 user + 1 project
    src/
      controllers/            auth, event, notification, project
      middleware/             apiKeyAuth, rateLimiter, authenticate
      routes/                 auth, event, notification, project
      lib/
        queue.ts              BullMQ producer
        redis.ts              Shared ioredis clients (REDIS_URL)
        emailTemplate.ts      Branded HTML renderer (XSS-safe, inline styles)
        websocket.ts          WS server + Redis pub/sub subscriber
      workers/
        email.worker.ts       Fan-out: email / Slack / in-app + audit logging
      types/                  EventRow, DeliveryRow, Project, ApiResponse …
      db.ts                   pg Pool
  web/                        Next.js App Router dashboard
    app/
      (dashboard)/            Route group — sidebar, project views, live feed
        projects/
          [id]/events/        Event list + live feed
          [id]/notifications/ Per-project inbox (user pills, mark-read)
          [id]/channels/      Channel config (email / Slack / in-app toggles)
      api/events/             Proxy routes → Express
      api/notifications/      Proxy routes → Express
      api/projects/           Proxy routes → Express (stats, channels)
      components/
        LiveFeed.tsx           WebSocket client — delivery updates
        EventsDashboard.tsx    Stat cards + live feed + event table
        ProjectTabs.tsx        Overview / Events / Notifications / Channels
        EventsList.tsx
        PayloadBlock.tsx
    lib/format.ts             timeAgo, formatting utilities
packages/
  sdk/                        pulsekit-sdk — standalone publishable package
    src/
      index.ts                PulseKit class: notify(), timeout, error semantics
      index.test.ts           16-test mocked-fetch contract suite
```

---

## License

MIT © 2026 Abhishek Rajoria