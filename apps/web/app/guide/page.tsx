import { Code, Status } from '@/app/components/Primitives'
import type { Metadata } from 'next'
import {
  Activity,
  Cog,
  Database,
  FileCheck,
  Layers,
  Mail,
  Radio,
  Terminal,
} from 'lucide-react'
import { MarketingHeader } from '@/app/components/Marketing'
import {
  AnchorNav,
  DocP,
  DocSection,
  DocTable,
  PageFooter,
  PageHeader,
} from '@/app/components/Docs'

export const metadata: Metadata = {
  title: 'Architecture',
  description:
    'How PulseKit works — the path of one event through the API, queue, workers, audit log, and real-time feed.',
}

const toc = [
  { href: '#overview', label: 'Overview' },
  { href: '#event-path', label: 'Event path' },
  { href: '#pipeline', label: 'Emit · Route · Observe' },
  { href: '#components', label: 'Components' },
  { href: '#repo', label: 'Repo layout' },
  { href: '#self-host', label: 'Run it yourself' },
  { href: '#deploy', label: 'Deployment' },
  { href: '#tests', label: 'Tests' },
]

const envApiCode = `# apps/api/.env.local
DATABASE_URL=postgres://pulsedev:pulse123@localhost:5432/pulsedb
REDIS_URL=redis://localhost:6379
RESEND_API_KEY=re_...
COOKIE_SECRET=<random-string>`

const envWebCode = `# apps/web/.env
API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080`

const startApiCode = `cd apps/api
npm install
node --env-file=.env.local src/index.ts            # Express + WebSocket, :8080

# worker (separate process)
node --env-file=.env.local src/workers/email.worker.ts`

const sdkSnippetCode = `import { PulseKit } from 'pulsekit-sdk'

const pulse = new PulseKit({ apiKey: 'pk_test_...' })

const receipt = await pulse.notify({
  event: 'payment.failed',
  user: 'user_123',
  data: { amount: 499, reason: 'card_declined' },
})
// → { eventId: '...', receivedAt: '...' } — or null on transient failure`

const eventPathHops: {
  icon: typeof Terminal
  title: string
  label: string
  detail: React.ReactNode
  code?: { filename: string; body: string }
}[] = [
  {
    icon: Terminal,
    title: 'SDK request',
    label: 'POST /api/v1/events',
    detail: (
      <>
        One authenticated call enters the pipeline. The SDK returns a receipt —{' '}
        <Mono>{'{ eventId, receivedAt }'}</Mono> — or <Mono>null</Mono> on
        transient failure, never a throw.
      </>
    ),
    code: { filename: 'TypeScript', body: sdkSnippetCode },
  },
  {
    icon: Database,
    title: 'API persists',
    label: 'events',
    detail: (
      <>
        API writes one immutable row to the <Mono>events</Mono> table — the
        record is append-only and never updated.
      </>
    ),
  },
  {
    icon: Layers,
    title: 'API enqueues',
    label: 'BullMQ',
    detail: (
      <>
        API enqueues a BullMQ job in Redis and returns <Mono>202 Accepted</Mono>{' '}
        immediately, so delivery is fully asynchronous.
      </>
    ),
  },
  {
    icon: Cog,
    title: 'Worker claims',
    label: 'channels',
    detail: (
      <>
        The worker claims the job and loads the project&apos;s{' '}
        <Mono>channels</Mono> config (<Mono>email</Mono>, <Mono>slack</Mono>,{' '}
        <Mono>inapp</Mono>).
      </>
    ),
  },
  {
    icon: Mail,
    title: 'Resend sends',
    label: 'Resend',
    detail: (
      <>
        The worker dispatches via Resend — branded HTML email with humanised
        payload details.
      </>
    ),
  },
  {
    icon: FileCheck,
    title: 'Attempt recorded',
    label: 'delivery_logs',
    detail: (
      <>
        Failures and give-ups are logged to <Mono>delivery_logs</Mono> —
        append-only, never overwritten.
        <span className="mt-3 flex flex-wrap gap-x-5 gap-y-2 [&>span]:text-sm">
          <Status status="delivered" />
          <Status status="failed" />
          <Status status="pending" />
        </span>
      </>
    ),
  },
  {
    icon: Radio,
    title: 'Redis publishes',
    label: 'delivery_updates',
    detail: (
      <>
        The worker publishes to the Redis pub/sub channel{' '}
        <Mono>delivery_updates</Mono>.
      </>
    ),
  },
  {
    icon: Activity,
    title: 'Dashboard updates',
    label: 'WebSocket',
    detail: (
      <>
        The WebSocket server broadcasts to connected dashboard clients — the
        live feed updates with no refresh.
      </>
    ),
  },
]

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[13px] text-ink">{children}</span>
  )
}

function EventPathStep({
  hop,
  index,
}: {
  hop: (typeof eventPathHops)[number]
  index: number
}) {
  const Icon = hop.icon
  return (
    <div className="text-center">
      <span className="relative mx-auto grid h-12 w-12 place-items-center rounded-full border border-border bg-card text-ink-2">
        <Icon size={18} strokeWidth={1.75} />
        <span
          className="event-path-fill absolute inset-0 grid place-items-center rounded-full border border-copper bg-copper text-white opacity-0"
          style={{ animationDelay: `${index * 1 - 7.5}s` }}
        >
          <Icon size={18} strokeWidth={1.75} />
        </span>
      </span>
      <p className="mt-3 text-xs font-semibold leading-4">{hop.title}</p>
      <p className="mt-1 break-all font-mono text-[10px] leading-4 text-ink-3">
        {hop.label}
      </p>
    </div>
  )
}

function EventPathConnector({ index }: { index: number }) {
  return (
    <div className="pt-6" aria-hidden="true">
      <span className="relative block h-0.5 bg-border">
        <span
          className="event-path-fill absolute inset-0 bg-copper opacity-0"
          style={{ animationDelay: `${index * 1 + 0.5 - 7.5}s` }}
        />
      </span>
    </div>
  )
}

function EventPath() {
  return (
    <div>
      {/* Stepper — node → segment → node wave on desktop, stacked rail on mobile */}
      <div className="relative hidden lg:block" aria-hidden="true">
        <div className="grid grid-cols-[1fr_repeat(7,2rem_1fr)] items-start">
          {eventPathHops.map((hop, index) => (
            <span key={hop.title} className="contents">
              {index > 0 && <EventPathConnector index={index - 1} />}
              <EventPathStep hop={hop} index={index} />
            </span>
          ))}
        </div>
      </div>
      <div className="relative lg:hidden" aria-hidden="true">
        <div className="space-y-0">
          {eventPathHops.map((hop, index) => (
            <div key={hop.title}>
              <div className="grid grid-cols-[3rem_1fr] items-center gap-x-4">
                <span className="relative grid h-12 w-12 place-items-center rounded-full border border-border bg-card text-ink-2">
                  <hop.icon size={18} strokeWidth={1.75} />
                  <span
                    className="event-path-fill absolute inset-0 grid place-items-center rounded-full border border-copper bg-copper text-white opacity-0"
                    style={{ animationDelay: `${index * 1 - 7.5}s` }}
                  >
                    <hop.icon size={18} strokeWidth={1.75} />
                  </span>
                </span>
                <div>
                  <p className="text-xs font-semibold leading-4">{hop.title}</p>
                  <p className="mt-0.5 font-mono text-[10px] leading-4 text-ink-3">
                    {hop.label}
                  </p>
                </div>
              </div>
              {index < eventPathHops.length - 1 && (
                <div className="grid grid-cols-[3rem_1fr] gap-x-4" aria-hidden="true">
                  <span className="relative mx-auto h-6 w-0.5 bg-border">
                    <span
                      className="event-path-fill absolute inset-0 bg-copper opacity-0"
                      style={{ animationDelay: `${index * 1 + 0.5 - 7.5}s` }}
                    />
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detail rows */}
      <ol className="mt-10 divide-y divide-border border-y border-border">
        {eventPathHops.map((hop, index) => (
          <li
            key={hop.title}
            className="grid gap-1 py-4 sm:grid-cols-[2.5rem_9rem_1fr] sm:gap-4"
          >
            <span className="font-mono text-xs tabular-nums text-ink-3">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-sm font-semibold">{hop.title}</span>
            <span className="text-sm leading-6 text-ink-2">
              {hop.detail}
              {hop.code && (
                <span className="mt-3 block max-w-2xl">
                  <Code filename={hop.code.filename}>{hop.code.body}</Code>
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default async function GuidePage() {
  return (
    <main id="main-content" className="min-h-screen bg-canvas text-ink">
      <MarketingHeader />
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <PageHeader
          meta="Architecture"
          title="How PulseKit works"
          description="A plain HTTP API in front of a queue and background workers. This guide walks the full path of one event — from the client call to the append-only delivery audit."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[200px_1fr]">
          <AnchorNav items={toc} />

          <div className="max-w-3xl space-y-16">
            <DocSection id="overview" index="01" title="Overview">
              <DocP>
                PulseKit accepts events and fans them out to every channel the
                project has enabled — email via Resend, Slack via incoming
                webhook, in-app notification rows — with exponential-backoff
                retries, per-project rate limiting, and an append-only audit
                trail. A WebSocket feed pushes delivery updates to the dashboard
                in real time.
              </DocP>
              <DocP>
                The event path is deliberately boring:{' '}
                <span className="font-mono text-[13px] text-ink">
                  POST /api/v1/events
                </span>{' '}
                ingests, a BullMQ job is enqueued, and{' '}
                <span className="font-mono text-[13px] text-ink">202 Accepted</span>{' '}
                returns in the time it takes to write one Postgres row. A worker
                process does the fan-out afterwards.
              </DocP>
            </DocSection>

            <DocSection id="event-path" index="02" title="Event path">
              <EventPath />
            </DocSection>

            <DocSection id="pipeline" index="03" title="Emit · Route · Observe">
              <DocP>
                <strong className="font-medium text-ink">01 — Emit.</strong>{' '}
                You call notify once. The event is validated, persisted, and
                acknowledged before any delivery work starts. Rate limiting is
                checked here via an atomic Redis sliding-window Lua script.
              </DocP>
              <DocP>
                <strong className="font-medium text-ink">02 — Route.</strong>{' '}
                The event is enqueued as a BullMQ job. The worker loads the
                project&apos;s channels config and fans out in a single pass —
                each channel isolated in its own try/catch, so a Slack failure
                never causes a duplicate email.
              </DocP>
              <DocP>
                <strong className="font-medium text-ink">03 — Observe.</strong>{' '}
                Failures and give-ups append rows to the append-only delivery_logs
                table. After each attempt the worker publishes a delivery_update
                to Redis, which the WebSocket server broadcasts to connected
                dashboard clients.
              </DocP>
            </DocSection>

            <DocSection id="components" index="04" title="Components">
              <DocTable
                head={['Component', 'Role']}
                rows={[
                  ['Express API', 'Ingest, auth (cookie + API key), project & notification routes'],
                  ['BullMQ queue', 'Delivery jobs with retries and dead-letter queue'],
                  ['Worker', 'Channel fan-out: email / Slack / in-app + audit logging'],
                  ['Postgres', 'Canonical state — events, delivery_logs, notifications, projects'],
                  ['Redis', 'Rate limit counters, queue broker, delivery_update pub/sub'],
                  ['WebSocket', 'Shares the API port; broadcasts delivery updates to the dashboard'],
                ]}
              />
            </DocSection>

            <DocSection id="repo" index="05" title="Repo layout">
              <Code filename="tree">{`apps/
  api/                        Express API + BullMQ worker
    db/migrations/           001–007 — canonical schema
    src/controllers/         auth, event, notification, project
    src/middleware/          apiKeyAuth, rateLimiter, authenticate
    src/lib/                 queue, redis, emailTemplate, websocket
    src/workers/             email.worker.ts — the fan-out
  web/                       Next.js App Router dashboard
    app/(dashboard)/         sidebar, project views, live feed
    app/api/notifications/   proxy routes → Express
packages/
  sdk/                       pulsekit-sdk — publishable package`}</Code>
            </DocSection>

            <DocSection id="self-host" index="06" title="Run it yourself">
              <DocP>
                Prerequisites: PostgreSQL (pulsedev / pulsedb) and Redis on
                localhost. Apply the migrations, seed one dev user + project,
                then start API and worker as separate processes.
              </DocP>
              <Code filename="bash">{startApiCode}</Code>
              <DocP>Environment variables:</DocP>
              <Code filename="env">{envApiCode}</Code>
              <Code filename="env">{envWebCode}</Code>
            </DocSection>

            <DocSection id="deploy" index="07" title="Deployment">
              <DocTable
                head={['Service', 'Platform', 'Notes']}
                rows={[
                  ['API + worker', 'Railway', 'Two services sharing the apps/api root'],
                  ['Dashboard', 'Vercel', 'Next.js App Router'],
                  ['Database', 'Neon', 'Postgres 18, sslmode=require'],
                  ['Redis', 'Upstash', 'Redis-compatible TCP mode — BullMQ needs real blocking commands'],
                ]}
              />
              <DocP>
                Apply the seven migrations and seed on Neon before first deploy.
              </DocP>
            </DocSection>

            <DocSection id="tests" index="08" title="Tests">
              <DocTable
                head={['Suite', 'Count', 'Covers']}
                rows={[
                  ['auth.integration', '7', 'Register, login, cookie session, logout, protected routes'],
                  ['project.integration', '19', 'CRUD, ownership scoping, channel merge, rate-limit validation, auth isolation'],
                  ['event.integration', '6', 'Ingest + queue assertion, validation, auth isolation'],
                  ['notification.integration', '3', 'Inbox, read state, auth isolation'],
                  ['ratelimit.integration', '2', '30 pass → 429 on the 31st, window reset'],
                  ['sdk contract', '16', 'Mocked-fetch notify() covering the full SDK contract'],
                ]}
              />
              <DocP>
                API suites run serially against a dedicated pulsedb_test
                database through real Postgres and Redis; the event suite
                asserts queue state (getJobCounts) rather than delivery rows, so
                results are deterministic with or without a live worker.
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