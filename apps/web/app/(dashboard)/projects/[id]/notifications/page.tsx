"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ApiResponse, Notification } from "@/types";

type NotificationsResponse = {
  notifications: Notification[];
  unread_count: number;
};

type UserWithNotifications = {
  user_id: string;
  unread_count: number;
  last_notification_at: string;
};

export default function NotificationsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [users, setUsers] = useState<UserWithNotifications[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifs, setNotifs] = useState<NotificationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/notifications/users?project_id=${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data.data) ? data.data : [];
          setUsers(list);
          if (list.length > 0 && !userId) {
            setUserId(list[0].user_id);
          } else if (list.length === 0) {
            setLoading(false);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUsers([]);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [projectId, userId]);

  const fetchNotifications = useCallback(async (uid: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications/project/${projectId}/user/${uid}`);
      const data: ApiResponse<NotificationsResponse> = await res.json();
      if (!data.success || !data.data) {
        setError(data.error ?? "Failed to load notifications");
        setNotifs(null);
      } else {
        setNotifs(data.data);
      }
    } catch {
      setError("Failed to load notifications");
      setNotifs(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!userId) return;
    const id = setTimeout(() => fetchNotifications(userId), 0);
    return () => clearTimeout(id);
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(async (n: Notification) => {
    if (n.read) return;
    const res = await fetch(`/api/notifications/${n.id}/read?project_id=${projectId}`, { method: "PATCH" });
    const data: ApiResponse<Notification> = await res.json();
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
      );
      setUsers((prev) =>
        prev
          ? prev.map((u) =>
              u.user_id === n.user_id
                ? { ...u, unread_count: Math.max(0, u.unread_count - 1) }
                : u,
            )
          : prev,
      );
    }
  }, [projectId]);

  const markAllAsRead = useCallback(async () => {
    if (!notifs || notifs.unread_count === 0 || markingAll || !userId) return;
    setMarkingAll(true);
    try {
      const res = await fetch(`/api/notifications/read-all?project_id=${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data: ApiResponse<{ count: number }> = await res.json();
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
        );
        setUsers((prev) =>
          prev
            ? prev.map((u) =>
                u.user_id === userId ? { ...u, unread_count: 0 } : u,
              )
            : prev,
        );
      }
    } finally {
      setMarkingAll(false);
    }
  }, [notifs, markingAll, userId, projectId]);

  const handleRowClick = (n: Notification) => {
    setExpandedId((prev) => (prev === n.id ? null : n.id));
    markAsRead(n);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div>
        <h1 className="text-[1.25rem] font-semibold text-ink">Notifications</h1>
        <p className="mt-1 text-sm text-ink-3">
          In-app messages delivered to end users.
        </p>
      </div>

      {/* User pill selector — dynamic from API */}
      <div className="mt-5 flex items-center gap-2">
        <span className="text-[11px] font-medium text-ink-4">Show inbox for:</span>
        {users === null && (
          <span className="text-xs text-ink-4">Loading…</span>
        )}
        {users && users.length === 0 && (
          <span className="text-xs text-ink-4">No users yet</span>
        )}
        {Array.isArray(users) && users.map((u) => (
          <button
            key={u.user_id}
            type="button"
            onClick={() => {
              setLoading(true);
              setUserId(u.user_id);
              setExpandedId(null);
            }}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              u.user_id === userId
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-ink-2 hover:bg-gray-200"
            }`}
          >
            {u.user_id}
            {u.unread_count > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] tabular-nums">
                {u.unread_count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="card mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-medium text-ink-3">
              {notifs
                ? `${notifs.notifications.length} notification${notifs.notifications.length !== 1 ? "s" : ""}`
                : "Notifications"}
            </h2>
            {notifs && notifs.unread_count > 0 && (
              <span className="inline-flex items-center rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white tabular-nums">
                {notifs.unread_count} unread
              </span>
            )}
          </div>
          {notifs && notifs.unread_count > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markingAll}
              className="cursor-pointer text-xs text-ink-4 transition-colors hover:text-ink-2 disabled:opacity-50 disabled:cursor-default"
            >
              {markingAll ? "Marking…" : "Mark all read"}
            </button>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 px-6 py-16">
            <svg className="h-5 w-5 animate-spin text-ink-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-ink-4">Loading…</p>
          </div>
        )}

        {!loading && !error && Array.isArray(users) && users.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="text-sm text-ink-4">No users yet</p>
            <p className="text-xs text-ink-4">
              Send an event with the in-app channel enabled
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <p className="text-sm text-ink-4">{error}</p>
            <button
              type="button"
              onClick={() => userId && fetchNotifications(userId)}
              className="cursor-pointer rounded-[6px] border border-gray-200 px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && notifs && notifs.notifications.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="text-sm text-ink-4">
              No notifications for {userId}
            </p>
            <p className="text-xs text-ink-4">
              Send an event with the in-app channel enabled
            </p>
          </div>
        )}

        {!loading && !error && notifs && notifs.notifications.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {notifs.notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleRowClick(n)}
                  className={`group flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50/80 ${
                    !n.read ? "border-l-2 border-l-emerald-500 bg-gray-50/50" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-4">
                      <span
                        className={`truncate text-sm ${
                          n.read
                            ? "font-normal text-ink-3"
                            : "font-medium text-ink"
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-ink-4 whitespace-nowrap">
                        {new Date(n.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </span>
                    {n.body && expandedId === n.id && (
                      <span className="mt-1.5 block text-sm leading-relaxed text-ink-2">
                        {n.body}
                      </span>
                    )}
                  </span>

                  <svg
                    className={`mt-1 h-4 w-4 shrink-0 text-ink-4 transition-transform ${
                      expandedId === n.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
