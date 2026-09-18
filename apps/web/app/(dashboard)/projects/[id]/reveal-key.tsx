'use client'

import { useActionState, useState } from 'react'
import { Check, Copy, Eye, EyeOff, KeySquare } from 'lucide-react'
import { revealApiKey } from '@/app/actions/projects'
import { Micro } from '@/app/components/Primitives'

type RevealState = { error?: string; apiKey?: string }

export function RevealKey({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(
    revealApiKey.bind(null, projectId),
    {} as RevealState,
  )
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!state.apiKey) return
    await navigator.clipboard.writeText(state.apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="card px-6 py-5">
      <div className="mb-3 flex items-center gap-2">
        <Micro>API key</Micro>
        <span className="pill bg-amber-soft text-amber-ink">
          {state.apiKey ? 'revealed' : 'masked'}
        </span>
      </div>

      {state.apiKey ? (
        <div className="flex flex-wrap items-center gap-2">
          <code className="inline-block max-w-full overflow-x-auto rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-ink">
            {showKey
              ? state.apiKey
              : state.apiKey.slice(0, 7) + '\u2022'.repeat(state.apiKey.length - 7)}
          </code>
          <button
            type="button"
            onClick={() => setShowKey((s) => !s)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-strong bg-card px-3 py-2 text-xs font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showKey ? 'Hide' : 'Show'}
          </button>
          <button
            type="button"
            onClick={copy}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              copied
                ? 'border-copper bg-card text-copper'
                : 'border-border-strong bg-card text-ink-2 hover:bg-surface-2 hover:text-ink'
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      ) : (
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <div className="min-w-44">
            <label
              htmlFor="revealPassword"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-ink-3"
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
              className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 font-mono text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary-action px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-action-hover disabled:cursor-default disabled:opacity-50"
          >
            <KeySquare className="h-4 w-4" />
            {pending ? 'Checking…' : 'Reveal'}
          </button>
          {state.error && (
            <p className="w-full text-xs text-failure">{state.error}</p>
          )}
        </form>
      )}
    </div>
  )
}