export default function EventsLoading() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div>
        <div className="h-8 w-32 rounded bg-gray-100 animate-pulse" />
        <div className="mt-1 h-4 w-24 rounded bg-gray-100 animate-pulse" />
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
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-gray-100" /></td>
                <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-gray-100" /></td>
                <td className="px-4 py-3"><div className="h-5 w-16 rounded bg-gray-100" /></td>
                <td className="px-4 py-3"><div className="h-5 w-14 rounded bg-gray-100" /></td>
                <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-gray-100" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
