export const dynamic = 'force-dynamic'
import { fetchApi } from '@/lib/api'
import type { ApiResponse, Project } from '@/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChannelsForm } from './channels-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const res = await fetchApi(`/api/v1/projects/${id}`)
  if (!res.ok) return { title: 'Channels' }
  const data = (await res.json()) as ApiResponse<Project>
  const name = data.data?.name
  return {
    title: name ? `${name} · Channels` : 'Channels',
    description: name
      ? `Delivery channels for ${name}.`
      : 'Delivery channels configuration.',
  }
}

export default async function ProjectChannelsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const res = await fetchApi(`/api/v1/projects/${id}`)

  if (!res.ok) notFound()

  const response: ApiResponse<Project> = await res.json()
  const project = response.data
  if (!project) notFound()

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mt-6 flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Channels
        </h1>
        <span className="pill bg-surface-2 text-ink-3">Delivery</span>
      </div>
      <p className="mt-1 text-sm text-ink-3">
        Choose where events are delivered for {project.name}.
      </p>

      <div className="mt-6">
        <ChannelsForm
          projectId={id}
          initialChannels={project.channels ?? {}}
        />
      </div>
    </div>
  )
}