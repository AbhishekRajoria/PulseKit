import { Code } from '@/app/components/Primitives'
import type { Metadata } from 'next'
import { MarketingHeader } from '@/app/components/Marketing'
import { isAuthenticated } from '@/lib/session'
import {
  AnchorNav,
  DocP,
  DocSection,
  DocTable,
  PageFooter,
  PageHeader,
} from '@/app/components/Docs'

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'PulseKit SDK and REST API reference — install, quickstart, rate limiting, channels, retries, and the real-time feed.',
}

const toc = [
  { href: '#installation', label: 'Installation' },
  { href: '#quickstart', label: 'Quickstart' },
  { href: '#sdk', label: 'SDK reference' },
  { href: '#rest-api', label: 'REST API' },
  { href: '#rate-limiting', label: 'Rate limiting' },
  { href: '#channels', label: 'Channels' },
  { href: '#retries', label: 'Retries & audit' },
  { href: '#realtime', label: 'Real-time feed' },
]

const apiBase = 'https://pulsekit-api.up.railway.app/api/v1'

const installCode = `npm install pulsekit-sdk`

const quickstartCode = `import { PulseKit, PulseKitError } from 'pulsekit-sdk'

const pulse = new PulseKit({ apiKey: 'pk_live_...' })

const receipt = await pulse.notify({
  event:    'payment.failed',
  user:     'user_123',
  data:     { amount: 499, reason: 'card_declined' },
  userName: 'Priya',          // optional — email greeting
})
// → { eventId: '3f2c…', receivedAt: '2026-09-18T18:00:00.000Z' }
// → null on transient failure (5xx / 429 / network / timeout)`

const restCode = `curl -X POST ${apiBase}/events \\
  -H "Authorization: Bearer pk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "event_name": "payment.failed",
    "user_id":    "user_123",
    "payload":    { "amount": 499, "reason": "card_declined" }
  }'`

const responseCode = `// 202 Accepted
{
  "success": true,
  "data": {
    "eventId":    "3f2c1a…",
    "receivedAt": "2026-09-18T18:00:00.000Z"
  }
}`

export default async function DocsPage() {
  const authed = await isAuthenticated()
  return (
    <main id="main-content" className="min-h-screen bg-canvas text-ink">
      <MarketingHeader authed={authed} />
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <PageHeader
          meta="Docs"
          title="PulseKit documentation"
          description="One HTTP call, multi-channel delivery, retries, rate limiting, and a real-time audit trail. Everything below matches the live API and SDK contracts."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[200px_1fr]">
          <AnchorNav items={toc} />

          <div className="max-w-3xl space-y-16">
            <DocSection id="installation" index="01" title="Installation">
              <DocP>
                The SDK talks to the hosted API. A project API key is the only
                credential you need — it is shown exactly once when you create a
                project.
              </DocP>
              <Code filename="bash">{installCode}</Code>
            </DocSection>

            <DocSection id="quickstart" index="02" title="Quickstart">
              <DocP>
                Create a project, copy the API key, then send your first event.
                The call returns a receipt or — on transient failure —{' '}
                <span className="font-mono text-[13px] text-ink">null</span>,
                so your own retry policy is one branch.
              </DocP>
              <Code filename="TypeScript">{quickstartCode}</Code>
              <DocP>
                A 4xx response throws <code className="font-mono text-[13px] text-ink">PulseKitError</code>{' '}
                — the caller made a mistake, fix the request. Anything transient
                (429, 5xx, network, timeout) returns null.
              </DocP>
            </DocSection>

            <DocSection id="sdk" index="03" title="SDK reference">
              <DocP>
                <code className="font-mono text-[13px] text-ink">new PulseKit(options)</code>{' '}
                takes an <code className="font-mono text-[13px] text-ink">apiKey</code>{' '}
                (required), an optional <code className="font-mono text-[13px] text-ink">baseUrl</code>{' '}
                (default the hosted API), and a 10s request <code className="font-mono text-[13px] text-ink">timeout</code>.
              </DocP>
              <DocTable
                head={['Field', 'Type', 'Required', 'Sent as', 'Notes']}
                rows={[
                  ['event', 'string', 'yes', 'event_name', ''],
                  ['user', 'string', 'yes', 'user_id', 'Never shown in emails'],
                  ['data', 'object', '—', 'payload', 'Defaults to {}'],
                  ['to', 'string', '—', 'to', 'Per-event email recipient override'],
                  ['userName', 'string', '—', 'user_name', 'Email greeting, never stored'],
                ]}
              />
            </DocSection>

            <DocSection id="rest-api" index="04" title="REST API">
              <DocP>
                Ingest an event with <code className="font-mono text-[13px] text-ink">POST /api/v1/events</code>,
                authenticating with the project key via a Bearer header.
              </DocP>
              <Code filename="bash">{restCode}</Code>
              <Code filename="response">{responseCode}</Code>
              <DocTable
                head={['Code', 'Meaning']}
                rows={[
                  ['202', 'Event accepted and enqueued'],
                  ['400', 'event_name or user_id missing or invalid type'],
                  ['401', 'Invalid or missing API key'],
                  ['429', 'Rate limit exceeded — Retry-After: 60'],
                  ['500', 'Server error'],
                ]}
              />
            </DocSection>

            <DocSection id="rate-limiting" index="05" title="Rate limiting">
              <DocP>
                Sliding-window rate limiting, enforced per project by an atomic
                Redis Lua script — not per IP.
              </DocP>
              <DocTable
                head={['Setting', 'Value']}
                rows={[
                  ['Default', '30 requests / minute per project'],
                  ['Configurable', '5–30 req/min'],
                  ['When blocked', '429 with Retry-After: 60, consumes no quota'],
                ]}
              />
            </DocSection>

            <DocSection id="channels" index="06" title="Delivery channels">
              <DocP>
                Channels are enabled per project in the dashboard. The worker
                only delivers to channels that are explicitly configured.
              </DocP>
              <DocTable
                head={['Channel', 'Delivery mechanism', 'Notes']}
                rows={[
                  [
                    'Email',
                    'Resend',
                    'Branded HTML, humanised payload, optional userName greeting',
                  ],
                  [
                    'Slack',
                    'Incoming webhook',
                    'Redirects are treated as failures — no false delivered logs',
                  ],
                  [
                    'In-app',
                    'Row inserted into notifications',
                    'Unread count, mark-as-read and mark-all-read via PATCH',
                  ],
                ]}
              />
              <DocP>
                A per-event <code className="font-mono text-[13px] text-ink">to</code>{' '}
                overrides the email recipient for that event only. Failures on
                one channel never re-deliver the others.
              </DocP>
            </DocSection>

            <DocSection id="retries" index="07" title="Retries & audit">
              <DocP>
                Channel-level failures (Resend rejects, Slack 4xx) are logged
                once as failed, never retried. Catastrophic failures retry up to
                five times with exponential backoff and jitter, then move to a
                dead-letter queue with a sentinel failed row.
              </DocP>
              <DocP>
                <code className="font-mono text-[13px] text-ink">delivery_logs</code>{' '}
                is append-only — one row per attempt, never updated. Retry
                history is preserved in full.
              </DocP>
              <DocP>
                Delivery statuses:{' '}
                <span className="font-mono text-[13px] text-ink">
                  pending · delivered · failed · rate_limited
                </span>
              </DocP>
            </DocSection>

            <DocSection id="realtime" index="08" title="Real-time feed">
              <DocP>
                The WebSocket server shares the Express HTTP server on the same
                port{' '}
                <code className="font-mono text-[13px] text-ink">
                  wss://pulsekit-api.up.railway.app
                </code>
                . The worker publishes a delivery_update message to Redis after
                every attempt; the dashboard&apos;s LiveFeed filters by project
                and reconnects with backoff.
              </DocP>
              <DocP>
                Connecting directly from your own frontend is not part of the
                current API surface — the live feed is a dashboard feature.
              </DocP>
            </DocSection>
          </div>
        </div>
      </div>
      <div className="border-t border-border px-5 lg:px-8">
        <div className="mx-auto max-w-7xl py-10">
          <PageFooter />
        </div>
      </div>
    </main>
  )
}