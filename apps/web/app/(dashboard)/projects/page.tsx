export const dynamic = 'force-dynamic'
import { fetchApi } from '@/lib/api'
import { timeAgo } from '@/lib/format'
import type { ApiResponse, Project, ProjectStats } from '@/types'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, FolderKanban } from 'lucide-react'
import CreateProjectForm from './create-form'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Manage your PulseKit projects, API keys, and delivery stats.',
}

export default async function ProjectsPage() {
  const res = await fetchApi('/api/v1/projects')
  const data: ApiResponse<Project[]> = await res.json()
  const projects = data.data ?? []

  const statsList = await Promise.all(
    projects.map(async (project) => {
      try {
        const sres = await fetchApi(`/api/v1/projects/${project.id}/stats`)
        if (!sres.ok) return null
        const sdata: ApiResponse<ProjectStats> = await sres.json()
        return sdata.data ?? null
      } catch {
        return null
      }
    }),
  )

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Projects
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        {projects.length > 0 && (
          <div className="mt-1">
            <CreateProjectForm />
          </div>
        )}
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="mt-12 flex flex-col items-center gap-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 text-ink-4">
            <FolderKanban className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">No projects yet</p>
            <p className="mt-1 text-xs text-ink-3">
              Create your first project to start sending notifications
            </p>
          </div>
          <div className="w-full max-w-md">
            <CreateProjectForm />
          </div>
        </div>
      )}

      {/* Project grid */}
      {projects.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project, i) => {
            const stats = statsList[i]

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group card flex flex-col gap-4 p-5 transition-colors hover:border-border-strong"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink group-hover:text-ink-2">
                      {project.name}
                    </p>
                    <p className="mt-0.5 font-mono text-xs tabular-nums text-ink-3">
                      {project.rate_limit_per_min} req/min
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 transition-colors group-hover:text-copper" />
                </div>

                {/* Stats strip — full bleed */}
                {stats && (
                  <div className="-mx-5 grid grid-cols-3 divide-x divide-border border-y border-border py-3">
                    <div className="px-5">
                      <p className="font-mono text-lg font-semibold leading-none tabular-nums text-ink">
                        {stats.event_count.toLocaleString('en-IN')}
                      </p>
                      <p className="mt-1 text-[11px] text-ink-4">events</p>
                    </div>
                    <div className="px-5">
                      <p className="font-mono text-lg font-semibold leading-none tabular-nums text-ink">
                        {stats.unique_users.toLocaleString('en-IN')}
                      </p>
                      <p className="mt-1 text-[11px] text-ink-4">users</p>
                    </div>
                    <div className="px-5">
                      <p className="font-mono text-lg font-semibold leading-none tabular-nums text-copper">
                        {stats.unread_count.toLocaleString('en-IN')}
                      </p>
                      <p className="mt-1 text-[11px] text-ink-4">unread</p>
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-ink-3">
                    Created{' '}
                    {new Date(project.created_at).toLocaleDateString('en-IN', {
                      dateStyle: 'medium',
                    })}
                  </p>
                  {stats?.last_event_at && (
                    <p className="text-xs text-ink-3">
                      Last event {timeAgo(stats.last_event_at)} ago
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}