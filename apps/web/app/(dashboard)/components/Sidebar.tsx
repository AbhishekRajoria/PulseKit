'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  Activity,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Layers3,
  Settings,
  Webhook,
} from 'lucide-react'
import { Brand, LinkPending, Micro } from '@/app/components/Primitives'

type NavItem = {
  href: string
  label: string
  icon: ReactNode
  exact?: boolean
}

type ProjectSummary = {
  id: string
  name: string
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || 'P'
  )
}

export function Sidebar({
  mobileOpen,
  collapsed,
  onToggleMobile,
  onToggleCollapsed,
}: {
  mobileOpen: boolean
  collapsed: boolean
  onToggleMobile: () => void
  onToggleCollapsed: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    if (href === '/projects') {
      return pathname === '/projects'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/)
  const pathProjectId = projectMatch?.[1] ?? null

  const [projects, setProjects] = useState<ProjectSummary[] | null>(null)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [flyoutPos, setFlyoutPos] = useState<{
    top: number
    left: number
  } | null>(null)
  const switcherBtnRef = useRef<HTMLButtonElement>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [lastPathProjectId, setLastPathProjectId] = useState<string | null>(null)

  if (pathProjectId !== lastPathProjectId) {
    setLastPathProjectId(pathProjectId)
    setSelectedProjectId(pathProjectId)
  }

  const resolvedProjectId = pathProjectId ?? selectedProjectId

  useEffect(() => {
    if (!mobileOpen && collapsed) return
    let cancelled = false

    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success) {
          const list: ProjectSummary[] = data.data ?? []
          setProjects(list)
        }
      })
      .catch(() => {
        if (!cancelled) setProjects([])
      })

    return () => {
      cancelled = true
    }
  }, [mobileOpen, collapsed])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleMobile()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, onToggleMobile])

  useEffect(() => {
    if (!switcherOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSwitcherOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [switcherOpen])

  const currentProject = projects?.find((p) => p.id === resolvedProjectId)
  const expanded = mobileOpen || !collapsed

  const topItems: NavItem[] = resolvedProjectId
    ? [
        {
          href: '/projects',
          label: 'Projects',
          icon: <Layers3 className="h-4 w-4" />,
        },
      ]
    : []

  const projectItems: NavItem[] = resolvedProjectId
    ? [
        {
          href: `/projects/${resolvedProjectId}`,
          label: 'Overview',
          icon: <Gauge className="h-4 w-4" />,
          exact: true,
        },
        {
          href: `/projects/${resolvedProjectId}/events`,
          label: 'Events',
          icon: <Activity className="h-4 w-4" />,
        },
        {
          href: `/projects/${resolvedProjectId}/notifications`,
          label: 'Notifications',
          icon: <Bell className="h-4 w-4" />,
        },
        {
          href: `/projects/${resolvedProjectId}/channels`,
          label: 'Channels',
          icon: <Webhook className="h-4 w-4" />,
        },
        {
          href: `/projects/${resolvedProjectId}/settings`,
          label: 'Settings',
          icon: <Settings className="h-4 w-4" />,
        },
      ]
    : []

  const switcherMenu = (
    <>
      <p className="px-3 pb-1 pt-0.5 text-[11px] font-medium text-ink-4">
        Switch project
      </p>
      {projects?.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => {
            setSelectedProjectId(p.id)
            setSwitcherOpen(false)
            router.push(`/projects/${p.id}`)
          }}
          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
            p.id === resolvedProjectId
              ? 'bg-surface-2 font-medium text-ink'
              : 'text-ink-2 hover:bg-surface-2'
          }`}
        >
          <span className="truncate">{p.name}</span>
          {p.id === resolvedProjectId && (
            <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-copper" />
          )}
        </button>
      ))}
      {projects === null && (
        <p className="px-3 py-1.5 text-xs text-ink-4">Loading…</p>
      )}
      {projects?.length === 0 && (
        <p className="px-3 py-1.5 text-xs text-ink-4">No projects yet</p>
      )}
    </>
  )

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay lg:hidden"
          onClick={onToggleMobile}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex ${
          mobileOpen ? '' : 'hidden lg:flex'
        }`}
      >
        <aside
          className={`group flex h-full flex-col overflow-hidden border-r border-border bg-card transition-[width] duration-200 ${
            mobileOpen ? 'w-60' : 'w-0 lg:w-60'
          } ${!mobileOpen && collapsed ? 'lg:w-[68px]' : ''}`}
        >
          {/* Header — brand */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
            <Brand compact={expanded === false} />
          </div>

          {/* Project switcher */}
          <div className="shrink-0 p-3">
            <button
              type="button"
              ref={switcherBtnRef}
              onClick={() => {
                if (!expanded) {
                  const r = switcherBtnRef.current?.getBoundingClientRect()
                  setFlyoutPos({
                    top: (r?.bottom ?? 120) + 4,
                    left: (r?.right ?? 68) + 8,
                  })
                } else {
                  setFlyoutPos(null)
                }
                setSwitcherOpen((o) => !o)
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg border border-border px-2.5 py-2 text-left text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 ${
                expanded ? '' : 'justify-center px-0'
              }`}
              aria-haspopup="listbox"
              aria-expanded={switcherOpen}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink text-[10px] font-semibold text-white">
                {currentProject ? initials(currentProject.name) : '…'}
              </span>
              {expanded && (
                <>
                  <span className="min-w-0 flex-1 truncate">
                    {currentProject?.name ?? 'Select project'}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 shrink-0 text-ink-3 transition-transform ${switcherOpen ? 'rotate-180' : ''}`}
                  />
                </>
              )}
            </button>

            {switcherOpen && (
              <>
                {createPortal(
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setSwitcherOpen(false)}
                  />,
                  document.body,
                )}
                {expanded || !flyoutPos ? (
                  <div className="absolute left-3 right-3 z-50 mt-1 rounded-lg border border-border bg-card py-1 shadow-panel">
                    {switcherMenu}
                  </div>
                ) : (
                  createPortal(
                    <div
                      className="fixed z-50 w-60 rounded-lg border border-border bg-card py-1 shadow-panel"
                      style={{ top: flyoutPos.top, left: flyoutPos.left }}
                    >
                      {switcherMenu}
                    </div>,
                    document.body,
                  )
                )}
              </>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3">
            {topItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  prefetch
                  className={`relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-surface-2 hover:text-ink ${
                    active
                      ? 'bg-surface-2 font-medium text-ink'
                      : 'text-ink-2'
                  } ${expanded ? '' : 'justify-center px-0'}`}
                  title={expanded ? undefined : item.label}
                >
                  {item.icon}
                  {expanded && item.label}
                  <LinkPending />
                </Link>
              )
            })}

            {/* Project micro-label */}
            {expanded && resolvedProjectId && currentProject && (
              <div className="px-3 pb-1 pt-3">
                <div className="truncate text-[11px] font-semibold uppercase tracking-wider text-ink-3" title={currentProject.name}>
                  {currentProject.name}
                </div>
              </div>
            )}

            {projectItems.map((item) => {
              const active = isActive(item.href, item.exact)
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  prefetch
                  className={`relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-surface-2 hover:text-ink ${
                    active
                      ? 'bg-surface-2 font-medium text-ink'
                      : 'text-ink-2'
                  } ${expanded ? '' : 'justify-center px-0'}`}
                  title={expanded ? undefined : item.label}
                >
                  {item.icon}
                  {expanded && item.label}
                  <LinkPending />
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Edge collapse control — small square button straddling the sidebar edge */}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="absolute bottom-12 right-0 z-10 hidden h-7 w-7 translate-x-1/2 cursor-pointer items-center justify-center rounded-lg border border-border-strong bg-card text-ink-2 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-colors hover:text-ink lg:inline-flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </>
  )
}