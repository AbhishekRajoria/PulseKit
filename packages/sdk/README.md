# PulseKit SDK

[![npm version](https://img.shields.io/npm/v/pulsekit-sdk?label=pulsekit-sdk)](https://www.npmjs.com/package/pulsekit-sdk)

One function call. PulseKit handles the delivery.

`pulsekit-sdk` is the official TypeScript client for the [PulseKit](https://github.com/AbhishekRajoria/PulseKit) notification API — multi-channel delivery (email, Slack, in-app), retries, rate limiting, and real-time delivery status behind a single `notify()` call.

**[npm](https://www.npmjs.com/package/pulsekit-sdk) · [Dashboard](https://get-pulsekit.vercel.app) · [Docs](https://get-pulsekit.vercel.app/docs) · [GitHub](https://github.com/AbhishekRajoria/PulseKit)**

## Install

```bash
npm install pulsekit-sdk
```

## Usage

```js
import { PulseKit, PulseKitError } from "pulsekit-sdk";

const pulse = new PulseKit({ apiKey: "pk_live_..." });

const receipt = await pulse.notify({
  event: "payment.failed",
  user: "user_123",
  data: { amount: 499, reason: "card_declined" },
});
```

On success, `notify` returns a receipt:

```js
{
  eventId: "3f2c...",     // the server-assigned event UUID
  receivedAt: "2026-09-16T18:00:00.000Z",  // when PulseKit accepted it
}
```

## API

### `new PulseKit(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | — | **Required.** Your project's API key |
| `baseUrl` | `string` | `https://pulsekit-api.up.railway.app/api/v1` | Override the API base URL |
| `timeout` | `number` | `10_000` | Request timeout in ms |

### `await pulse.notify(input)`

| Field | Type | Required | Sent as |
|---|---|---|---|
| `event` | `string` | ✅ | `event_name` |
| `user` | `string` | ✅ | `user_id` |
| `data` | `object` | — | `payload` (defaults to `{}`) |
| `to` | `string` | — | `to` — per-event email recipient override |
| `userName` | `string` | — | `user_name` — friendly name for the email greeting |

Returns `Promise<EventReceipt | null>`:

- **On success** — `{ eventId, receivedAt }`
- **On 5xx, 429, network failure, or timeout** — `null` (transient failures are retried by the caller)
- **On 4xx (API misuse)** — throws `PulseKitError`, with `.statusCode` and `.body` for inspection

## Error semantics

PulseKit is quiet when failures are transient and loud when they're your fault:

| Response | Behaviour |
|---|---|
| `2xx` | returns `EventReceipt` |
| `400`, `401`, `403`, `404`… (4xx, not 429) | **throws** `PulseKitError` |
| `429` rate-limited, `5xx`, network failure, timeout | returns `null` |

```js
try {
  const receipt = await pulse.notify({ event: "order.placed", user: "u1" });
  if (!receipt) {
    // PulseKit was down or rate-limited us — queue it and retry.
  }
} catch (err) {
  if (err instanceof PulseKitError && err.statusCode === 400) {
    // We sent a bad event — fix the caller, don't retry.
  }
}
```

## Publishing

```bash
npm run build # tsup → ESM + CJS + type declarations in dist/
npm test      # vitest — mocked-fetch contract suite
npm pack      # inspect the publish tarball
```

## Notes

- **Rate limits** — projects accept 5–30 events/min (default 30). Breaching it returns HTTP `429` with a `Retry-After: 60` header, which `notify()` surfaces as `null` — back off and retry.
- **API keys** — a project key is shown exactly once at creation. It authenticates every call as `Authorization: Bearer <key>`.
- **Version** — `0.1.0`. The wire contract is `POST /api/v1/events` → `202 Accepted` with `{ eventId, receivedAt }`.