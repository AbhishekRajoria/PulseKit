'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BellDot, CheckCheck, ChevronDown, LoaderCircle } from 'lucide-react'
import type { ApiResponse, Notification } from '@/types'

type NotificationsResponse = {
  notifications: Notification[]
  unread_count: number
}

type UserWithNotifications = {
  user_id: string
  unread_count: number
  last_notification_at: string
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
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mt-6 flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Notifications
        </h1>
        <span className="pill bg-surface-2 text-ink-3">
          In-app · WebSocket
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-3">
        In-app messages delivered to end users.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card lg:grid lg:grid-cols-[256px_1fr]">
        {/* User list */}
        <aside className="h-fit overflow-hidden border-r border-border bg-canvas/40 lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              Inboxes
            </h2>
            {users && (
              <span className="pill bg-surface-2 font-mono text-ink-3">
                {users.length}
              </span>
            )}
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
            <ul className="divide-y divide-border">
              {users.map((u) => {
                const active = u.user_id === userId
                const lastAgo = u.last_notification_at
                  ? timeAgo(u.last_notification_at)
                  : '—'
                return (
                  <li key={u.user_id}>
                    <button
                      type="button"
                      onClick={() => {
                        setLoading(true)
                        setUserId(u.user_id)
                        setExpandedId(null)
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 border-l-2 px-4 py-3.5 text-left transition-colors ${
                        active
                          ? 'border-l-copper bg-card'
                          : 'border-l-transparent hover:bg-surface-2'
                      }`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 font-mono text-[10px] font-semibold text-ink-2">
                        {u.user_id.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-xs text-ink">
                          {u.user_id}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-ink-3">
                          last {lastAgo}
                        </span>
                      </span>
                      {u.unread_count > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-copper px-1.5 font-mono text-[10px] font-semibold tabular-nums text-white">
                          {u.unread_count}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>

        {/* Feed */}
        <section className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <h2 className="truncate text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                {notifs
                  ? `${notifs.notifications.length} ${notifs.notifications.length === 1 ? 'notification' : 'notifications'}`
                  : 'Notifications'}
              </h2>
              {userId && (
                <code className="truncate font-mono text-[11px] text-ink-3">
                  {userId}
                </code>
              )}
              {notifs && notifs.unread_count > 0 && (
                <span className="pill bg-copper-tint font-mono text-copper tabular-nums">
                  {notifs.unread_count} unread
                </span>
              )}
            </div>
            {notifs && notifs.unread_count > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={markingAll}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-ink-3 transition-colors hover:text-ink disabled:cursor-default disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
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
            <ul className="divide-y divide-border">
              {notifs.notifications.map((n) => {
                const expanded = expandedId === n.id
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleRowClick(n)}
                      className={`group flex w-full cursor-pointer items-start gap-3 border-l-2 px-4 py-4 text-left transition-colors hover:bg-canvas ${
                        !n.read ? 'border-l-copper bg-card' : 'border-l-transparent'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-4">
                          <span
                            className={`truncate text-sm ${
                              n.read ? 'font-normal text-ink-3' : 'font-medium text-ink'
                            }`}
                          >
                            {n.title}
                          </span>
                          <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-ink-3">
                            {new Date(n.created_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </span>
                        {n.body && expanded && (
                          <span className="mt-1.5 block text-sm leading-relaxed text-ink-2">
                            {n.body}
                          </span>
                        )}
                      </span>
                      <ChevronDown
                        className={`mt-1 h-4 w-4 shrink-0 text-ink-3 transition-transform ${
                          expanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
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