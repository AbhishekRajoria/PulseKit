import { ApiResponse, DeliveryLog, Event } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";

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

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await fetch(`${process.env.API_URL}/api/v1/events/${id}`, {
    headers: { Authorization: `Bearer ${process.env.API_KEY}` },
  });

  if (!res.ok) notFound();

  const response: ApiResponse<Event> = await res.json();
  const event = response.data;
  if (!event) notFound();

  const lastLog = event.logs[event.logs.length - 1];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/events"
        className="group inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to events
      </Link>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">{event.event_name}</h1>
            <p className="mt-1 font-mono text-xs text-gray-400">{event.id}</p>
          </div>
          {lastLog && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[lastLog.status]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusDots[lastLog.status]}`} />
                {lastLog.status}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${channelStyles[lastLog.channel]}`}>
                {lastLog.channel}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">User</p>
              <p className="font-mono text-sm text-gray-900">{event.user_id}</p>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">Received</p>
              <p className="text-sm text-gray-900">
                {event.received_at
                  ? new Date(event.received_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                  : "—"}
              </p>
            </div>
          </div>

          {event.payload && Object.keys(event.payload).length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Payload</p>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <pre className="overflow-x-auto font-mono text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {event.logs.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Delivery Logs</p>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{event.logs.length}</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Channel</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Attempt</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 hidden sm:table-cell">Error</th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 hidden md:table-cell">Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {event.logs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-gray-50/80">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${channelStyles[log.channel]}`}>{log.channel}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[log.status]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusDots[log.status]}`} />
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-gray-600">{log.attempt_number}</td>
                      <td className="px-5 py-3 font-mono text-xs text-red-600 hidden sm:table-cell">
                        {log.error_message ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-xs tabular-nums whitespace-nowrap text-gray-500 hidden md:table-cell">
                        {new Date(log.delivered_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
