import { ApiResponse, Event } from "@/types";

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

export default async function EventsPage() {
  const res = await fetch(`${process.env.API_URL}/api/events`);
  const events: ApiResponse<Event[]> = await res.json();

  if (!events.data) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Events</h1>
        <div className="mt-12 flex flex-col items-center gap-3 text-gray-400">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="text-sm">No events yet</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="mt-1 text-sm text-gray-500">
            {events.data.length} event{events.data.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Event</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Channel</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.data.map((e) => (
              <tr key={e.id} className="transition-colors hover:bg-gray-50/80">
                <td className="px-4 py-3">
                  <a href={`/events/${e.id}`} className="font-medium text-gray-900 hover:underline">
                    {e.event}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.user_id}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[e.status]}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${channelStyles[e.channel]}`}>
                    {e.channel}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {e.received_at
                    ? new Date(e.received_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
