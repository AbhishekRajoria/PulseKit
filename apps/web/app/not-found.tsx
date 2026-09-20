import Link from 'next/link'
import { Brand } from '@/app/components/Primitives'

function TraceGraphic() {
  return (
    <svg
      viewBox="0 0 320 96"
      className="h-24 w-full max-w-xs"
      role="img"
      aria-label="Flatlined signal trace"
    >
      <g strokeWidth="1">
        <rect
          x="0.5"
          y="0.5"
          width="319"
          height="95"
          rx="6"
          className="fill-none stroke-border"
        />
        {/* Live trace — pulses, then flatlines */}
        <polyline
          className="fill-none stroke-copper"
          strokeWidth="1.5"
          points="8,48 24,48 32,24 40,60 48,40 56,52 64,48 72,48 80,48 88,48 96,48 104,48 112,48 120,48 128,48 136,48 144,48 152,48 160,48 168,48 176,48 184,48 192,48 200,48 208,48 216,48 224,48 232,48 240,48 248,48 256,48"
        />
        {/* Broken segment — flatline gap */}
        <line
          x1="264"
          y1="48"
          x2="312"
          y2="48"
          className="stroke-ink-4"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />
      </g>
    </svg>
  )
}

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-16">
      <div className="absolute left-6 top-6">
        <Brand />
      </div>

      <p className="font-mono text-[11px] uppercase tracking-widest text-copper">
        Status 404 · Signal lost
      </p>
      <div className="mt-6 w-full max-w-xs">
        <TraceGraphic />
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">
        Route unacknowledged.
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm leading-6 text-ink-3">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved elsewhere.
      </p>

      {/* Terminal diagnostic */}
      <pre className="mt-8 w-full max-w-sm overflow-x-auto rounded-lg border border-border bg-ink p-4 font-mono text-[11px] leading-relaxed text-white/90">
{`$ pulsekit resolve ${'<path>'}
404 — route unacknowledged
% Exiting with graceful degradation`}
      </pre>

      <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row">
        <Link
          href="/projects"
          className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-action-hover"
        >
          Return to Projects
        </Link>
        <Link
          href="/docs"
          className="inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          Read Documentation
        </Link>
      </div>
    </main>
  )
}