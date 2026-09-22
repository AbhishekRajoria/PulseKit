'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { timeAgo } from '@/lib/format'
import type { Project, ProjectStats } from '@/types'
import CreateProjectForm from './create-form'

type Filter = 'all' | 'populated' | 'empty'

function Stat({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="border-r border-border px-5 last:border-r-0">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        {label}
      </div>
      <div
        className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
          muted ? 'text-ink-4' : 'text-foreground'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

export default function ProjectsBrowser({
  items,
  eventUrl,
  actionsOnly,
  filterOnly,
  gridOnly,
  canCreate = true,
}: {
  items: { project: Project; stats: ProjectStats | null }[]
  eventUrl: string
  actionsOnly?: boolean
  filterOnly?: boolean
  gridOnly?: boolean
  canCreate?: boolean
}) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = items.filter(({ stats }) => {
    if (filter === 'all') return true
    const hasSignal = (stats?.event_count ?? 0) > 0
    return filter === 'populated' ? hasSignal : !hasSignal
  })

  if (actionsOnly) {
    if (!canCreate) return null
    return (
      <CreateProjectForm variant="button" eventUrl={eventUrl} openSignal />
    )
  }

  if (filterOnly) {
    return (
      <div
        role="tablist"
        aria-label="Filter projects"
        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-0.5"
      >
        {(
          [
            { value: 'all', label: 'All' },
            { value: 'populated', label: 'Populated' },
            { value: 'empty', label: 'Empty' },
          ] as const
        ).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === value
                ? 'bg-surface-2 text-ink'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    )
  }

  if (gridOnly) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map(({ project, stats }) => {
          const eventCount = stats?.event_count ?? 0
          const userCount = stats?.unique_users ?? 0
          const unread = stats?.unread_count ?? 0

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group flex flex-col rounded-2xl border border-border bg-card shadow-card transition-colors hover:border-border-strong"
            >
              {/* Card header */}
              <div className="flex items-start justify-between p-5">
                <div>
                  <h2 className="font-semibold text-ink">
                    {project.name}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-ink-3">
                    {project.id}
                  </p>
                </div>
                <span className="rounded-md border border-border px-2 py-1 font-mono text-[10px] tabular-nums text-ink-3">
                  {project.rate_limit_per_min} req/min
                </span>
              </div>

              {/* Metrics strip with vertical dividers */}
              <div className="grid grid-cols-3 border-y border-border py-4">
                <Stat
                  label="Events"
                  value={
                    stats
                      ? eventCount.toLocaleString('en-IN')
                      : '—'
                  }
                />
                <Stat
                  label="Users"
                  value={
                    stats
                      ? userCount.toLocaleString('en-IN')
                      : '—'
                  }
                />
                <div className="border-r border-border px-5 last:border-r-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                    Unread
                  </p>
                  <p
                    className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
                      unread > 0 ? 'text-copper' : 'text-ink-4'
                    }`}
                  >
                    {stats ? unread.toLocaleString('en-IN') : '—'}
                  </p>
                </div>
              </div>

              {/* Card footer */}
              <div className="flex items-center justify-between p-5 text-xs text-ink-3">
                <div>
                  Created{' '}
                  {new Date(project.created_at).toLocaleDateString('en-IN', {
                    dateStyle: 'medium',
                  })}
                  <span className="mx-2">·</span>
                  {stats?.last_event_at ? (
                    <>Last event {timeAgo(stats.last_event_at)} ago</>
                  ) : (
                    <>No events yet</>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-ink-3 transition-colors group-hover:text-copper">
                  View <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          )
        })}

        {/* Empty "New project" card — inside grid */}
        {canCreate && (
          <div className="h-40">
            <CreateProjectForm variant="card" eventUrl={eventUrl} />
          </div>
        )}
      </div>
    )
  }

  return null
}
