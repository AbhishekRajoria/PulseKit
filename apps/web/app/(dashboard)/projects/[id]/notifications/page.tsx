'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  BellDot,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  LoaderCircle,
  Search,
} from 'lucide-react'
import type { ApiResponse, Notification, Project } from '@/types'

type NotificationsResponse = {
  notifications: Notification[]
  unread_count: number
}

type UserWithNotifications = {
  user_id: string
  display_name: string | null
  unread_count: number
  last_notification_at: string
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function NotificationsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [users, setUsers] = useState<UserWithNotifications[] | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [notifs, setNotifs] = useState<NotificationsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [userQuery, setUserQuery] = useState('')
  const [projectName, setProjectName] = useState('Project')

  const activeUser = users?.find((u) => u.user_id === userId) ?? null
  const activeName = activeUser?.display_name || userId || ''

  const q = userQuery.trim().toLowerCase()
  const visibleUsers = users
    ? users.filter((u) => u.user_id.toLowerCase().includes(q))
    : null

  useEffect(() => {
    let cancelled = false
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const list: Project[] = Array.isArray(data.data) ? data.data : []
        const match = list.find((p) => p.id === projectId)
        if (match) setProjectName(match.name)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [projectId])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/notifications/users?project_id=${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data.data) ? data.data : []
          setUsers(list)
          if (list.length > 0 && !userId) {
            setUserId(list[0].user_id)
          } else if (list.length === 0) {
            setLoading(false)
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUsers([])
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [projectId, userId])

  const fetchNotifications = useCallback(
    async (uid: string) => {
      setError(null)
      setLoading(true)
      try {
        const res = await fetch(
          `/api/notifications/project/${projectId}/user/${uid}`,
        )
        const data: ApiResponse<NotificationsResponse> = await res.json()
        if (!data.success || !data.data) {
          setError(data.error ?? 'Failed to load notifications')
          setNotifs(null)
        } else {
          setNotifs(data.data)
        }
      } catch {
        setError('Failed to load notifications')
        setNotifs(null)
      } finally {
        setLoading(false)
      }
    },
    [projectId],
  )

  useEffect(() => {
    if (!userId) return
    const id = setTimeout(() => fetchNotifications(userId), 0)
    return () => clearTimeout(id)
  }, [userId, fetchNotifications])

  const markAsRead = useCallback(
    async (n: Notification) => {
      if (n.read) return
      const res = await fetch(
        `/api/notifications/${n.id}/read?project_id=${projectId}`,
        { method: 'PATCH' },
      )
      const data: ApiResponse<Notification> = await res.json()
      if (data.success && data.data) {
        setNotifs((prev) =>
          prev
            ? {
                notifications: prev.notifications.map((x) =>
                  x.id === n.id ? { ...x, read: true } : x,
                ),
                unread_count: Math.max(0, prev.unread_count - 1),
              }
            : prev,
        )
        setUsers((prev) =>
          prev
            ? prev.map((u) =>
                u.user_id === n.user_id
                  ? { ...u, unread_count: Math.max(0, u.unread_count - 1) }
                  : u,
              )
            : prev,
        )
      }
    },
    [projectId],
  )

  const markAllAsRead = useCallback(async () => {
    if (!notifs || notifs.unread_count === 0 || markingAll || !userId) return
    setMarkingAll(true)
    try {
      const res = await fetch(
        `/api/notifications/read-all?project_id=${projectId}&user_id=${encodeURIComponent(
          userId,
        )}`,
        {
          method: 'PATCH',
        },
      )
      const data: ApiResponse<{ count: number }> = await res.json()
      if (data.success) {
        setNotifs((prev) =>
          prev
            ? {
                notifications: prev.notifications.map((x) => ({
                  ...x,
                  read: true,
                })),
                unread_count: 0,
              }
            : prev,
        )
        setUsers((prev) =>
          prev
            ? prev.map((u) =>
                u.user_id === userId ? { ...u, unread_count: 0 } : u,
              )
            : prev,
        )
      }
    } finally {
      setMarkingAll(false)
    }
  }, [notifs, markingAll, userId, projectId])

  const handleRowClick = (n: Notification) => {
    setExpandedId((prev) => (prev === n.id ? null : n.id))
    markAsRead(n)
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-3">
        <Link href="/projects" className="transition-colors hover:text-ink">
          All projects
        </Link>
        <ChevronRight className="h-3 w-3 text-ink-4" />
        <Link
          href={`/projects/${projectId}`}
          className="transition-colors hover:text-ink"
        >
          {projectName}
        </Link>
        <ChevronRight className="h-3 w-3 text-ink-4" />
        <span className="font-medium text-ink">Notifications</span>
      </nav>

      {/* Title */}
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
        In-app notifications
      </h1>
      <p className="mt-1 text-sm text-ink-3">
        Per-user feeds and read state.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:grid lg:grid-cols-[340px_1fr]">
        {/* User list */}
        <aside className="border-border max-lg:border-b lg:border-r">
          <div className="p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
              <input
                type="search"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search user_id…"
                aria-label="Search inboxes"
                className="h-10 w-full rounded-lg border border-border-strong bg-card pl-9 pr-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
            </div>
          </div>

          {users === null && (
            <div className="flex flex-col items-center gap-3 px-6 py-14">
              <LoaderCircle className="h-5 w-5 animate-spin text-ink-3" />
              <p className="text-sm text-ink-3">Loading…</p>
            </div>
          )}

          {users && users.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <BellDot className="h-6 w-6 text-ink-3" />
              <p className="text-sm text-ink-2">No users yet</p>
              <p className="text-xs text-ink-3">
                Send an event with the in-app channel enabled
              </p>
            </div>
          )}

          {Array.isArray(users) && users.length > 0 && (
            <>
              {visibleUsers && visibleUsers.length === 0 && (
                <p className="px-4 py-8 text-center text-xs text-ink-3">
                  No inboxes match “{userQuery}”.
                </p>
              )}
              <ul>
                {(visibleUsers ?? users).map((u) => {
                  const active = u.user_id === userId
                  const name = u.display_name || u.user_id
                  return (
                    <li
                      key={u.user_id}
                      className="border-b border-border/50 last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setLoading(true)
                          setUserId(u.user_id)
                          setExpandedId(null)
                        }}
                        className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors ${
                          active ? 'bg-copper-tint/50' : 'hover:bg-surface-2/60'
                        }`}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink font-mono text-[11px] font-semibold text-white">
                          {initials(u.display_name || u.user_id)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {name}
                          </span>
                          {u.display_name && (
                            <span className="mt-0.5 block truncate font-mono text-[11px] text-ink-3">
                              {u.user_id}
                            </span>
                          )}
                        </span>
                        {u.unread_count > 0 && (
                          <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-failure px-1.5 font-mono text-[10px] font-semibold tabular-nums text-white">
                            {u.unread_count}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </aside>

        {/* Feed */}
        <section className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-semibold text-ink">
                {activeName || 'Notifications'}
              </h2>
              {userId && (
                <p className="mt-0.5 truncate font-mono text-[11px] text-ink-3">
                  {userId}
                </p>
              )}
            </div>
            {notifs && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={markingAll || notifs.unread_count === 0}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border-strong bg-card px-3.5 py-2 text-xs font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-default disabled:opacity-50"
              >
                <CircleCheck className="h-3.5 w-3.5" />
                {markingAll ? 'Marking…' : 'Mark all read'}
              </button>
            )}
          </div>

          {loading && (
            <div className="flex flex-col items-center gap-3 px-6 py-16">
              <LoaderCircle className="h-5 w-5 animate-spin text-ink-3" />
              <p className="text-sm text-ink-3">Loading…</p>
            </div>
          )}

          {!loading && !error && Array.isArray(users) && users.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-ink-2">No users yet</p>
              <p className="text-xs text-ink-3">
                Send an event with the in-app channel enabled
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
              <p className="text-sm text-failure">{error}</p>
              <button
                type="button"
                onClick={() => userId && fetchNotifications(userId)}
                className="cursor-pointer rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && notifs && notifs.notifications.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-ink-2">
                No notifications for {userId}
              </p>
              <p className="text-xs text-ink-3">
                Send an event with the in-app channel enabled
              </p>
            </div>
          )}

          {!loading && !error && notifs && notifs.notifications.length > 0 && (
            <ul>
              {notifs.notifications.map((n) => {
                const expanded = expandedId === n.id
                const hasPayload =
                  n.payload && Object.keys(n.payload).length > 0
                return (
                  <li
                    key={n.id}
                    className={`border-b border-border/50 px-5 py-4 last:border-b-0 ${
                      !n.read ? 'bg-copper-tint/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          n.read ? 'bg-ink-3' : 'bg-copper'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRowClick(n)}
                        className="min-w-0 flex-1 cursor-pointer text-left"
                      >
                        <span className="flex items-baseline justify-between gap-4">
                          <span className="truncate text-sm font-semibold text-ink">
                            {n.title}
                          </span>
                          <span className="shrink-0 whitespace-nowrap font-mono text-[11px] tabular-nums text-ink-3">
                            {timeAgo(n.created_at)} ago
                          </span>
                        </span>
                        {n.body && (
                          <span className="mt-1 block text-sm leading-relaxed text-ink-2">
                            {n.body}
                          </span>
                        )}
                        {hasPayload && (
                          <span className="mt-2 inline-flex items-center gap-1 text-xs text-ink-3 transition-colors hover:text-ink">
                            {expanded ? 'Hide payload' : 'View payload'}
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform ${
                                expanded ? 'rotate-180' : ''
                              }`}
                            />
                          </span>
                        )}
                      </button>
                    </div>
                    {expanded && hasPayload && (
                      <pre className="mt-3 overflow-auto rounded-xl bg-code-surface p-4 font-mono text-xs leading-6 text-code-foreground">
                        {JSON.stringify(n.payload, null, 2)}
                      </pre>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}