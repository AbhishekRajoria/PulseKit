export const dynamic = "force-dynamic";
import { fetchApi } from "@/lib/api";
import { ApiResponse, Event } from "@/types";
import { LiveFeed } from "@/app/components/LiveFeed";
import { EventsList } from "@/app/components/EventsList";
import Link from "next/link";

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
    </div>
  );
}
