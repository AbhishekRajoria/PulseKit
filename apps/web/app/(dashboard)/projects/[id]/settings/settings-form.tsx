'use client'

import { useActionState, useRef, useState, type FormEvent } from 'react'
import { ChevronDown, KeyRound, LoaderCircle, Trash2 } from 'lucide-react'
import { deleteProject, updateProject } from '@/app/actions/projects'
import { AlertError, Micro } from '@/app/components/Primitives'
import { RevealKey } from '../reveal-key'

type SaveState = { error?: string; success?: boolean }
type DeleteState = { error?: string }

export function SettingsForm({
  projectId,
  projectName,
  rateLimit,
}: {
  projectId: string
  projectName: string
  rateLimit: number
}) {
  const [saveState, saveAction, saving] = useActionState(
    updateProject.bind(null, projectId),
    {} as SaveState,
  )
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteProject.bind(null, projectId, projectName),
    {} as DeleteState,
  )
  const [rate, setRate] = useState(rateLimit)
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [apiKeyOpen, setApiKeyOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const confirmMatches =
    confirmText.trim().toLowerCase() === projectName.toLowerCase()

  const handleNameChange = () => {
    const val = nameRef.current?.value ?? ''
    if (val !== projectName || rate !== rateLimit) {
      setDirty(true)
    } else {
      setDirty(false)
    }
  }

  const handleRateChange = (value: number) => {
    setRate(value)
    const nameVal = nameRef.current?.value ?? ''
    if (nameVal !== projectName || value !== rateLimit) {
      setDirty(true)
    } else {
      setDirty(false)
    }
  }

  return (
    <div className="space-y-4">
      <form action={saveAction} className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Project settings</h2>
            <p className="mt-0.5 text-xs text-ink-3">
              Update the name and rate limit for this project.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveState.success && (
              <span className="text-xs font-medium text-copper">Saved ✓</span>
            )}
            <button
              type="submit"
              disabled={saving || !dirty}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-ink-2 disabled:cursor-default disabled:opacity-40"
            >
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>

        <div className="mt-5 max-w-md">
          <Micro>Project name</Micro>
          <input
            ref={nameRef}
            type="text"
            name="name"
            required
            defaultValue={projectName}
            placeholder="e.g. my-app"
            onChange={handleNameChange}
            className="mt-2 h-10 w-full rounded-md border border-border-strong bg-surface px-3 font-mono text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
        </div>

        <div className="mt-5 max-w-md">
          <div className="flex items-baseline justify-between gap-3">
            <Micro>Rate limit</Micro>
            <span className="font-mono text-[11px] tabular-nums text-ink-4">
              {rate} req/min
            </span>
          </div>
          <div
            role="radiogroup"
            aria-label="Rate limit"
            className="mt-2 grid grid-cols-6 gap-1.5"
          >
            {[5, 10, 15, 20, 25, 30].map((value) => (
              <label
                key={value}
                className={`relative flex cursor-pointer items-center justify-center rounded-md border px-1 py-2 text-xs font-medium tabular-nums transition-colors ${
                  rate === value
                    ? 'border-ink bg-ink text-white'
                    : 'border-border-strong bg-surface text-ink-3 hover:border-ink-3 hover:text-ink-2'
                }`}
              >
                <input
                  type="radio"
                  name="rate_limit_per_min"
                  value={value}
                  checked={rate === value}
                  onChange={() => handleRateChange(value)}
                  className="sr-only"
                />
                {value}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-4">
            Max events accepted per minute.
          </p>
        </div>

        {saveState.error && (
          <div className="mt-4">
            <AlertError>{saveState.error}</AlertError>
          </div>
        )}
      </form>

      {/* API Key — accordion */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <button
          type="button"
          onClick={() => setApiKeyOpen((o) => !o)}
          aria-expanded={apiKeyOpen}
          className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-surface-2/60"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-2">
              <KeyRound className="h-4 w-4 text-ink-2" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">API key</h2>
              <p className="mt-0.5 text-xs text-ink-3">
                Server-side use only. Reveal to copy for local testing.
              </p>
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-ink-3 transition-transform ${apiKeyOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {apiKeyOpen && (
          <div className="border-t border-border px-5 pb-5 pt-4">
            <Micro>API key</Micro>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-2">
                Server-side use only. The full key was displayed once at
                project creation.
              </p>
              <span className="rounded-md bg-amber-soft px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-ink">
                Shown once
              </span>
            </div>
            <div className="mt-4">
              <RevealKey projectId={projectId} variant="dark" />
            </div>
          </div>
        )}
      </div>

      <div className="card border-failure/30 p-5">
        <h2 className="text-sm font-semibold text-failure">Danger zone</h2>
        <p className="mt-0.5 text-xs text-ink-3">
          Permanently deletes this project, its events, notifications, and
          delivery logs. This can&apos;t be undone.
        </p>

        <form action={deleteAction} className="mt-4">
          {confirming ? (
            <div className="max-w-md space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-ink-3">
                  Type &quot;{projectName}&quot; to confirm
                </span>
                <input
                  type="text"
                  name="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoFocus
                  placeholder={projectName}
                  className="mt-2 h-10 w-full rounded-md border border-failure/40 bg-surface px-3 font-mono text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-failure/20"
                />
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!confirmMatches || deleting}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-failure px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-default disabled:opacity-40"
                >
                  {deleting && (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  )}
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Deleting…' : 'Delete project'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false)
                    setConfirmText('')
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-failure/40 px-4 py-2 text-sm font-medium text-failure transition-colors hover:bg-failure-tint"
            >
              <Trash2 className="h-4 w-4" />
              Delete project
            </button>
          )}
        </form>

        {deleteState.error && (
          <div className="mt-3">
            <AlertError>{deleteState.error}</AlertError>
          </div>
        )}
      </div>
    </div>
  )
}
