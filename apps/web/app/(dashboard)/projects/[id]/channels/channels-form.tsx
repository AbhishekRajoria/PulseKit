'use client'

import { useState, type ReactNode } from 'react'
import { Inbox, LoaderCircle, Mail, MessageSquare } from 'lucide-react'
import type { ProjectChannels } from '@/types'
import { AlertError } from '@/app/components/Primitives'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type InitialValue = Pick<ProjectChannels, 'email' | 'slack' | 'inapp'>

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-copper/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
        checked ? 'bg-copper' : 'bg-border-strong'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-canvas shadow-sm transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

function ChannelCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  enabled: boolean
  onToggle: (v: boolean) => void
  children?: ReactNode
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-3">
            {icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-3">
              {description}
            </p>
          </div>
        </div>
        <Toggle checked={enabled} onChange={onToggle} label={`${title} channel`} />
      </div>
      {enabled && children && <div className="mt-5">{children}</div>}
    </div>
  )
}

function FieldLabel({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
      {label}
    </p>
  )
}

export function ChannelsForm({
  projectId,
  initialChannels,
}: {
  projectId: string
  initialChannels: InitialValue
}) {
  const [email, setEmail] = useState({
    enabled: Boolean(initialChannels.email),
    to: initialChannels.email?.to ?? '',
  })
  const [slack, setSlack] = useState({
    enabled: Boolean(initialChannels.slack),
    webhook_url: initialChannels.slack?.webhook_url ?? '',
  })
  const [inapp, setInapp] = useState({
    enabled: Boolean(initialChannels.inapp),
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty =
    email.enabled !== Boolean(initialChannels.email) ||
    email.to !== (initialChannels.email?.to ?? '') ||
    slack.enabled !== Boolean(initialChannels.slack) ||
    slack.webhook_url !== (initialChannels.slack?.webhook_url ?? '') ||
    inapp.enabled !== Boolean(initialChannels.inapp)

  const emailError =
    email.enabled && email.to.trim() && !EMAIL_RE.test(email.to.trim())
      ? 'Enter a valid email address.'
      : null

  const slackError =
    slack.enabled &&
    slack.webhook_url.trim() &&
    !slack.webhook_url.trim().startsWith('https://')
      ? 'Webhook URL must start with https://'
      : null

  const save = async () => {
    if (emailError || slackError) return

    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/channels`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: { enabled: email.enabled, to: email.to.trim() },
          slack: { enabled: slack.enabled, webhook_url: slack.webhook_url.trim() },
          inapp: { enabled: inapp.enabled },
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error ?? 'Failed to save channels')
      } else {
        setSaved(true)
      }
    } catch {
      setError('Failed to save channels')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Delivery channels</h2>
            <p className="mt-0.5 text-xs text-ink-3">
              Sent automatically on every event.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs font-medium text-copper">Saved ✓</span>
            )}
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-ink-2 disabled:cursor-default disabled:opacity-40"
            >
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
        {error && <div className="px-5 pt-4"><AlertError>{error}</AlertError></div>}
      </div>

      <ChannelCard
        icon={<Mail className="h-4 w-4" />}
        title="Email"
        description="Be notified at the address below when an event is received."
        enabled={email.enabled}
        onToggle={(v) => setEmail((e) => ({ ...e, enabled: v }))}
      >
        <div className="max-w-md">
          <FieldLabel label="To" />
          <input
            type="email"
            value={email.to}
            onChange={(e) => setEmail((s) => ({ ...s, to: e.target.value }))}
            placeholder="dev@acmecorp.com"
            className={`mt-2 h-10 w-full rounded-md border border-border-strong bg-surface px-3 font-mono text-sm tabular-nums text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-[#111827]/10 focus:ring-offset-2 focus:ring-offset-canvas ${
              emailError ? 'border-failure' : ''
            }`}
          />
          {emailError && <p className="mt-1.5 text-xs text-failure">{emailError}</p>}
          <p className="mt-2 text-xs text-ink-3">
            Used unless an individual event sets its own <code className="font-mono">to</code> override.
          </p>
        </div>
      </ChannelCard>

      <ChannelCard
        icon={<MessageSquare className="h-4 w-4" />}
        title="Slack"
        description="Post an alert to your workspace using an incoming webhook."
        enabled={slack.enabled}
        onToggle={(v) => setSlack((s) => ({ ...s, enabled: v }))}
      >
        <div className="max-w-md">
          <FieldLabel label="Webhook URL" />
          <input
            type="url"
            value={slack.webhook_url}
            onChange={(e) => setSlack((s) => ({ ...s, webhook_url: e.target.value }))}
            placeholder="https://hooks.slack.com/services/T…/B…/…"
            className={`mt-2 h-10 w-full rounded-md border border-border-strong bg-surface px-3 font-mono text-sm tabular-nums text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-[#111827]/10 focus:ring-offset-2 focus:ring-offset-canvas ${
              slackError ? 'border-failure' : ''
            }`}
          />
          {slackError && <p className="mt-1.5 text-xs text-failure">{slackError}</p>}
          <p className="mt-2 text-xs text-ink-3">
            Must be a valid <code className="font-mono">https://</code> incoming webhook.
          </p>
        </div>
      </ChannelCard>

      <ChannelCard
        icon={<Inbox className="h-4 w-4" />}
        title="In-app"
        description="Deliver to your app's notification inbox for each event's user."
        enabled={inapp.enabled}
        onToggle={(v) => setInapp((s) => ({ ...s, enabled: v }))}
      />
    </div>
  )
}