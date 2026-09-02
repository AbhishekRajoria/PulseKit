import { ApiResponse, DeliveryLog, Event } from "@/types";
import { LiveFeed } from "@/app/components/LiveFeed";

const statusStyles: Record<DeliveryLog["status"], string> = {
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  failed: "bg-red-50 text-red-700 ring-red-600/20",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  rate_limited: "bg-orange-50 text-orange-700 ring-orange-600/20",
  deduplicated: "bg-gray-50 text-gray-700 ring-gray-600/20",
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

  if (!events.data) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Events
          </h1>
        </div>
        <div className="mt-12 flex flex-col items-center gap-3 text-gray-400">
          <svg
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
          <p className="text-sm font-medium text-gray-500">No events yet</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Events
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {events.data.length} event{events.data.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Events", value: total, color: "text-gray-900", dot: "bg-gray-400" },
          { label: "Delivered", value: delivered, color: "text-emerald-600", dot: "bg-emerald-500" },
          { label: "Failed", value: failed, color: "text-red-600", dot: "bg-red-500" },
          { label: "Pending", value: pending, color: "text-amber-600", dot: "bg-amber-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${s.dot}`}
                aria-hidden="true"
              />
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {s.label}
              </p>
            </div>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${s.color}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {events.data[0]?.project_id && (
        <LiveFeed projectId={events.data[0].project_id} />
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Event
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                User
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Channel
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Received
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.data.map((e) => {
              const lastLog = e.logs[e.logs.length - 1];
              return (
                <tr
                  key={e.id}
                  className="transition-colors hover:bg-gray-50/80"
                >
                  <td className="px-4 py-3">
                    <a
                      href={`/events/${e.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {e.event_name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {e.user_id}
                  </td>
                  <td className="px-4 py-3">
                    {lastLog ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[lastLog.status]}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusDots[lastLog.status]}`}
                          aria-hidden="true"
                        />
                        {lastLog.status}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lastLog ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${channelStyles[lastLog.channel]}`}
                      >
                        {lastLog.channel}
                        {e.logs.length > 1 && (
                          <span className="ml-1 text-gray-500">
                            ×{e.logs.length}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums text-gray-500 whitespace-nowrap">
                    {e.received_at
                      ? new Date(e.received_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
