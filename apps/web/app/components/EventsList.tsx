'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Search, Terminal } from 'lucide-react'
import { Code, Status } from './Primitives'

type EventRow = {
  id: string
  event_name: string
  user_id: string
  received_at: string
  logs: {
    status: string
    channel: string
  }[]
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour12: false })
}

// Collapse a row's delivery logs into one `channel → status` path per channel,
// keeping the latest status and marking repeated attempts with a ×N suffix.
function channelPaths(logs: EventRow['logs']): string {
  const byChannel = new Map<string, { status: string; attempts: number }>()
  for (const log of logs) {
    const prev = byChannel.get(log.channel)
    if (prev) {
      prev.status = log.status
      prev.attempts += 1
    } else {
      byChannel.set(log.channel, { status: log.status, attempts: 1 })
    }
  }
  return [...byChannel.entries()]
    .map(
      ([channel, { status, attempts }]) =>
        `${channel} → ${status.toLowerCase()}${attempts > 1 ? ` ×${attempts}` : ''}`,
    )
    .join(' · ')
}

const PAGE_SIZE = 10

export function EventsList({
  events,
  projectId,
  flashId,
  curlSnippet,
  toolbarRight,
}: {
  events: EventRow[]
  projectId: string
  flashId?: string | null
  curlSnippet?: string
  toolbarRight?: ReactNode
}) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = events.filter((e) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      e.event_name.toLowerCase().includes(q) ||
      e.user_id.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
    )
  })

  // Reset to first page when the filter or the feed changes
  // (render-time adjustment — avoids set-state-in-effect)
  const [snap, setSnap] = useState({ q: query, evts: events })
  if (snap.q !== query || snap.evts !== events) {
    setSnap({ q: query, evts: events })
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
          <input
            type="text"
            placeholder="Search event_name, user_id, event id…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-border-strong bg-card pl-9 pr-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
        </div>
        {toolbarRight}
      </div>

      {events.length === 0 ? (
        /* Empty state — terminal prompt, first-request copy, shell snippet */
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <Terminal className="h-6 w-6 text-ink-3" />
          <p className="mt-4 text-sm font-semibold text-ink">
            No events received
          </p>
          <p className="mt-1.5 text-sm text-ink-2">
            Send your first request to POST /api/v1/events and this feed
            fills in real time.
          </p>
          {curlSnippet && (
            <div className="mt-6 w-full max-w-2xl text-left">
              <Code filename="shell">{curlSnippet}</Code>
            </div>
          )}
        </div>
      ) : (
        <>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th scope="col" className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-3">
                  Event
                </th>
                <th scope="col" className="hidden px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-3 sm:table-cell">
                  User
                </th>
                <th scope="col" className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-3">
                  Status
                </th>
                <th scope="col" className="hidden px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-3 md:table-cell">
                  Channel path
                </th>
                <th scope="col" className="hidden px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-ink-3 lg:table-cell">
                  Received
                </th>
                <th scope="col" className="w-10 px-2 py-2.5">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => {
                const lastLog = e.logs[e.logs.length - 1]
                const status = lastLog?.status ?? 'pending'
                const isFlash = e.id === flashId

                return (
                  <tr
                    key={e.id}
                    className={`h-11 border-b border-border/50 transition-colors last:border-b-0 hover:bg-canvas ${
                      isFlash ? 'bg-copper-tint' : ''
                    }`}
                  >
                    <td className="px-4 align-middle">
                      <div className="flex items-center gap-2">
                        {isFlash && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-copper" />
                        )}
                        <Link
                          href={`/projects/${projectId}/events/${e.id}`}
                          className="cursor-pointer font-mono text-[13px] font-medium text-ink hover:text-copper hover:underline"
                        >
                          {e.event_name}
                        </Link>
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-ink-3">
                        {e.id}
                      </p>
                    </td>
                    <td className="hidden px-4 align-middle font-mono text-[13px] text-ink-3 sm:table-cell">
                      {e.user_id}
                    </td>
                    <td className="px-4 align-middle">
                      <Status status={status} />
                    </td>
                    <td className="hidden px-4 align-middle md:table-cell">
                      <span className="font-mono text-[11px] text-ink-2">
                        {e.logs.length > 0 ? channelPaths(e.logs) : '—'}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 align-middle text-right lg:table-cell">
                      <span className="block font-mono text-xs tabular-nums text-ink-2">
                        {e.received_at ? formatTime(e.received_at) : '—'}
                      </span>
                      <span className="block text-[11px] tabular-nums text-ink-3">
                        {e.received_at ? `${timeAgo(e.received_at)} ago` : ''}
                      </span>
                    </td>
                    <td className="w-10 px-2 align-middle">
                      <Link
                        href={`/projects/${projectId}/events/${e.id}`}
                        className="inline-flex cursor-pointer rounded p-1 text-ink-4 transition-colors hover:text-ink"
                        aria-label={`Open ${e.event_name}`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-ink-3"
                  >
                    No events match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="font-mono text-xs tabular-nums text-ink-3">
              {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border-strong text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-default disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === safePage ? 'page' : undefined}
                  className={`h-8 min-w-8 cursor-pointer rounded-md border px-2 font-mono text-xs tabular-nums transition-colors ${
                    n === safePage
                      ? 'border-ink bg-ink text-white'
                      : 'border-border-strong text-ink-2 hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border-strong text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-default disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  )
}