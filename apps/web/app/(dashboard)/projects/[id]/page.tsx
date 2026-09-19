export const dynamic = 'force-dynamic'
import { fetchApi } from '@/lib/api'
import type { ApiResponse, Project, ProjectStats } from '@/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Activity, Bell } from 'lucide-react'
import { RevealKey } from './reveal-key'
import { Micro } from '@/app/components/Primitives'
import { ProjectTabs } from '@/app/components/ProjectTabs'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const res = await fetchApi(`/api/v1/projects/${id}`)
  if (!res.ok) return { title: 'Project' }
  const data = (await res.json()) as ApiResponse<Project>
  const name = data.data?.name
  return {
    title: name ? `${name} — project` : 'Project',
    description: name
      ? `Project ${name} — API key, events, and delivery notifications.`
      : 'PulseKit project overview.',
  }
}

export default async function ProjectDetailPage({
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

  const statsRes = await fetchApi(`/api/v1/projects/${id}/stats`)
  const stats: ProjectStats | null = statsRes.ok
    ? ((await statsRes.json()) as ApiResponse<ProjectStats>).data ?? null
    : null

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/projects"
        className="group inline-flex cursor-pointer items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        All projects
      </Link>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Micro>Project</Micro>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {project.name}
          </h1>
          <p className="mt-1 font-mono text-xs text-ink-3">{project.id}</p>
        </div>
        <div className="flex items-center gap-6 sm:mt-2">
          <div>
            <Micro>Rate limit</Micro>
            <p className="mt-1 font-mono text-sm tabular-nums text-ink">
              {project.rate_limit_per_min} req/min
            </p>
          </div>
          <div>
            <Micro>Created</Micro>
            <p className="mt-1 text-sm text-ink">
              {new Date(project.created_at).toLocaleDateString('en-IN', {
                dateStyle: 'medium',
              })}
            </p>
          </div>
        </div>
      </div>

      <ProjectTabs projectId={id} />

      <div className="mt-6">
        <RevealKey projectId={project.id} />
      </div>

      {/* Quick look cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href={`/projects/${id}/events`}
          className="group card flex items-center justify-between p-5 transition-colors hover:border-border-strong"
        >
          <div className="flex items-start gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-ink-3">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink group-hover:text-ink-2">
                Events
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold leading-none tabular-nums text-ink">
                {stats ? stats.event_count.toLocaleString('en-IN') : '—'}
                <span className="ml-1.5 text-sm font-normal text-ink-3">
                  total
                </span>
              </p>
              <p className="mt-1.5 text-xs text-ink-4">
                View event log and delivery status
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 transition-colors group-hover:text-copper" />
        </Link>

        <Link
          href={`/projects/${id}/notifications`}
          className="group card flex items-center justify-between p-5 transition-colors hover:border-border-strong"
        >
          <div className="flex items-start gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-ink-3">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink group-hover:text-ink-2">
                Notifications
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold leading-none tabular-nums text-copper">
                {stats ? stats.unread_count.toLocaleString('en-IN') : '—'}
                <span className="ml-1.5 text-sm font-normal text-ink-3">
                  unread
                </span>
              </p>
              <p className="mt-1.5 text-xs text-ink-4">
                In-app notifications for end users
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 transition-colors group-hover:text-copper" />
        </Link>
      </div>
    </div>
  )
}