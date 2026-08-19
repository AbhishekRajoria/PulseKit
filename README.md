# PulseKit

Developer-facing notification and alerting infrastructure. Instrument your app with a tiny SDK, define rules in a dashboard, and PulseKit handles multi-channel delivery (email, Slack, webhook, in-app) with retries, rate limiting, deduplication, and real-time status.

> 🚧 **Work in progress.** Currently in the mini-project phase: each core concept is built independently first, then assembled into PulseKit. This repo currently contains **Mini-Project 1 — a Redis sliding-window rate limiter**.

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

## Current Status — Mini-Project 1: Rate Limiter

A sliding-window rate limiter backed by Redis, protecting an Express endpoint.

### How it works

Redis sorted set keyed by client IP (`ratelimit:<ip>`). Each request is a member scored by the current timestamp in milliseconds:

```
ZADD            ratelimit:<ip>  <now>  <now>-<random>
ZREMRANGEBYSCORE ratelimit:<ip>  -inf   <now - 60000>   # drop entries older than the window
ZCARD           ratelimit:<ip>                          # count remaining = requests in window
EXPIRE          ratelimit:<ip>  60                      # keep the key from persisting forever
```

All four operations run in a single Redis pipeline — atomic and fast. This is a true sliding window (not a fixed bucket): the window moves with each request, so a burst at `t=0` and one at `t=59s` are measured against each other.

### The contract

| Limit | Window |
|---|---|
| 5 requests | 60 seconds |

- Allowed requests → `200 OK`
- Breach → **`429 Too Many Requests`** with a `Retry-After: 60` header
- Redis unreachable → fails open (request passes, logged to console)

### Run it

```bash
npm install

# needs a local Redis on :6379 (e.g. `docker run -d -p 6379:6379 redis`)
npm run dev
```

Then spam the endpoint:

```bash
for i in $(seq 1 6); do curl -s -o /dev/null -w "req $i: %{http_code}\n" http://localhost:3000/; done
```

```
req 1: 200
req 2: 200
req 3: 200
req 4: 200
req 5: 200
req 6: 429
```

### Code layout

```
src/
  index.ts                 # Express app entry
  routes/test.Routes.ts    # GET / route, rate limiter mounted here
  controllers/test.controller.ts
  middleware/rateLimiter.ts  # sliding-window Redis rate limiter
```

## Tech Stack

| Layer | Tech |
|---|---|
| API | Node.js + Express |
| Cache | Redis (ioredis) |
| Language | TypeScript |

## Roadmap

Building toward the full PulseKit platform via independent mini-projects:

- [x] **Mini 1** — Redis sliding-window rate limiter *(this repo)*
- [ ] **Mini 2** — Background job queue (BullMQ) + email via Resend
- [ ] **Mini 3** — Retry with exponential backoff + dead-letter queue
- [ ] **Mini 4** — Real-time with WebSocket
- [ ] **Mini 5** — PostgreSQL relationships
- [ ] **Mini 6** — Queue + WebSocket combined
- [ ] **Mini 7** — Multi-channel fan-out
- Then assemble **PulseKit MVP**: one SDK endpoint, email delivery, real-time feed, rate limiting.

## Concepts Covered

- Sliding window vs fixed bucket rate limiting
- Redis sorted sets (`ZADD`, `ZREMRANGEBYSCORE`, `ZCARD`)
- Redis pipelines for atomicity
- Failing open vs failing closed on infrastructure errors

## License

MIT © 2026 Abhishek Rajoria