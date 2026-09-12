export const dynamic = "force-dynamic";
import { fetchApi } from "@/lib/api";
import { ApiResponse, Event } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PayloadBlock } from "@/app/components/PayloadBlock";

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

export default async function ProjectEventDetailPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id: projectId, eventId } = await params;

  const res = await fetchApi(
    `/api/v1/events/${eventId}?project_id=${projectId}`,
  );

  if (!res.ok) notFound();

  const response: ApiResponse<Event> = await res.json();
  const event = response.data;
  if (!event) notFound();

  const lastLog = event.logs[event.logs.length - 1];
  const status = lastLog?.status ?? "pending";
  const channel = lastLog?.channel ?? "—";

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href={`/projects/${projectId}/events`}
        className="group inline-flex cursor-pointer items-center gap-1.5 text-sm text-ink-4 hover:text-ink"
      >
        <svg
          className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to events
      </Link>

      <div className="card mt-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h1 className="text-[1.25rem] font-semibold text-ink">
              {event.event_name}
            </h1>
            <p className="mt-1 font-mono text-[13px] text-ink-4">{event.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusText[status] ?? "text-ink-4"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot[status] ?? "bg-ink-4"}`} />
              {status}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-ink-4 capitalize">
              {channel}
            </span>
          </div>
        </div>

        {/* Meta + Payload */}
        <div className="space-y-6 px-6 py-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-ink-3">User</p>
              <p className="font-mono text-[13px] text-ink">{event.user_id}</p>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-ink-3">Received</p>
              <p className="text-sm text-ink">
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
            <PayloadBlock payload={event.payload} />
          )}
        </div>
      </div>

      {/* Delivery logs */}
      {event.logs.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <p className="text-[11px] font-medium text-ink-3">Delivery log</p>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-ink-4">
              {event.logs.length}
            </span>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-[11px] font-medium text-ink-3">Channel</th>
                    <th className="px-5 py-3 text-[11px] font-medium text-ink-3">Status</th>
                    <th className="px-5 py-3 text-[11px] font-medium text-ink-3">Attempt</th>
                    <th className="hidden px-5 py-3 text-[11px] font-medium text-ink-3 sm:table-cell">Error</th>
                    <th className="hidden px-5 py-3 text-[11px] font-medium text-ink-3 md:table-cell">Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {event.logs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-gray-50/80">
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-ink-4 capitalize">
                          {log.channel}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusText[log.status] ?? "text-ink-4"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusDot[log.status] ?? "bg-ink-4"}`} />
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-ink-3">
                        {log.attempt_number}
                      </td>
                      <td className="hidden px-5 py-3 font-mono text-xs text-red-600 sm:table-cell">
                        {log.error_message ?? (
                          <span className="text-ink-4">&mdash;</span>
                        )}
                      </td>
                      <td className="hidden whitespace-nowrap px-5 py-3 text-xs tabular-nums text-ink-4 md:table-cell">
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
        </div>
      )}
    </div>
  );
}
