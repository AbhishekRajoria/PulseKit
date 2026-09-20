import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  Bell,
  BookOpen,
  CircleCheckBig,
  Languages,
  Layers2,
  Mail,
  MessagesSquare,
  SquareTerminal,
} from 'lucide-react'
import { Brand, CopyButton, LiveDot, Micro, Mono, Stat } from '@/app/components/Primitives'
import { LandingLiveFeed, LandingTerminal, MarketingHeader } from '@/app/components/Marketing'

export const metadata: Metadata = {
  title: 'PulseKit — Notify your users. One API call.',
  description:
    'One POST sends email, Slack, and in-app notifications. Sliding-window rate limiting, automatic retries, and a live delivery feed.',
  openGraph: {
    type: 'website',
    title: 'PulseKit — Notify your users. One API call.',
    description:
      'One POST sends email, Slack, and in-app notifications. Sliding-window rate limiting, automatic retries, and a live delivery feed.',
  },
}

const channels = [
  {
    icon: Mail,
    name: 'Email',
    sub: 'resend.com',
    description:
      'Rendered from templates, sent via Resend with per-attempt status. No queue juggling on your side.',
  },
  {
    icon: MessagesSquare,
    name: 'Slack',
    sub: 'incoming webhook',
    description:
      'Fan out to channels or users through a plain incoming webhook. Failures surface as retried attempts.',
  },
  {
    icon: Bell,
    name: 'In-app',
    sub: 'realtime feed',
    description:
      'Delivered over WebSocket to a live feed. Read receipts and per-user targeting are built in.',
  },
]

const pipeline = [
  {
    num: '01',
    icon: Languages,
    title: 'Emit',
    body: 'Call notify once. Events are validated, persisted, and acknowledged with 202 before any work happens.',
  },
  {
    num: '02',
    icon: Layers2,
    title: 'Route',
    body: 'The API enqueues channel jobs with a sliding-window rate limit. Slower channels never block faster ones.',
  },
  {
    num: '03',
    icon: CircleCheckBig,
    title: 'Observe',
    body: 'Workers retry with exponential backoff + jitter and write a delivery log. Check status from the dashboard.',
  },
]

const facts = [
  { label: 'Ingest', value: '202', detail: 'accepted, queued, acknowledged' },
  { label: 'Rate limit', value: '30/min', detail: 'sliding window per project' },
  { label: 'Max attempts', value: '5', detail: 'exponential backoff + jitter' },
]

const infoCards = [
  {
    title: 'Explicit failure',
    body: 'Every attempt is recorded against the delivery log. No silent drops — a failed attempt is a visible status.',
  },
  {
    title: 'Boring primitives',
    body: 'One HTTP API, a queue, and workers. No esoteric SDK surface; the only moving part on your side is a POST.',
  },
  {
    title: 'Safe by default',
    body: 'Your secret key is issued once. User IDs and event names arrive as plain strings, and rate limits are on by default.',
  },
]

export default async function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-canvas text-ink">
      <MarketingHeader />

      {/* Hero */}
      <section className="border-b border-border px-5 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-ink-2">
              <LiveDot />
              Developer preview is live
            </div>
            <h1 className="text-5xl font-semibold leading-[1.04] tracking-tight sm:text-7xl">
              Notify your users. <span className="text-ink-3">One API call.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
              One POST sends email, Slack, and in-app notifications. Sliding-window
              rate limiting, automatic retries, and a live delivery feed.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-copper px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-copper-hover"
              >
                Start building
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-card px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-border-strong hover:bg-surface-2 hover:text-ink"
              >
                <BookOpen className="h-4 w-4" />
                Read the docs
              </Link>
            </div>
            <div className="mt-9 flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3">
              <SquareTerminal className="h-4 w-4 shrink-0 text-ink-3" />
              <code className="flex-1 font-mono text-sm text-ink-2">
                npm install pulsekit-sdk
              </code>
              <CopyButton value="npm install pulsekit-sdk" />
            </div>
          </div>

          <LandingTerminal />
        </div>
      </section>

      {/* Channels */}
      <section className="border-b border-border px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
            <div>
              <Micro>One event, every channel</Micro>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Infrastructure, not another workflow builder.
              </h2>
            </div>
            <p className="text-[15px] leading-relaxed text-ink-2 lg:max-w-md lg:justify-self-end">
              You define delivery targets; PulseKit runs the pipeline. Channels
              fan out independently — a slow email never blocks a Slack alert.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {channels.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.name} className="card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2">
                    <Icon className="h-4 w-4 text-ink" />
                  </div>
                  <div className="mt-5 flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{c.name}</span>
                    <Mono className="text-xs">{c.sub}</Mono>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    {c.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="border-b border-border px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Micro>How it works</Micro>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Emit. Route. Observe.
          </h2>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
            {pipeline.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.num} className="bg-card p-8">
                  <div className="flex items-center justify-between">
                    <Micro>{p.num}</Micro>
                    <Icon className="h-4 w-4 text-ink-3" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-2">
                    {p.body}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Spec facts + live feed */}
      <section className="border-b border-border px-5 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <Micro>Proof, not promises</Micro>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              The contract, not the marketing.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-2">
              Response codes, rate limits, and retry semantics are the product.
              Everything below is observable from the real API.
            </p>
            <div className="mt-10 flex flex-col divide-y divide-border rounded-2xl border border-border bg-card sm:flex-row sm:divide-x sm:divide-y-0">
              {facts.map((f) => (
                <Stat
                  key={f.label}
                  label={f.label}
                  value={f.value}
                  detail={f.detail}
                  className="px-6 py-6 sm:border-r sm:py-4 sm:last:border-r-0"
                />
              ))}
            </div>
          </div>

          <LandingLiveFeed />
        </div>
      </section>

      {/* Info cards */}
      <section className="border-b border-border px-5 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {infoCards.map((c) => (
            <div key={c.title} className="card p-6">
              <h3 className="text-sm font-semibold text-ink">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-ink px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Your first event is one request away.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-white/60">
            Create a project, copy a key, and call notify. The rest is a queue
            and a dashboard.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-copper px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-copper-hover"
            >
              Create a project
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <BookOpen className="h-4 w-4" />
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-6 px-5 py-12 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <Brand />
        <p className="text-sm text-ink-3">Built for deliberate engineering.</p>
        <Link
          href="https://github.com/AbhishekRajoria/PulseKit"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ink-3 transition-colors hover:text-ink"
        >
          GitHub
        </Link>
      </footer>
    </main>
  )
}