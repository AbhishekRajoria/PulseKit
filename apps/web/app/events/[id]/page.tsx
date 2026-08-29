import { ApiResponse, DeliveryLog, Event } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";

const statusStyles: Record<DeliveryLog["status"], string> = {
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  failed: "bg-red-50 text-red-700 ring-red-600/20",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  rate_limited: "bg-orange-50 text-orange-700 ring-orange-600/20",
  deduplicated: "bg-gray-50 text-gray-700 ring-gray-600/20",
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

  if (!res.ok) {
    notFound();
  }

  const response: ApiResponse<Event> = await res.json();
  const event = response.data;

  if (!event) {
    notFound();
  }

  const lastLog = event.logs[event.logs.length - 1];

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        Back to events
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {event.event_name}
            </h1>
            <p className="mt-1 text-xs text-gray-400 font-mono">{event.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${lastLog ? statusStyles[lastLog.status] : ""}`}
            >
              {lastLog ? lastLog.status : "—"}
            </span>
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${lastLog ? channelStyles[lastLog.channel] : ""} `}
            >
              {lastLog ? lastLog.channel : "—"}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                User
              </p>
              <p className="text-sm font-mono text-gray-900">{event.user_id}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Received
              </p>
              <p className="text-sm text-gray-900">
                {event.received_at
                  ? new Date(event.received_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </p>
            </div>
          </div>

          {event.payload && Object.keys(event.payload).length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
                Payload
              </p>
              <div className="rounded-md bg-gray-50 border border-gray-100 p-4">
                <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
      {event.logs.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
            Delivery Logs ({event.logs.length})
          </p>
          <div className="overflow-hidden rounded-md border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Channel
                  </th>
                  <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Attempt
                  </th>
                  <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Error
                  </th>
                  <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Delivered
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {event.logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${channelStyles[log.channel]}`}
                      >
                        {log.channel}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[log.status]}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{log.attempt_number}</td>
                    <td className="px-4 py-2 text-red-600">
                      {log.error_message ?? "—"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                      {new Date(log.delivered_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
