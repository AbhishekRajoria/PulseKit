export const dynamic = 'force-dynamic'
import { fetchApi } from '@/lib/api'
import type { ApiResponse, Project } from '@/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProjectTabs } from '@/app/components/ProjectTabs'
import { SettingsForm } from './settings-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const res = await fetchApi(`/api/v1/projects/${id}`)
  if (!res.ok) return { title: 'Settings' }
  const data = (await res.json()) as ApiResponse<Project>
  const name = data.data?.name
  return {
    title: name ? `${name} · Settings` : 'Settings',
    description: name ? `Project settings for ${name}.` : 'Project settings.',
  }
}

export default async function ProjectSettingsPage({
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
      <ProjectTabs projectId={id} />

      <div className="mt-6 flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Settings
        </h1>
        <span className="pill bg-surface-2 text-ink-3">Project</span>
      </div>
      <p className="mt-1 text-sm text-ink-3">
        Configure how {project.name} behaves.
      </p>

      <div className="mt-6">
        <SettingsForm
          projectId={id}
          projectName={project.name}
          rateLimit={project.rate_limit_per_min}
        />
      </div>
    </div>
  )
}