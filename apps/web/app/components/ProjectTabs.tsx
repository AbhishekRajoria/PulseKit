'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: `/projects`, label: 'Overview', snippet: '' },
  { href: `/projects`, label: 'Events', snippet: '/events' },
  { href: `/projects`, label: 'Notifications', snippet: '/notifications' },
  { href: `/projects`, label: 'Channels', snippet: '/channels' },
]

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname()
  const base = `/projects/${projectId}`

  const active = (snippet: string) => {
    if (snippet === '') return pathname === base
    return pathname.startsWith(base + snippet)
  }

  return (
    <nav aria-label="Project sections" className="mt-6 border-b border-border">
      <div className="-mb-px flex items-center gap-1">
        {tabs.map((t) => {
          const isActive = active(t.snippet)
          return (
            <Link
              key={t.label}
              href={base + t.snippet}
              aria-current={isActive ? 'page' : undefined}
              className={`relative -mb-px inline-flex cursor-pointer items-center border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-copper text-ink'
                  : 'border-transparent text-ink-3 hover:text-ink'
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}