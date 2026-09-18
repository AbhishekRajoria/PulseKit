'use client'

import type { ReactNode } from 'react'
import { Brand } from './Primitives'

export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: ReactNode
  subtitle?: string
  footer: ReactNode
  children: ReactNode
}) {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6">
      <div className="mb-10">
        <Brand />
      </div>
      <div className="w-full max-w-sm">
        <div className="card p-7">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-8 text-center text-sm text-ink-3">{footer}</p>
      </div>
    </main>
  )
}