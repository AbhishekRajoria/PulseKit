export const dynamic = "force-dynamic";
import { fetchApi } from "@/lib/api";
import { ApiResponse, Event } from "@/types";
import { LiveFeed } from "@/app/components/LiveFeed";
import { EventsList } from "@/app/components/EventsList";
import Link from "next/link";

const apiUrl = (process.env.API_URL ?? "http://localhost:8080").replace(/\/$/, "");

export default async function ProjectEventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  const res = await fetchApi(`/api/v1/events?project_id=${projectId}`);
  const data: ApiResponse<Event[]> = await res.json();
  const events = data.data ?? [];

  const total = events.length;
  const delivered = events.filter((e) => e.logs[e.logs.length - 1]?.status === "delivered").length;
  const failed = events.filter((e) => e.logs[e.logs.length - 1]?.status === "failed").length;
  const pending = events.filter((e) => !e.logs.length).length;

  const curlSnippet = `curl -X POST ${apiUrl}/api/v1/events \\
  -H "Authorization: Bearer $PULSEKIT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"event_name":"payment.failed","user_id":"user_123","payload":{"amount":9900,"currency":"INR"}}'`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link
        href={`/projects/${projectId}`}
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
        Project overview
      </Link>

      <div className="mt-6">
        <h1 className="text-[1.25rem] font-semibold text-ink">Events</h1>
        <p className="mt-1 text-sm text-ink-3">
          {total} event{total !== 1 ? "s" : ""} processed
        </p>
      </div>

      {events.length === 0 ? (
        /* Empty state — a fresh project's first surface a reviewer sees */
        <div className="mt-10">
          <div className="card overflow-hidden">
            <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <svg className="h-8 w-8 text-ink-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-ink">No events yet</p>
                <p className="mt-1 text-xs text-ink-4">
                  Send your first event and it will appear here in real time.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 px-6 py-5">
              <p className="text-[11px] font-medium text-ink-3">
                Quick start — send an event with curl
              </p>
              <pre className="mt-2 overflow-x-auto rounded-[10px] border border-gray-200 bg-surface-2 p-4 font-mono text-[13px] leading-relaxed text-ink-2">
                {curlSnippet}
              </pre>
              <p className="mt-3 text-xs text-ink-4">
                Get your API key from{" "}
                <Link
                  href={`/projects/${projectId}`}
                  className="cursor-pointer font-medium text-ink-3 underline underline-offset-2 hover:text-ink"
                >
                  Project overview
                </Link>
                , then send.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stat cards — Total gets headline size, others secondary */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="card">
              <p className="text-[11px] font-medium text-ink-3">Total events</p>
              <p className="mt-2 text-[36px] font-bold leading-none tabular-nums text-ink">
                {total.toLocaleString()}
              </p>
            </div>
            <div className="card">
              <p className="text-[11px] font-medium text-ink-3">Delivered</p>
              <p className="mt-2 text-[24px] font-bold leading-none tabular-nums text-emerald-600">
                {delivered.toLocaleString()}
              </p>
            </div>
            <div className="card">
              <p className="text-[11px] font-medium text-ink-3">Failed</p>
              <p className="mt-2 text-[24px] font-bold leading-none tabular-nums text-red-600">
                {failed.toLocaleString()}
              </p>
            </div>
            <div className="card">
              <p className="text-[11px] font-medium text-ink-3">Pending</p>
              <p className="mt-2 text-[24px] font-bold leading-none tabular-nums text-ink-4">
                {pending.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Live feed */}
          {events[0]?.project_id && (
            <LiveFeed projectId={events[0].project_id} />
          )}

          {/* Events table with search */}
          <div className="mt-6">
            <EventsList events={events} projectId={projectId} />
          </div>
        </>
      )}
    </div>
  );
}