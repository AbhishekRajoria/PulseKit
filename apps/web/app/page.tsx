import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-20">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">PulseKit</h1>
        <p className="mt-4 text-gray-500">
          Notification infrastructure for developers. One API call to send
          alerts across email, Slack, and in-app.
        </p>
        <div className="mt-9 flex justify-center gap-4">
          <Link
            href="/events"
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
          >
            View Events
          </Link>
          <a
            href="https://github.com/AbhishekRajoria/PulseKit"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
