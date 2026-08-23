export default function Events() {
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
          {Array.from({ length: 5 }).map((_, index) => (
            <tr
              key={index}
              className="border-b bg-gray-100 border-gray-300 hover:bg-gray-50 animate-pulse "
            >
              <td className="px-4 py-3 font-medium"></td>

              <td className="px-4 py-3 text-sm text-gray-500">
                <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"></span>
              </td>

              <td className="px-4 py-3 text-sm capitalize text-gray-500"></td>

              <td className="text-xs"></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
