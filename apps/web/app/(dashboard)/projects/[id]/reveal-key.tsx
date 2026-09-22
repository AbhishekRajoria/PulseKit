'use client'

import { useActionState, useState } from 'react'
import { Check, Copy, Eye, EyeOff, Lock } from 'lucide-react'
import { revealApiKey } from '@/app/actions/projects'

type RevealState = { error?: string; apiKey?: string }

export function RevealKey({
  projectId,
  variant = 'default',
}: {
  projectId: string
  variant?: 'default' | 'dark'
}) {
  const [state, formAction, pending] = useActionState(
    revealApiKey.bind(null, projectId),
    {} as RevealState,
  )
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!state.apiKey) return
    navigator.clipboard?.writeText(state.apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (variant === 'dark') {
    if (state.apiKey) {
      // Key revealed — full key in the dark block with hide/copy inside
      return (
        <div className="space-y-3">
<div className="flex items-center gap-1 rounded-xl bg-code-surface p-2 pl-4">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-code-foreground">
              {showKey ? state.apiKey : state.apiKey.slice(0, 7) + '•'.repeat(state.apiKey.length - 7)}
            </code>
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-code-muted transition-colors hover:text-code-foreground"
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showKey ? 'Hide' : 'Show'}
            </button>
            <button
              type="button"
              onClick={copy}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                copied ? 'text-copper' : 'text-code-muted hover:text-code-foreground'
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          {state.error && <p className="text-xs text-failure">{state.error}</p>}
        </div>
      )
    }

    // Default: password gate first — no placeholder key shown
    return (
      <div>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              Account password
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••"
              className="mt-2 h-10 w-full rounded-md border border-border-strong bg-surface px-3 font-mono text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-action-hover disabled:cursor-default disabled:opacity-50"
          >
            <Lock className="h-3.5 w-3.5" />
            {pending ? 'Checking…' : 'Confirm'}
          </button>
          {state.error && <p className="w-full text-xs text-failure">{state.error}</p>}
        </form>
      </div>
    )
  }

  // Default variant (unchanged)
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      {state.apiKey ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <code className="max-w-full overflow-x-auto font-mono text-[13px] text-ink-2">
            {showKey
              ? state.apiKey
              : state.apiKey.slice(0, 7) + '\u2022'.repeat(state.apiKey.length - 7)}
          </code>
          <button
            type="button"
            onClick={() => setShowKey((s) => !s)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-strong bg-card px-3 py-1.5 text-[11px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showKey ? 'Hide' : 'Show'}
          </button>
          <button
            type="button"
            onClick={copy}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors ${
              copied
                ? 'border-copper bg-card text-copper'
                : 'border-border-strong bg-card text-ink-2 hover:bg-surface-2 hover:text-ink'
            }`}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      ) : (
        <form action={formAction} className="flex w-full flex-wrap items-end gap-2">
          <div className="min-w-44 flex-1">
            <label
              htmlFor="revealPassword"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-3"
            >
              Enter your password
            </label>
            <input
              type="password"
              id="revealPassword"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-9 w-full rounded-md border border-border-strong bg-surface px-3 font-mono text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-action-hover disabled:cursor-default disabled:opacity-50"
          >
            {pending ? 'Checking…' : 'Reveal'}
          </button>
          {state.error && <p className="w-full text-xs text-failure">{state.error}</p>}
        </form>
      )}
    </div>
  )
}
