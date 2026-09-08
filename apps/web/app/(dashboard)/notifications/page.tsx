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
  const [markingAll, setMarkingAll] = useState(false);

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
              notifications: prev.notifications.map((x) =>
                x.id === n.id ? { ...x, read: true } : x,
              ),
              unread_count: Math.max(0, prev.unread_count - 1),
            }
          : prev,
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!notifs || notifs.unread_count === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", {
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
      }
    } finally {
      setMarkingAll(false);
    }
  }, [notifs, markingAll, userId]);

  const handleRowClick = (n: Notification) => {
    setExpandedId((prev) => (prev === n.id ? null : n.id));
    markAsRead(n);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            Notifications
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            In-app messages delivered to an end user.
          </p>
        </div>
        <select
          id="user"
          value={userId}
          onChange={(e) => {
            setLoading(true);
            setUserId(e.target.value);
            setExpandedId(null);
          }}
          className="shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:border-gray-300 focus:border-gray-400 focus:outline-none"
        >
          {USERS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* Card */}
      <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Card header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-gray-900">
              {notifs
                ? `${notifs.notifications.length} notification${notifs.notifications.length !== 1 ? "s" : ""}`
                : "Notifications"}
            </h2>
            {notifs && notifs.unread_count > 0 && (
              <span className="inline-flex items-center rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-white tabular-nums">
                {notifs.unread_count} unread
              </span>
            )}
          </div>
          {notifs && notifs.unread_count > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markingAll}
              className="cursor-pointer text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 disabled:opacity-50 disabled:cursor-default"
            >
              {markingAll ? "Marking…" : "Mark all read"}
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 px-6 py-16">
            <svg
              className="h-5 w-5 animate-spin text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm text-gray-500">Loading…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <svg
                className="h-6 w-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">{error}</p>
            <button
              type="button"
              onClick={() => fetchNotifications(userId)}
              className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && notifs && notifs.notifications.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">
              No notifications for {userId}
            </p>
            <p className="text-xs text-gray-500">
              Send an event with the in-app channel enabled
            </p>
          </div>
        )}

        {/* Notification list */}
        {!loading && !error && notifs && notifs.notifications.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {notifs.notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleRowClick(n)}
                  className={`group flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50/80 ${
                    !n.read ? "bg-gray-50" : ""
                  }`}
                >
                  {/* Unread indicator */}
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full transition-colors ${
                      n.read ? "bg-gray-200" : "bg-gray-900"
                    }`}
                    aria-hidden="true"
                  />

                  {/* Content */}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-4">
                      <span
                        className={`truncate text-sm ${
                          n.read
                            ? "font-normal text-gray-500"
                            : "font-medium text-gray-900"
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-gray-400 whitespace-nowrap">
                        {new Date(n.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </span>
                    {n.body && expandedId === n.id && (
                      <span className="mt-1.5 block text-sm leading-relaxed text-gray-600">
                        {n.body}
                      </span>
                    )}
                  </span>

                  {/* Chevron */}
                  <svg
                    className={`mt-1 h-4 w-4 shrink-0 text-gray-300 transition-transform ${
                      expandedId === n.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
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
