import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight">PulseKit</h1>
        <p className="mt-3 text-gray-500">
          Notification infrastructure for developers. One API call to send
          alerts across email, SMS, and push.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/events"
            className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            View Events
          </Link>
          <a
            href="https://github.com/AbhishekRajoria/PulseKit"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
