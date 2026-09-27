import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'
import type { ProjectChannels } from '@/types'

// Mirrors the worker's fan-out guards (`if (channels.email)` etc. in
// apps/api/src/workers/email.worker.ts): a channel counts as enabled only
// when its config key is present and truthy.
export function hasEnabledChannels(
  channels?: ProjectChannels | null,
): boolean {
  if (!channels) return false
  return Boolean(channels.email || channels.slack || channels.inapp)
}

export function NoChannelsBanner({ projectId }: { projectId: string }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-copper/20 bg-copper-tint px-3 py-2.5 text-sm text-copper">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        No delivery channels enabled — events will be accepted but never
        delivered.{' '}
        <Link
          href={`/projects/${projectId}/channels`}
          className="font-medium underline underline-offset-2"
        >
          Enable one in channels
        </Link>
      </span>
    </p>
  )
}
