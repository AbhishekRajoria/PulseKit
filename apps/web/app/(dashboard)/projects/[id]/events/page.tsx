export const dynamic = 'force-dynamic'
import { fetchApi } from '@/lib/api'
import type { ApiResponse, Event, Project } from '@/types'
import type { Metadata } from 'next'
import { EventsDashboard } from '@/app/components/EventsDashboard'

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

  const curlSnippet = `curl -X POST ${apiUrl}/api/v1/events \\
  -H "Authorization: Bearer $PULSEKIT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"event_name":"payment.failed","user_id":"user_123","payload":{"amount":9900,"currency":"INR"}}'`

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <EventsDashboard
        projectId={projectId}
        initialEvents={events}
        curlSnippet={curlSnippet}
      />
    </div>
  )
}