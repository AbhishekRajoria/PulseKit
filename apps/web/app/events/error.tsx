"use client";

export default function EventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Events</h1>
      <div className="mt-12 flex flex-col items-center gap-4 rounded-lg border border-red-100 bg-red-50/50 py-12">
        <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Failed to load events</p>
          <p className="mt-1 text-xs text-gray-500">{error.message}</p>
        </div>
        <button
          onClick={() => reset()}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
