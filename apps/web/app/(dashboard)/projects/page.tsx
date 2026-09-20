export const dynamic = 'force-dynamic'
import { fetchApi } from '@/lib/api'
import type { ApiResponse, Project, ProjectStats } from '@/types'
import type { Metadata } from 'next'
import { FolderKanban } from 'lucide-react'
import CreateProjectForm from './create-form'
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
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Projects
          </h1>
          {projects.length > 0 && (
            <span className="pill border bg-surface-2 font-mono text-ink-3">
              {projects.length}
            </span>
          )}
        </div>
        {projects.length > 0 && (
          <CreateProjectForm eventUrl={`${apiUrl}/api/v1/events`} />
        )}
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="mt-12 flex flex-col items-center gap-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-lg bg-surface-2 text-ink-4">
            <FolderKanban className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">No projects yet</p>
            <p className="mt-1 text-xs text-ink-3">
              Create your first project to start sending notifications
            </p>
          </div>
          <div className="w-full max-w-md">
            <CreateProjectForm eventUrl={`${apiUrl}/api/v1/events`} />
          </div>
        </div>
      )}

      {/* Filterable grid */}
      {projects.length > 0 && <ProjectsBrowser items={items} />}
    </div>
  )
}