'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Brand } from '@/app/components/Primitives'

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error('PulseKit route error', error)
  }, [error])

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Brand />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-ink-3">
        An unexpected error occurred while rendering this page. Please try
        again.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={retry}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-action-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          Go home
        </Link>
      </div>
    </main>
  )
}