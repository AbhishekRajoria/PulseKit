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

  const [eventsRes, projectRes] = await Promise.all([
    fetchApi(`/api/v1/events?project_id=${projectId}`),
    fetchApi(`/api/v1/projects/${projectId}`),
  ])
  const data: ApiResponse<Event[]> = await eventsRes.json()
  const events = data.data ?? []

  let projectName = 'Project'
  if (projectRes.ok) {
    const projectData = (await projectRes.json()) as ApiResponse<Project>
    if (projectData.data?.name) projectName = projectData.data.name
  }

  const curlSnippet = `curl -X POST ${apiUrl}/api/v1/events \\
  -H "Authorization: Bearer $PULSEKIT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event_name": "invoice.paid",
    "user_id": "usr_4f91",
    "payload": { "amount": 2400, "currency": "USD" }
  }'`

  return (
    <EventsDashboard
      projectId={projectId}
      projectName={projectName}
      initialEvents={events}
      curlSnippet={curlSnippet}
    />
  )
}