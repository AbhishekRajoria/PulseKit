import { ApiResponse, Event } from "@/types";

const badgeColors: Record<Event["status"], string> = {
  delivered: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  rate_limited: "bg-orange-100 text-orange-700",
};

export async function Events() {
  const res = await fetch("http://localhost:3000/api/events");
  const events: ApiResponse<Event[]> = await res.json();

  if (!events.data) {
    return <div>No Events Found</div>;
  }

  return (
    <main className="max-w-5xl  mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Event</h1>

      <table className="mt-6 w-full border-collapse text-left text-sm">
        <thead className="">
          <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-medium">Event Name</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Channel</th>
            <th className="px-4 py-3 font-medium">Received At</th>
          </tr>
        </thead>
        <tbody>
          {events.data.map((e) => {
            return (
              <tr
                key={e.id}
                className="border-b border-gray-100 hover:bg-gray-50 "
              >
                <td className="px-4 py-3 font-medium ">{e.eventName}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColors[e.status]}`}
                  >
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm capitalize text-gray-500">
                  {e.channel}
                </td>
                <td className="text-xs">
                  {new Date(e.receivedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}

export default Events;
