"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse, Notification } from "@/types";

const USERS = ["user_123", "user_456", "user_789"];

type NotificationsResponse = {
  notifications: Notification[];
  unread_count: number;
};

export default function NotificationsPage() {
  const [userId, setUserId] = useState(USERS[0]);
  const [notifs, setNotifs] = useState<NotificationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/notifications/${id}`);
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
  }, []);

  useEffect(() => {
    const id = setTimeout(() => fetchNotifications(userId), 0);
    return () => clearTimeout(id);
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(async (n: Notification) => {
    if (n.read) return;
    const res = await fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" });
    const data: ApiResponse<Notification> = await res.json();
    if (data.success && data.data) {
      setNotifs((prev) =>
        prev
          ? {
              notifications: prev.notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
              unread_count: Math.max(0, prev.unread_count - 1),
            }
          : prev,
      );
    }
  }, []);

  const handleRowClick = (n: Notification) => {
    setExpandedId((prev) => (prev === n.id ? null : n.id));
    markAsRead(n);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">In-app messages delivered to an end user.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            id="user"
            value={userId}
            onChange={(e) => { setLoading(true); setUserId(e.target.value); setExpandedId(null); }}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 focus:border-gray-400 focus:outline-none"
          >
            {USERS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            {notifs ? `${notifs.notifications.length} notification${notifs.notifications.length !== 1 ? "s" : ""}` : "Notifications"}
          </h2>
          {notifs && notifs.unread_count > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">
              {notifs.unread_count} unread
            </span>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 px-6 py-16">
            <svg className="h-6 w-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-500">Loading notifications…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">{error}</p>
            <button type="button" onClick={() => fetchNotifications(userId)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && notifs && notifs.notifications.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">No notifications for {userId}</p>
            <p className="text-xs text-gray-500">Send an event with the in-app channel enabled</p>
          </div>
        )}

        {!loading && !error && notifs && notifs.notifications.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {notifs.notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleRowClick(n)}
                  className={`flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-gray-50 ${!n.read ? "bg-gray-50/50" : ""}`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-gray-200" : "bg-gray-900"}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={`truncate text-sm font-medium ${n.read ? "text-gray-500" : "text-gray-900"}`}>{n.title}</span>
                      <span className="shrink-0 text-xs tabular-nums text-gray-400 whitespace-nowrap">
                        {new Date(n.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </span>
                    {n.body && expandedId === n.id && (
                      <span className="mt-1.5 block text-sm text-gray-600">{n.body}</span>
                    )}
                  </span>
                  <svg
                    className={`mt-1 h-4 w-4 shrink-0 text-gray-300 transition-transform ${expandedId === n.id ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"
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
