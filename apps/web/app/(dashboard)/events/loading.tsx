export default function EventsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-24 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-8 w-10 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-5 py-3.5"><div className="h-4 w-32 animate-pulse rounded bg-gray-200" /></td>
                <td className="px-5 py-3.5"><div className="h-4 w-20 animate-pulse rounded bg-gray-200" /></td>
                <td className="px-5 py-3.5"><div className="h-5 w-16 animate-pulse rounded bg-gray-200" /></td>
                <td className="px-5 py-3.5"><div className="h-5 w-14 animate-pulse rounded bg-gray-200" /></td>
                <td className="px-5 py-3.5"><div className="h-4 w-28 animate-pulse rounded bg-gray-200" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
