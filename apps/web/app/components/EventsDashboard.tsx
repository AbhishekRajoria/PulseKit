'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CornerDownLeft, FileTerminal } from 'lucide-react'
import { Code } from './Primitives'
import { EventsList } from './EventsList'
import { LiveFeed } from './LiveFeed'

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

const POLL_INTERVAL_MS = 8000

export function EventsDashboard({
  projectId,
  initialEvents,
  curlSnippet,
}: {
  projectId: string
  initialEvents: EventRow[]
  curlSnippet: string
}) {
  const [events, setEvents] = useState(initialEvents)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const res = await fetch(`/api/events?project_id=${projectId}`)
        if (!res.ok) return
        const data = await res.json()
        const next = data?.data ?? []
        if (cancelled) return
        setEvents((prev) => {
          if (
            prev.length === next.length &&
            prev.every((e, i) => e.id === next[i].id)
          ) {
            return prev
          }
          return next
        })
      } catch {
        // transient network error — keep showing last known state
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [projectId])

  const total = events.length
  const delivered = events.filter(
    (e) => e.logs[e.logs.length - 1]?.status === 'delivered',
  ).length
  const failed = events.filter(
    (e) => e.logs[e.logs.length - 1]?.status === 'failed',
  ).length
  const pending = events.filter((e) => !e.logs.length).length

  return (
    <div>
      <div className="mt-4 flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Events
        </h1>
        <span className="pill bg-surface-2 font-mono text-ink-3">
          {total} {total === 1 ? 'event' : 'events'}
        </span>
      </div>

      {events.length === 0 ? (
        /* Empty state — a fresh project's first surface a reviewer sees */
        <div className="mt-10">
          <div className="card overflow-hidden">
            <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 text-ink-4">
                <FileTerminal className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">No events yet</p>
                <p className="mt-1 text-xs text-ink-3">
                  Send your first event and it will appear here in real time.
                </p>
              </div>
            </div>

            <div className="border-t border-border px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">
                Quick start — send an event with curl
              </p>
              <div className="mt-3">
                <Code filename="shell">{curlSnippet}</Code>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-3">
                <CornerDownLeft className="h-3.5 w-3.5" />
                Get your API key from{' '}
                <Link
                  href={`/projects/${projectId}`}
                  className="cursor-pointer font-medium text-ink underline underline-offset-2 hover:text-copper"
                >
                  Project overview
                </Link>
                , then send.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stat cards — Total gets headline size, others secondary */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                Total events
              </p>
              <p className="mt-2 font-mono text-4xl font-semibold leading-none tabular-nums text-ink">
                {total.toLocaleString()}
              </p>
            </div>
            <div className="card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                Delivered
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold leading-none tabular-nums text-copper">
                {delivered.toLocaleString()}
              </p>
            </div>
            <div className="card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                Failed
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold leading-none tabular-nums text-failure">
                {failed.toLocaleString()}
              </p>
            </div>
            <div className="card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                Pending
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold leading-none tabular-nums text-ink-3">
                {pending.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Live feed */}
          <div className="mt-6">
            <LiveFeed projectId={projectId} />
          </div>

          {/* Events table with search */}
          <div className="mt-6">
            <EventsList events={events} projectId={projectId} />
          </div>
        </>
      )}
    </div>
  )
}