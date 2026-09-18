export const dynamic = 'force-dynamic'
import { fetchApi } from '@/lib/api'
import type { ApiResponse, Event, Project } from '@/types'
import type { Metadata } from 'next'
import { LiveFeed } from '@/app/components/LiveFeed'
import { EventsList } from '@/app/components/EventsList'
import { Code } from '@/app/components/Primitives'
import Link from 'next/link'
import { ArrowLeft, CornerDownLeft, FileTerminal } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const res = await fetchApi(`/api/v1/projects/${id}`)
  if (!res.ok) return { title: 'Events' }
  const data = (await res.json()) as ApiResponse<Project>
  const name = data.data?.name
  return {
    title: name ? `${name} · Events` : 'Events',
    description: name
      ? `Event log and delivery status for ${name}.`
      : 'Event log and delivery status.',
  }
}

const apiUrl = (process.env.API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

export default async function ProjectEventsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = await params

  const res = await fetchApi(`/api/v1/events?project_id=${projectId}`)
  const data: ApiResponse<Event[]> = await res.json()
  const events = data.data ?? []

  const total = events.length
  const delivered = events.filter(
    (e) => e.logs[e.logs.length - 1]?.status === 'delivered',
  ).length
  const failed = events.filter(
    (e) => e.logs[e.logs.length - 1]?.status === 'failed',
  ).length
  const pending = events.filter((e) => !e.logs.length).length

  const curlSnippet = `curl -X POST ${apiUrl}/api/v1/events \\
  -H "Authorization: Bearer $PULSEKIT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"event_name":"payment.failed","user_id":"user_123","payload":{"amount":9900,"currency":"INR"}}'`

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link
        href={`/projects/${projectId}`}
        className="group inline-flex cursor-pointer items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Project overview
      </Link>

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
          {events[0]?.project_id && (
            <LiveFeed projectId={events[0].project_id} />
          )}

          {/* Events table with search */}
          <div className="mt-6">
            <EventsList events={events} projectId={projectId} />
          </div>
        </>
      )}
    </div>
  )
}