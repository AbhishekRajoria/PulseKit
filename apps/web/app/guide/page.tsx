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
  title: 'Architecture',
  description:
    'How PulseKit works — the path of one event through the API, queue, workers, audit log, and real-time feed.',
}

const toc = [
  { href: '#overview', label: 'Overview' },
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

export default async function GuidePage() {
  const authed = await isAuthenticated()
  return (
    <main id="main-content" className="min-h-screen bg-canvas text-ink">
      <MarketingHeader authed={authed} />
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

            <DocSection id="pipeline" index="02" title="Emit · Route · Observe">
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
                Every attempt appends one row to the append-only delivery_logs
                table. After each attempt the worker publishes a delivery_update
                to Redis, which the WebSocket server broadcasts to connected
                dashboard clients.
              </DocP>
            </DocSection>

            <DocSection id="components" index="03" title="Components">
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

            <DocSection id="repo" index="04" title="Repo layout">
              <Code filename="tree">{`apps/
  api/                        Express API + BullMQ worker
    db/migrations/           001–006 — canonical schema
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

            <DocSection id="self-host" index="05" title="Run it yourself">
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

            <DocSection id="deploy" index="06" title="Deployment">
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
                Apply the six migrations and seed on Neon before first deploy.
              </DocP>
            </DocSection>

            <DocSection id="tests" index="07" title="Tests">
              <DocTable
                head={['Suite', 'Count', 'Covers']}
                rows={[
                  ['auth.integration', '6', 'Register, login, cookie session, logout, protected routes'],
                  ['project.integration', '5', 'CRUD, ownership scoping, duplicate names, auth isolation'],
                  ['event.integration', '5', 'Ingest + queue assertion, validation, auth isolation'],
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