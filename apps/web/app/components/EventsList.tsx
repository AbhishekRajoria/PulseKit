"use client";

import Link from "next/link";
import { useState } from "react";

type EventRow = {
  id: string;
  event_name: string;
  user_id: string;
  received_at: string;
  logs: {
    status: string;
    channel: string;
  }[];
};

const statusDot: Record<string, string> = {
  delivered: "bg-emerald-500",
  failed: "bg-red-500",
  pending: "bg-ink-4",
};

const statusText: Record<string, string> = {
  delivered: "text-emerald-600",
  failed: "text-red-600",
  pending: "text-ink-4",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function EventsList({
  events,
  projectId,
}: {
  events: EventRow[];
  projectId: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = events.filter((e) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      e.event_name.toLowerCase().includes(q) ||
      e.user_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="text-[11px] font-medium text-ink-3">All events</h2>
        <input
          type="text"
          placeholder="Search events…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-48 rounded-[6px] border border-gray-200 bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-4 focus:border-gray-300 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-[11px] font-medium text-ink-3">Event</th>
              <th className="hidden px-5 py-3 text-[11px] font-medium text-ink-3 sm:table-cell">User</th>
              <th className="px-5 py-3 text-[11px] font-medium text-ink-3">Status</th>
              <th className="hidden px-5 py-3 text-[11px] font-medium text-ink-3 md:table-cell">Channel</th>
              <th className="hidden px-5 py-3 text-[11px] font-medium text-ink-3 lg:table-cell">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((e) => {
              const lastLog = e.logs[e.logs.length - 1];
              const status = lastLog?.status ?? "pending";
              const channel = lastLog?.channel ?? "—";

              return (
                <tr key={e.id} className="transition-colors hover:bg-gray-50/80">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/projects/${projectId}/events/${e.id}`}
                      className="cursor-pointer font-mono text-[13px] font-medium text-ink hover:underline"
                    >
                      {e.event_name}
                    </Link>
                  </td>
                  <td className="hidden px-5 py-3.5 font-mono text-[13px] text-ink-3 sm:table-cell">
                    {e.user_id}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusText[status] ?? "text-ink-4"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[status] ?? "bg-ink-4"}`} />
                      {status}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3.5 md:table-cell">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-ink-4 capitalize">
                      {channel}
                      {e.logs.length > 1 && (
                        <span className="ml-1 text-ink-4">&times;{e.logs.length}</span>
                      )}
                    </span>
                  </td>
                  <td className="hidden whitespace-nowrap px-5 py-3.5 text-xs tabular-nums text-ink-4 lg:table-cell">
                    {e.received_at ? timeAgo(e.received_at) : "—"}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-ink-4">
                  No events match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
