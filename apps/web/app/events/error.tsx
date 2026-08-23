"use client";

export default function Events({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  }) {

  return (
    <main className="max-w-5xl  mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Event</h1>

      <table className="mt-6 w-full border-collapse text-left text-sm">
        <thead className="">
          <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-medium ">Event Name</th>
            <th className="px-4 py-3 font-medium ">Status</th>
            <th className="px-4 py-3 font-medium ">Channel</th>
            <th className="px-4 py-3 font-medium ">Received At</th>
          </tr>
        </thead>
      </table>
      <div className="flex flex-col items-center py-10 bg-gray-100 font-bold ">
        <span>Error Loading Data</span>
        <span>{error.message}</span>
        <button
          onClick={() => reset()}
          className="bg-gray-400 hover:bg-gray-300 hover:px-1.5  w-fit px-2 py-1 rounded-sm"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
