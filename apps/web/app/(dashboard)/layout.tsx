'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onToggleMobile={() => setMobileOpen((p) => !p)}
        onToggleCollapsed={() => setCollapsed((p) => !p)}
      />

      <div
        className={`flex min-h-screen flex-1 flex-col transition-[padding] duration-200 ${collapsed ? 'lg:pl-[68px]' : 'lg:pl-60'}`}
      >
        {/* Sticky top header — minimal dashboard bar (no public nav) */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-canvas/90 px-5 backdrop-blur-xl lg:px-8">
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
          <Link
            href="/docs"
            prefetch
            className="cursor-pointer text-xs text-ink-3 transition-colors hover:text-ink"
          >
            Docs
          </Link>
        </header>

        {/* Content area */}
        <main id="main-content" className="w-full max-w-[1400px] flex-1 px-5 py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}