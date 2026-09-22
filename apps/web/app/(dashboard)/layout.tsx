'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LogOut, Menu } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { SplashScreen } from '@/app/components/Primitives'
import logout from '@/app/actions/logout'

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return '??'
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [initials, setInitials] = useState('')
  // Entry splash — loading.tsx only fires on slow navigations, so fast
  // loads never show it. This guarantees the splash on dashboard mount
  // (900ms display + the SplashScreen's own 300ms fade-out).
  const [splash, setSplash] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setInitials(getInitials(d.data.name, d.data.email))
        }
      })
      .catch(() => setInitials('??'))
  }, [])

  return (
    <div className="flex min-h-screen bg-canvas">
      {splash && <SplashScreen />}
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onToggleMobile={() => setMobileOpen((p) => !p)}
        onToggleCollapsed={() => setCollapsed((p) => !p)}
      />

      <div
        className={`flex min-h-screen flex-1 flex-col transition-[padding] duration-200 ${collapsed ? 'lg:pl-[68px]' : 'lg:pl-60'}`}
      >
        {/* Sticky top header — dashboard bar with user badge */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-canvas/90 px-5 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((p) => !p)}
              className="cursor-pointer rounded-md p-1.5 text-ink-2 transition-colors hover:bg-surface-2 lg:hidden"
              aria-label="Toggle sidebar"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
              <span className="hidden font-normal text-ink-3 sm:inline">
                Workspace
              </span>
              <span className="hidden select-none text-ink-4 sm:inline">/</span>
              <span className="font-medium text-ink">Projects</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              prefetch
              className="cursor-pointer text-xs text-ink-3 transition-colors hover:text-ink"
            >
              Docs
            </Link>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-medium text-white">
              {initials}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="cursor-pointer rounded-md p-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>

        {/* Content area */}
        <main id="main-content" className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}
