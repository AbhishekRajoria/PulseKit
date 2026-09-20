export const dynamic = 'force-dynamic'
import { fetchApi } from '@/lib/api'
import type { ApiResponse, Project, ProjectStats } from '@/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronRight,
  Activity,
  Bell,
  Check,
  KeyRound,
} from 'lucide-react'
import { CopyButton, Micro } from '@/app/components/Primitives'
import { RevealKey } from './reveal-key'

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
  -d '{"event_name":"payment.failed","user_id":"user_123","payload":{"amount":9900,"currency":"INR"}}'`

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/projects"
        className="group inline-flex cursor-pointer items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        All projects
      </Link>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Micro>Project</Micro>
          <div className="mt-1 flex min-w-0 items-center gap-2.5">
            <h1 className="truncate text-xl font-semibold tracking-tight text-ink">
              {project.name}
            </h1>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-surface-2 py-0.5 pl-2 pr-0.5 font-mono text-[11px] text-ink-3">
              {project.id}
              <CopyButton value={project.id} />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6 sm:mt-2">
          <div>
            <Micro>Rate limit</Micro>
            <p className="mt-1 font-mono text-sm tabular-nums text-ink">
              {project.rate_limit_per_min} req/min
            </p>
          </div>
          <div>
            <Micro>Created</Micro>
            <p className="mt-1 text-sm text-ink">
              {new Date(project.created_at).toLocaleDateString('en-IN', {
                dateStyle: 'medium',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* API key — hidden by default, password-gated reveal */}
      <div className="card mt-6 overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-3">
              <KeyRound className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">
                API Key
              </p>
              <p className="text-[11px] text-ink-4">
                Hidden by default — shown once at creation, reveal with password
              </p>
            </div>
          </div>
          <span className="pill bg-success-tint font-medium text-status-delivered">
            <Check className="h-3 w-3" />
            Active
          </span>
        </div>
        <RevealKey projectId={project.id} />
      </div>

      {/* First-signal checklist until the project has received any event */}
      {!hasSignal ? (
        <div className="card mt-6 p-6">
          <h2 className="text-base font-semibold text-ink">
            Send your first signal
          </h2>
          <p className="mt-1 text-sm text-ink-3">
            Two more steps to receive your first event.
          </p>
          <ul className="mt-5">
            <li className="flex items-center gap-3 border-b border-border py-3.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success-tint text-status-delivered">
                <Check className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm text-ink">Project created &amp; API key generated</p>
            </li>
            <li className="flex flex-wrap items-center gap-3 border-b border-border py-3.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border-strong font-mono text-xs text-ink-2">
                2
              </span>
              <p className="text-sm text-ink-2">Send your first event</p>
              <span className="ml-auto">
                <CopyButton value={curlSnippet} label="Copy cURL" />
              </span>
            </li>
            <li className="flex flex-wrap items-center gap-3 py-3.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border-strong font-mono text-xs text-ink-2">
                3
              </span>
              <p className="text-sm text-ink-2">Observe it in the live feed</p>
              <Link
                href={`/projects/${id}/events`}
                prefetch
                className="ml-auto inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-copper transition-colors hover:text-ink"
              >
                Open live feed
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          </ul>
        </div>
      ) : (
        /* Quick look cards */
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href={`/projects/${id}/events`}
            prefetch
            className="group card flex items-center justify-between p-5 transition-colors hover:border-border-strong"
          >
            <div className="flex items-start gap-4">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-ink-3">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink group-hover:text-ink-2">
                  Events
                </p>
                <p className="mt-1 font-mono text-3xl font-semibold leading-none tabular-nums text-ink">
                  {stats ? stats.event_count.toLocaleString('en-IN') : '—'}
                  <span className="ml-1.5 text-sm font-normal text-ink-3">
                    total
                  </span>
                </p>
                <p className="mt-1.5 text-xs text-ink-4">
                  View event log and delivery status
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 transition-colors group-hover:text-copper" />
          </Link>

          <Link
            href={`/projects/${id}/notifications`}
            prefetch
            className="group card flex items-center justify-between p-5 transition-colors hover:border-border-strong"
          >
            <div className="flex items-start gap-4">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-ink-3">
                <Bell className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink group-hover:text-ink-2">
                  Notifications
                </p>
                <p className="mt-1 font-mono text-3xl font-semibold leading-none tabular-nums text-copper">
                  {stats ? stats.unread_count.toLocaleString('en-IN') : '—'}
                  <span className="ml-1.5 text-sm font-normal text-ink-3">
                    unread
                  </span>
                </p>
                <p className="mt-1.5 text-xs text-ink-4">
                  In-app notifications for end users
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 transition-colors group-hover:text-copper" />
          </Link>
        </div>
      )}
    </div>
  )
}