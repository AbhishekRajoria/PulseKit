export const dynamic = 'force-dynamic'
import { fetchApi } from '@/lib/api'
import type { ApiResponse, Project, ProjectStats } from '@/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Micro } from '@/app/components/Primitives'
import { CodeBlock } from './code-block'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const res = await fetchApi(`/api/v1/projects/${id}`)
  if (!res.ok) return { title: 'Project' }
  const data = (await res.json()) as ApiResponse<Project>
  const name = data.data?.name
  return {
    title: name ? `${name} — project` : 'Project',
    description: name
      ? `Project ${name} — API key, events, and delivery notifications.`
      : 'PulseKit project overview.',
  }
}

const apiUrl = (process.env.API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const res = await fetchApi(`/api/v1/projects/${id}`)

  if (!res.ok) notFound()

  const response: ApiResponse<Project> = await res.json()
  const project = response.data
  if (!project) notFound()

  const statsRes = await fetchApi(`/api/v1/projects/${id}/stats`)
  const stats: ProjectStats | null = statsRes.ok
    ? ((await statsRes.json()) as ApiResponse<ProjectStats>).data ?? null
    : null

  const hasSignal = (stats?.event_count ?? 0) > 0

  const curlSnippet = `curl -X POST ${apiUrl}/api/v1/events \\
  -H "Authorization: Bearer $PULSEKIT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event_name": "invoice.paid",
    "user_id": "usr_4f91",
    "payload": { "amount": 2400, "currency": "USD" }
  }'`

  const sdkSnippet = `import PulseKit from 'pulsekit';

const pulsekit = new PulseKit(process.env.PULSEKIT_API_KEY);

await pulsekit.events.track({
  event_name: 'invoice.paid',
  user_id: 'usr_4f91',
  payload: { amount: 2400, currency: 'USD' },
});`

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-3">
        <Link href="/projects" className="inline-flex items-center gap-1 hover:text-ink transition-colors">
          <ArrowLeft className="h-3 w-3" />
          Projects
        </Link>
        <span className="text-ink-4">/</span>
        <span className="font-medium text-ink">{project.name}</span>
      </nav>

      {/* Title row */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {project.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums text-ink-2">
            <span>{project.id}</span>
            <span className="text-ink-3">·</span>
            <span>{project.rate_limit_per_min} req/min</span>
            <span className="text-ink-3">·</span>
            <span>
              created{' '}
              {new Date(project.created_at).toLocaleDateString('en-IN', {
                dateStyle: 'medium',
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${id}/events`}
            prefetch
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2 hover:text-ink"
          >
            View events
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/projects/${id}/notifications`}
            prefetch
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2 hover:text-ink"
          >
            View notifications
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Stats — compact cards, left aligned */}
      <div className="mt-6 flex flex-col gap-5 sm:flex-row">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:w-[380px]">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="pr-5">
              <Micro>Events</Micro>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
                {stats ? stats.event_count.toLocaleString('en-IN') : '0'}
              </div>
            </div>
            <div className="pl-5">
              <Micro>Notifications</Micro>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
                {stats ? stats.notification_count.toLocaleString('en-IN') : '0'}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:w-[180px]">
          <Micro>Users</Micro>
          <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
            {stats ? stats.unique_users.toLocaleString('en-IN') : '0'}
          </div>
        </div>
      </div>

      {/* Send a test event */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col justify-between gap-6 lg:flex-row">
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-copper opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-copper" />
              </span>
              <span className="text-xs font-medium text-copper">
                {hasSignal ? 'Live' : 'Awaiting first signal'}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-ink">
              Send a test event
            </h2>
            <p className="mt-2 text-sm text-ink-2">
              Your live listener is connected. Send this request and the event
              appears in the feed within about 2 seconds.
            </p>
            <div className="mt-5 space-y-3 text-sm">
              {[
                'Copy your API key',
                'Send the request',
                'Inspect the delivery log',
              ].map((step, i) => (
                <div className="flex items-center gap-2" key={step}>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface-2 font-mono text-[10px] leading-none tabular-nums text-ink-2">
                    {i + 1}
                  </span>
                  <span className="text-ink-2">{step}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="min-w-0 flex-1 lg:max-w-2xl">
            <CodeBlock code={curlSnippet} sdkCode={sdkSnippet} />
          </div>
        </div>
      </div>

    </div>
  )
}
