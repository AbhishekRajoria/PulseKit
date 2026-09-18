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

export function EventsList({
  events,
  projectId,
}: {
  events: EventRow[]
  projectId: string
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
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          All events
        </h2>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
          <input
            type="text"
            placeholder="Search events…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-52 rounded-md border border-border-strong bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                Event
              </th>
              <th scope="col" className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3 sm:table-cell">
                User
              </th>
              <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                Status
              </th>
              <th scope="col" className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3 md:table-cell">
                Channel
              </th>
              <th scope="col" className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3 lg:table-cell">
                Received
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((e) => {
              const lastLog = e.logs[e.logs.length - 1]
              const status = lastLog?.status ?? 'pending'
              const channel = lastLog?.channel ?? '—'

              return (
                <tr key={e.id} className="transition-colors hover:bg-surface-2">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/projects/${projectId}/events/${e.id}`}
                      className="cursor-pointer font-mono text-[13px] font-medium text-ink hover:text-copper hover:underline"
                    >
                      {e.event_name}
                    </Link>
                  </td>
                  <td className="hidden px-5 py-3.5 font-mono text-[13px] text-ink-3 sm:table-cell">
                    {e.user_id}
                  </td>
                  <td className="px-5 py-3.5">
                    <Status status={status} />
                  </td>
                  <td className="hidden px-5 py-3.5 md:table-cell">
                    <span className="pill bg-surface-2 capitalize text-ink-3">
                      {channel}
                      {e.logs.length > 1 && <span className="text-ink-4">×{e.logs.length}</span>}
                    </span>
                  </td>
                  <td className="hidden whitespace-nowrap px-5 py-3.5 text-xs tabular-nums text-ink-3 lg:table-cell">
                    {e.received_at ? timeAgo(e.received_at) : '—'}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-ink-3"
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