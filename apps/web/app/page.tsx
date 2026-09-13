import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-gray-50 px-6">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        {/* Left — wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
            P
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink">
            PulseKit
          </span>
        </div>

        {/* Right — GitHub */}
        <a
          href="https://github.com/AbhishekRajoria/PulseKit"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ink-4 transition-colors hover:text-ink-2"
        >
          GitHub
        </a>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:grid-cols-2">
        {/* Left — copy */}
        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink">
            Notify your users.
            <br />
            <span className="font-mono text-[1.625rem] text-ink-3">
              one API call.
            </span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-3">
            Event notifications for developers — email, Slack, and in-app.
            Deduped. Rate-limited. Delivered with retries.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            Open the dashboard
          </Link>
        </div>

        {/* Right — code card */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <p className="text-[12px] font-medium text-ink-3">
              pulse-sdk — notify
            </p>
            <span className="pill bg-gray-100 text-ink-4">TypeScript</span>
          </div>
          <div className="p-4">
            <pre className="overflow-x-auto rounded-[10px] border border-gray-200 bg-surface-2 p-4 font-mono text-[13px] leading-relaxed text-ink-2">
              {`pulse.notify({
  event: 'payment.failed',
  user: 'user_123',
  data: { amount: 9900, currency: 'INR' }
})`}
            </pre>

            <p className="mt-3 text-xs text-ink-4">
              → email · slack · in-app — delivered with retries
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}
