'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Bell,
  Check,
  GitBranch,
  Mail,
  Menu,
  MessagesSquare,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Brand, LinkPending, LiveDot, Mono, Status } from './Primitives'
import logout from '@/app/actions/logout'

// -----------------------------------------------------------------------
// Shared marketing header (landing, docs, guide)
// -----------------------------------------------------------------------
// Resolves auth client-side so these pages stay statically prerendered —
// server-side cookie reads would force them dynamic on every navigation.

export function MarketingHeader() {
  const [open, setOpen] = useState(false)
  const [authed, setAuthed] = useState(false)
  const pathname = usePathname()
  useEffect(() => {
    // document.cookie is external state unknown at static prerender, so it
    // can't be derived during render — re-check on mount and route changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthed(typeof document !== 'undefined' && document.cookie.includes('userId='))
  }, [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('header')) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])
  const desktopCta = authed ? (
    <Link
      href="/projects"
      prefetch
      className="relative rounded-lg bg-primary-action px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-action-hover"
    >
      Dashboard
      <LinkPending />
    </Link>
  ) : (
    <>
      <Link
        href="/login"
        prefetch
        className="relative rounded-md px-3 py-1.5 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
      >
        Log in
        <LinkPending />
      </Link>
      <Link
        href="/signup"
        prefetch
        className="relative rounded-lg bg-primary-action px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-action-hover"
      >
        Sign up
        <LinkPending />
      </Link>
    </>
  )
  const mobileLinks = authed
    ? ([
        ['Docs', '/docs'],
        ['Architecture', '/guide'],
        ['Dashboard', '/projects'],
      ] as const)
    : ([
        ['Docs', '/docs'],
        ['Architecture', '/guide'],
        ['Log in', '/login'],
        ['Sign up', '/signup'],
      ] as const)
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <Brand />
          <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-3">
            v0.1.0
          </span>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          <a
            href="https://github.com/AbhishekRajoria/PulseKit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <GitBranch className="h-4 w-4" />
            GitHub
          </a>
          <Link
            href="/docs"
            prefetch
            className="relative rounded-md px-3 py-1.5 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Docs
            <LinkPending />
          </Link>
          <Link
            href="/guide"
            prefetch
            className="relative rounded-md px-3 py-1.5 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Architecture
            <LinkPending />
          </Link>
          {desktopCta}
        </nav>
        <button
          type="button"
          className="cursor-pointer rounded-md p-1.5 text-ink-2 transition-colors hover:bg-surface-2 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" className="grid gap-1 border-t border-border p-3 md:hidden">
          {mobileLinks.map(([label, to]) => (
            <Link
              key={to}
              href={to}
              prefetch
              onClick={() => setOpen(false)}
              className="relative rounded-md px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-surface-2"
            >
              {label}
              <LinkPending />
            </Link>
          ))}
          {authed && (
            <form action={logout}>
              <button
                type="submit"
                className="w-full rounded-md px-3 py-2 text-left text-sm text-ink-2 transition-colors hover:bg-surface-2"
              >
                Log out
              </button>
            </form>
          )}
        </nav>
      )}
    </header>
  )
}

// -----------------------------------------------------------------------
// Hero terminal — tabbed Request / Fan-out
// -----------------------------------------------------------------------

const sdkSample = `await pulse.notify({
  event: "invoice.paid",
  user: "usr_4f91",
  data: { amount: 2400, currency: "USD" }
});
// 202 accepted
// { eventId: "1f9c2a…", receivedAt: "2026-09-18T14:32:08Z" }`

const fanoutSamples: Array<[LucideIcon, string, string]> = [
  [Mail, 'Email · Resend', '1.4s'],
  [MessagesSquare, 'Slack · webhook', '0.9s'],
  [Bell, 'In-app · WebSocket', '0.2s'],
]

export function LandingTerminal() {
  const [tab, setTab] = useState<'code' | 'result'>('code')
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-code-surface shadow-panel">
      <div className="flex items-center justify-between border-b border-code-line px-3 py-2">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab('code')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === 'code'
                ? 'bg-surface-2 text-ink'
                : 'text-code-muted hover:text-code-foreground'
            }`}
          >
            Request
          </button>
          <button
            type="button"
            onClick={() => setTab('result')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === 'result'
                ? 'bg-surface-2 text-ink'
                : 'text-code-muted hover:text-code-foreground'
            }`}
          >
            Fan-out
          </button>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-code-muted">
          TypeScript
        </span>
      </div>
      {tab === 'code' ? (
        <pre className="min-h-80 overflow-auto p-6 font-mono text-[13px] leading-7 text-code-foreground">
          <code>{sdkSample}</code>
        </pre>
      ) : (
        <div className="min-h-80 space-y-3 p-6">
          {fanoutSamples.map(([Icon, name, t]) => (
            <div
              className="flex items-center gap-3 rounded-xl border border-code-line bg-code-surface p-4"
              key={name}
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-code-line text-code-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-sm text-code-foreground">{name}</div>
                <div className="font-mono text-[10px] text-code-muted">
                  attempt 1
                </div>
              </div>
              <Status status="delivered" />
              <span className="font-mono text-xs tabular-nums text-code-muted">
                {t}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------
// Live delivery feed — rotating demo rows
// -----------------------------------------------------------------------

const feedEvents = [
  'user.invited',
  'invoice.paid',
  'report.ready',
  'security.alert',
]

export function LandingLiveFeed() {
  const [cursor, setCursor] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setCursor((x) => (x + 1) % feedEvents.length), 1800)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="text-sm font-medium text-ink">Live delivery feed</span>
        <LiveDot />
      </div>
      <div className="divide-y divide-border">
        {feedEvents.map((e, i) => (
          <div
            key={e}
            className={`flex items-center gap-3 px-5 py-4 transition-colors ${
              cursor === i ? 'bg-copper-tint' : ''
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${cursor === i ? 'bg-copper' : 'bg-ink-3'}`}
            />
            <Mono className="flex-1 text-ink">{e}</Mono>
            <span className="font-mono text-xs tabular-nums text-ink-3">
              {(1.4 + i * 0.3).toFixed(1)}s
            </span>
            <Check
              className={`h-4 w-4 ${cursor === i ? 'text-copper' : 'text-ink-3'}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}