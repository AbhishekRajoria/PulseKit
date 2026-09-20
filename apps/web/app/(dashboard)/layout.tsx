'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './components/Sidebar'

function HeaderLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
        active
          ? 'font-medium text-ink'
          : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
      }`}
    >
      {children}
    </Link>
  )
}

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
        {/* Sticky top header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-canvas/90 px-5 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((p) => !p)}
              className="cursor-pointer rounded-md p-1.5 text-ink-2 transition-colors hover:bg-surface-2"
              aria-label="Toggle sidebar"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            <HeaderLink href="/">Home</HeaderLink>
            <HeaderLink href="/docs">Docs</HeaderLink>
            <HeaderLink href="/guide">Guide</HeaderLink>
            <HeaderLink href="/projects">Projects</HeaderLink>
          </nav>
        </header>

        {/* Content area */}
        <main id="main-content" className="w-full max-w-[1400px] flex-1 px-5 py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}