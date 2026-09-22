'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { Check, Copy, Plus, X } from 'lucide-react'
import { createProject } from '@/app/actions/projects'
import { AlertError } from '@/app/components/Primitives'

export default function CreateProjectForm({
  eventUrl,
  variant,
}: {
  eventUrl?: string
  variant?: 'card' | 'button'
}) {
  const [state, formAction, pending] = useActionState(createProject, {})
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const [successDismissed, setSuccessDismissed] = useState(false)
  const [rateLimit, setRateLimit] = useState(30)
  const nameRef = useRef<HTMLInputElement>(null)

  const copy = () => {
    if (!state.apiKey) return
    navigator.clipboard?.writeText(state.apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) nameRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (state.success && state.apiKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false)
    }
  }, [state.success, state.apiKey])

  const showSuccess = state.success && state.apiKey && !successDismissed

  useEffect(() => {
    if (!showSuccess) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSuccessDismissed(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showSuccess])

  const openForm = () => {
    setOpen(true)
    setSuccessDismissed(false)
  }

  return (
    <>
      {variant === 'card' ? (
        <button
          type="button"
          onClick={openForm}
          className="flex h-40 w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New project
        </button>
      ) : (
        <button
          type="button"
          onClick={openForm}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-primary-action px-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-action-hover"
        >
          <Plus className="h-4 w-4" />
          New project
        </button>
      )}

      {/* Create modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create project"
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="card w-full max-w-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">Create project</p>
                <p className="mt-0.5 text-xs text-ink-3">
                  Instrument a new app to receive event notifications.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-md p-1 text-ink-4 transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={formAction} className="mt-4">
              <label
                htmlFor="projectName"
                className="block text-[11px] font-semibold uppercase tracking-wider text-ink-3"
              >
                Project name
              </label>
              <input
                type="text"
                id="projectName"
                name="name"
                required
                ref={nameRef}
                placeholder="e.g. my-app"
                className="mt-2 h-10 w-full rounded-md border border-border-strong bg-surface px-3 font-mono text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ink/10"
              />

              <div className="mt-4 flex items-baseline justify-between gap-3">
                <label
                  htmlFor="rateLimit"
                  className="text-[11px] font-semibold uppercase tracking-wider text-ink-3"
                >
                  Rate limit
                </label>
                <span className="font-mono text-[11px] tabular-nums text-ink-4">
                  {rateLimit} req/min
                </span>
              </div>
              <div
                id="rateLimit"
                role="radiogroup"
                aria-label="Rate limit"
                className="mt-2 grid grid-cols-6 gap-1.5"
              >
                {[5, 10, 15, 20, 25, 30].map((value) => (
                  <label
                    key={value}
                    className={`relative flex cursor-pointer items-center justify-center rounded-md border px-1 py-2 text-xs font-medium tabular-nums transition-colors ${
                      rateLimit === value
                        ? 'border-ink bg-ink text-white'
                        : 'border-border-strong bg-surface text-ink-3 hover:border-ink-3 hover:text-ink-2'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rate_limit_per_min"
                      value={value}
                      checked={rateLimit === value}
                      onChange={() => setRateLimit(value)}
                      className="sr-only"
                    />
                    {value}
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink-4">
                Max events accepted per minute. Defaults to 30.
              </p>

              {state.error && <AlertError>{state.error}</AlertError>}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer rounded-lg bg-primary-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-action-hover disabled:cursor-default disabled:opacity-50"
                >
                  {pending ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success modal */}
      {showSuccess && eventUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Project created"
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSuccessDismissed(true)
          }}
        >
          <div className="card w-full max-w-md p-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-copper/10 text-copper">
              <Check className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-ink">
              Project created
            </h2>
            <p className="mt-1.5 text-sm text-ink-2">
              Copy this key now. It is displayed only at creation.
            </p>
            <span className="mt-3 inline-block rounded-md bg-amber-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-ink">
              Shown once
            </span>

            <div className="mt-4 flex items-center rounded-lg border border-border bg-surface-2 p-2 pl-3">
              <code className="min-w-0 flex-1 truncate text-left font-mono text-xs text-ink">
                {state.apiKey}
              </code>
              <button
                type="button"
                onClick={copy}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  copied
                    ? 'bg-copper/10 text-copper'
                    : 'text-ink-3 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <p className="mt-3 text-left text-xs text-ink-3">
              Can&apos;t find it later? Reveal it again from the project
              settings (password required).
            </p>

            <Link
              href={`/projects/${state.projectId}`}
              prefetch
              className="mt-5 inline-flex w-full cursor-pointer items-center justify-center rounded-md bg-primary-action px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-action-hover"
            >
              View project
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
