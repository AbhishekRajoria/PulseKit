export const dynamic = 'force-dynamic'
import { fetchApi } from '@/lib/api'
import type { ApiResponse, Event } from '@/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PayloadBlock } from '@/app/components/PayloadBlock'
import { Micro, Status } from '@/app/components/Primitives'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>
}): Promise<Metadata> {
  const { id, eventId } = await params
  const res = await fetchApi(`/api/v1/events/${eventId}?project_id=${id}`)
  if (!res.ok) return { title: 'Event' }
  const data = (await res.json()) as ApiResponse<Event>
  const name = data.data?.event_name
  return {
    title: name ?? 'Event',
    description: name
      ? `Delivery status, payload, and attempt log for ${name}.`
      : 'Event delivery status and payload.',
  }
}

export default async function ProjectEventDetailPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>
}) {
  const { id: projectId, eventId } = await params

  const res = await fetchApi(`/api/v1/events/${eventId}?project_id=${projectId}`)

  if (!res.ok) notFound()

  const response: ApiResponse<Event> = await res.json()
  const event = response.data
  if (!event) notFound()

  const lastLog = event.logs[event.logs.length - 1]
  const status = lastLog?.status ?? 'pending'
  const channel = lastLog?.channel ?? '—'

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href={`/projects/${projectId}/events`}
        className="group inline-flex cursor-pointer items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to events
      </Link>

      <div className="card mt-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <Micro>Event</Micro>
            <h1 className="mt-1 font-mono text-xl font-semibold tracking-tight text-ink">
              {event.event_name}
            </h1>
            <p className="mt-1 font-mono text-xs text-ink-3">{event.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <Status status={status} />
            <span className="pill bg-surface-2 capitalize text-ink-3">
              {channel}
            </span>
          </div>
        </div>

        {/* Meta + Payload */}
        <div className="space-y-6 px-6 py-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Micro>User</Micro>
              <p className="mt-1.5 font-mono text-sm text-ink">{event.user_id}</p>
            </div>
            <div>
              <Micro>Received</Micro>
              <p className="mt-1.5 text-sm text-ink">
                {event.received_at
                  ? new Date(event.received_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '—'}
              </p>
            </div>
          </div>

          {event.payload && Object.keys(event.payload).length > 0 && (
            <PayloadBlock payload={event.payload} />
          )}
        </div>
      </div>

      {/* Delivery logs */}
      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <p className="text-sm font-semibold text-ink">Delivery log</p>
          <span className="pill bg-surface-2 font-mono text-ink-3">
            {event.logs.length}
          </span>
        </div>
        <div className="card overflow-hidden">
          {event.logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                      Channel
                    </th>
                    <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                      Attempt
                    </th>
                    <th scope="col" className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3 sm:table-cell">
                      Error
                    </th>
                    <th scope="col" className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3 md:table-cell">
                      Delivered
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {event.logs.map((log) => (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-surface-2"
                    >
                      <td className="px-5 py-3">
                        <span className="pill bg-surface-2 capitalize text-ink-3">
                          {log.channel}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Status status={log.status} />
                      </td>
                      <td className="px-5 py-3 font-mono text-xs tabular-nums text-ink-2">
                        {log.attempt_number}
                      </td>
                      <td className="hidden px-5 py-3 font-mono text-xs text-failure sm:table-cell">
                        {log.error_message ?? (
                          <span className="text-ink-4">&mdash;</span>
                        )}
                      </td>
                      <td className="hidden whitespace-nowrap px-5 py-3 text-xs tabular-nums text-ink-3 md:table-cell">
                        {new Date(log.delivered_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-ink">
                No delivery attempts yet
              </p>
              <p className="mt-1 text-xs text-ink-3">
                The worker will log delivery here shortly after the event is
                processed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}