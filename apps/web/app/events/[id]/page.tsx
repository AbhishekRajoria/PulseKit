import { ApiResponse, Event } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";

const statusStyles: Record<Event["status"], string> = {
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  failed: "bg-red-50 text-red-700 ring-red-600/20",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  sent: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

const channelStyles: Record<Event["channel"], string> = {
  email: "bg-violet-50 text-violet-700",
  sms: "bg-teal-50 text-teal-700",
  push: "bg-sky-50 text-sky-700",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await fetch(`${process.env.API_URL}/api/events/${id}`);

  if (!res.ok) {
    notFound();
  }

  const response: ApiResponse<Event> = await res.json();
  const event = response.data;

  if (!event) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <Link href="/events" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to events
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{event.event}</h1>
            <p className="mt-1 text-xs text-gray-400 font-mono">{event.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[event.status]}`}>
              {event.status}
            </span>
            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${channelStyles[event.channel]}`}>
              {event.channel}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">User</p>
              <p className="text-sm font-mono text-gray-900">{event.user_id}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">Received</p>
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
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Payload</p>
              <div className="rounded-md bg-gray-50 border border-gray-100 p-4">
                <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
