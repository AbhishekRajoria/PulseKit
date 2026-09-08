export const dynamic = "force-dynamic";
import { ApiResponse, DeliveryLog, Event } from "@/types";
import { LiveFeed } from "@/app/components/LiveFeed";

const statusStyles: Record<DeliveryLog["status"], string> = {
  delivered: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-700",
  rate_limited: "bg-orange-50 text-orange-700",
  deduplicated: "bg-gray-100 text-gray-600",
};

const statusDots: Record<DeliveryLog["status"], string> = {
  delivered: "bg-emerald-500",
  failed: "bg-red-500",
  pending: "bg-amber-500",
  rate_limited: "bg-orange-500",
  deduplicated: "bg-gray-400",
};

const channelStyles: Record<DeliveryLog["channel"], string> = {
  email: "bg-violet-50 text-violet-700",
  slack: "bg-teal-50 text-teal-700",
  webhook: "bg-sky-50 text-sky-700",
  inapp: "bg-indigo-50 text-indigo-700",
};

export default async function EventsPage() {
  const res = await fetch(`${process.env.API_URL}/api/v1/events`, {
    headers: { Authorization: `Bearer ${process.env.API_KEY}` },
  });
  const events: ApiResponse<Event[]> = await res.json();

  const total = events.data?.length ?? 0;
  const delivered = events.data?.filter(
    (e) => e.logs[e.logs.length - 1]?.status === "delivered",
  ).length ?? 0;
  const failed = events.data?.filter(
    (e) => e.logs[e.logs.length - 1]?.status === "failed",
  ).length ?? 0;
  const pending = events.data?.filter((e) => !e.logs.length).length ?? 0;

  const stats = [
    { label: "Total Events", value: total, color: "text-gray-900" },
    { label: "Delivered", value: delivered, color: "text-emerald-600" },
    { label: "Failed", value: failed, color: "text-red-600" },
    { label: "Pending", value: pending, color: "text-amber-600" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Events
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} event{total !== 1 ? "s" : ""} processed
        </p>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {s.label}
            </p>
            <p className={`mt-2 text-3xl font-bold tabular-nums ${s.color}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Live Feed */}
      {events.data?.[0]?.project_id && (
        <LiveFeed projectId={events.data[0].project_id} />
      )}

      {/* Event table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Event stream</h2>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {total} total
          </span>
        </div>

        {!events.data ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">No events yet</p>
            <p className="text-xs text-gray-500">Send your first event to see the delivery pipeline</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Event</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 hidden sm:table-cell">User</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 hidden md:table-cell">Channel</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 hidden lg:table-cell">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.data.map((e) => {
                  const lastLog = e.logs[e.logs.length - 1];
                  return (
                    <tr key={e.id} className="transition-colors hover:bg-gray-50/80">
                      <td className="px-5 py-3.5">
                        <a href={`/events/${e.id}`} className="cursor-pointer font-medium text-gray-900 hover:underline">
                          {e.event_name}
                        </a>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500 hidden sm:table-cell">
                        {e.user_id}
                      </td>
                      <td className="px-5 py-3.5">
                        {lastLog ? (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[lastLog.status]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusDots[lastLog.status]}`} aria-hidden="true" />
                            {lastLog.status}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        {lastLog ? (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${channelStyles[lastLog.channel]}`}>
                            {lastLog.channel}
                            {e.logs.length > 1 && (
                              <span className="ml-1 text-gray-400">×{e.logs.length}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs tabular-nums text-gray-500 whitespace-nowrap hidden lg:table-cell">
                        {e.received_at
                          ? new Date(e.received_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
