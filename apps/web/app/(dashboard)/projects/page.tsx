export const dynamic = 'force-dynamic'
import { fetchApi } from '@/lib/api'
import type { ApiResponse, Project, ProjectStats } from '@/types'
import type { Metadata } from 'next'
import { FolderKanban } from 'lucide-react'
import ProjectsBrowser from './projects-browser'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Manage your PulseKit projects, API keys, and delivery stats.',
}

const apiUrl = (process.env.API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

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

  const items = projects.map((project, i) => ({
    project,
    stats: statsList[i],
  }))

  return (
    <div>
      {/* Title area */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Projects
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            Environments, API keys, and delivery limits.
          </p>
        </div>
        <ProjectsBrowser
          items={items}
          eventUrl={`${apiUrl}/api/v1/events`}
          actionsOnly
          canCreate={items.length < 5}
        />
      </div>

      {/* Filter row */}
      <ProjectsBrowser
        items={items}
        eventUrl={`${apiUrl}/api/v1/events`}
        filterOnly
      />

      {/* Empty hint — no form here. Creation happens through the grid's
          New-project card below, whose instance (and its success modal)
          survives the empty→populated transition. */}
      {projects.length === 0 && (
        <div className="grid min-h-[240px] place-items-center rounded-2xl border border-dashed border-strong-border">
          <div className="max-w-sm px-6 py-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-border bg-card text-ink-3">
              <FolderKanban className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-sm font-semibold text-ink">No projects yet</h2>
            <p className="mt-2 text-sm text-ink-2">
              Create a project below to get your API key and start sending events.
            </p>
          </div>
        </div>
      )}

      {/* Project grid — always mounted so the create form instance (and its
          one-time key modal) is never unmounted by creation itself */}
      <ProjectsBrowser
        items={items}
        eventUrl={`${apiUrl}/api/v1/events`}
        gridOnly
        canCreate={items.length < 5}
      />
    </div>
  )
}
