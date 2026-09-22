'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { Status } from './Primitives'

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

export function EventsList({
  events,
  projectId,
  flashId,
}: {
  events: EventRow[]
  projectId: string
  flashId?: string | null
}) {
  const [query, setQuery] = useState('')

  const filtered = events.filter((e) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      e.event_name.toLowerCase().includes(q) ||
      e.user_id.toLowerCase().includes(q)
    )
  })

  return (
    <div className="rounded-b-lg border border-t-0 border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-2.5">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-ink-3">
          All events
        </h2>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
          <input
            type="text"
            placeholder="Search events…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-52 rounded-md border border-border-strong bg-card pl-8 pr-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
        </div>
      </div>

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
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const lastLog = e.logs[e.logs.length - 1]
              const status = lastLog?.status ?? 'pending'
              const isFlash = e.id === flashId

              return (
                <tr
                  key={e.id}
                  className={`h-11 transition-colors hover:bg-canvas ${
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
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-ink-3"
                >
                  No events match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}