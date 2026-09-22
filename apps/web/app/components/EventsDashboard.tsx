'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Micro, Mono } from './Primitives'
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
const FLASH_MS = 2400

// The newest event by received_at — the one that just arrived in the feed.
function newestId(rows: EventRow[]): string | null {
  let id: string | null = null
  let at = ''
  for (const row of rows) {
    if (row.received_at && row.received_at > at) {
      at = row.received_at
      id = row.id
    }
  }
  return id
}

export function EventsDashboard({
  projectId,
  projectName,
  initialEvents,
  curlSnippet,
}: {
  projectId: string
  projectName: string
  initialEvents: EventRow[]
  curlSnippet: string
}) {
  const [events, setEvents] = useState(initialEvents)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [updates, setUpdates] = useState(0)
  const newestRef = useRef<string | null>(newestId(initialEvents))
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const res = await fetch(`/api/events?project_id=${projectId}`)
        if (!res.ok) return
        const data = await res.json()
        const next: EventRow[] = data?.data ?? []
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

        const nextNewest = newestId(next)
        if (nextNewest && nextNewest !== newestRef.current) {
          setFlashId(nextNewest)
          setUpdates((u) => u + 1)
          if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
          flashTimerRef.current = setTimeout(() => setFlashId(null), FLASH_MS)
        }
        newestRef.current = nextNewest
      } catch {
        // transient network error — keep showing last known state
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-3">
        <Link href="/projects" className="transition-colors hover:text-ink">
          All projects
        </Link>
        <ChevronRight className="h-3 w-3 text-ink-4" />
        <Link
          href={`/projects/${projectId}`}
          className="transition-colors hover:text-ink"
        >
          {projectName}
        </Link>
        <ChevronRight className="h-3 w-3 text-ink-4" />
        <span className="font-medium text-ink">Events</span>
      </nav>

      {/* Title */}
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
        Events
      </h1>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
        <span className="font-mono tabular-nums">
          {total.toLocaleString()} processed
        </span>
        <span className="text-ink-3">·</span>
        <Mono className="break-all">{projectId}</Mono>
      </div>

      {/* Stats — single card, four columns with dividers */}
      <div className="mt-6 grid grid-cols-2 rounded-2xl border border-border bg-card shadow-card lg:grid-cols-4">
        <div className="border-border px-5 py-5 max-lg:odd:border-r max-lg:[&:nth-child(-n+2)]:border-b lg:border-r lg:last:border-r-0">
          <Micro>Total</Micro>
          <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
            {total.toLocaleString()}
          </div>
        </div>
        <div className="px-5 py-5 max-lg:[&:nth-child(-n+2)]:border-b lg:border-r lg:border-border">
          <Micro>Delivered</Micro>
          <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
            {delivered.toLocaleString()}
          </div>
        </div>
        <div className="border-border px-5 py-5 max-lg:border-r lg:border-r">
          <Micro>Failed</Micro>
          <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
            {failed.toLocaleString()}
          </div>
        </div>
        <div className="px-5 py-5">
          <Micro>Pending</Micro>
          <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
            {pending.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Feed card — search toolbar, live table or empty state */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <EventsList
          events={events}
          projectId={projectId}
          flashId={flashId}
          curlSnippet={curlSnippet}
          toolbarRight={<LiveFeed projectId={projectId} updates={updates} />}
        />
      </div>
    </div>
  )
}