'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { timeAgo } from '@/lib/format'
import type { Project, ProjectStats } from '@/types'

type Filter = 'all' | 'active' | 'awaiting'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'awaiting', label: 'Awaiting First Signal' },
]

export default function ProjectsBrowser({
  items,
}: {
  items: { project: Project; stats: ProjectStats | null }[]
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(({ project, stats }) => {
      if (q && !project.name.toLowerCase().includes(q)) return false
      const hasSignal = (stats?.event_count ?? 0) > 0
      if (filter === 'active' && !hasSignal) return false
      if (filter === 'awaiting' && hasSignal) return false
      return true
    })
  }, [items, query, filter])

  return (
    <div className="mt-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
            className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
        </div>
        <div
          role="tablist"
          aria-label="Filter projects"
          className="flex items-center gap-1 rounded-md border border-border bg-surface p-1"
        >
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={`cursor-pointer rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === value
                  ? 'bg-card text-ink shadow-sm'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-3">
          No projects match{filter !== 'all' ? ` “${FILTERS.find((f) => f.value === filter)?.label}”` : ' this search'}.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visible.map(({ project, stats }) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group card overflow-hidden p-0 transition-colors hover:border-border-strong"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
                <p className="truncate pr-2 text-sm font-medium text-ink group-hover:text-ink-2">
                  {project.name}
                </p>
                <span className="shrink-0 rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-medium text-ink-3">
                  {project.rate_limit_per_min} req/min
                </span>
              </div>

              {/* Metrics strip — full bleed */}
              <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-canvas/50 py-3">
                <div className="px-4">
                  <p className="font-mono text-lg font-semibold leading-none tabular-nums text-ink">
                    {stats
                      ? stats.event_count.toLocaleString('en-IN')
                      : '—'}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-4">events</p>
                </div>
                <div className="px-4">
                  <p className="font-mono text-lg font-semibold leading-none tabular-nums text-ink">
                    {stats
                      ? stats.unique_users.toLocaleString('en-IN')
                      : '—'}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-4">users</p>
                </div>
                <div className="px-4">
                  <p
                    className={`font-mono text-lg font-semibold leading-none tabular-nums ${
                      (stats?.unread_count ?? 0) > 0
                        ? 'text-copper'
                        : 'text-ink-4'
                    }`}
                  >
                    {stats ? stats.unread_count.toLocaleString('en-IN') : '—'}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-4">unread</p>
                </div>
              </div>

              {/* Card footer */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="font-mono text-[11px] tabular-nums text-ink-3">
                  Created{' '}
                  {new Date(project.created_at).toLocaleDateString('en-IN', {
                    dateStyle: 'medium',
                  })}
                </p>
                <span className="flex items-center gap-2">
                  {stats?.last_event_at ? (
                    <p className="font-mono text-[11px] tabular-nums text-ink-3">
                      {timeAgo(stats.last_event_at)} ago
                    </p>
                  ) : (
                    <p className="font-mono text-[11px] italic text-ink-4">
                      No events yet
                    </p>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-ink-4 transition-colors group-hover:text-copper" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}