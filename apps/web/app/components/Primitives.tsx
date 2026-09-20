'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { Check, Copy, Eye, EyeOff, TriangleAlert } from 'lucide-react'

// -----------------------------------------------------------------------
// Brand / Signal mark
// -----------------------------------------------------------------------

export function SignalMark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`relative grid h-6 w-6 place-items-center ${className}`}
      aria-hidden="true"
    >
      <span className="absolute h-5 w-5 animate-ping rounded-full border border-copper/40" />
      <span className="absolute h-4 w-4 rounded-full border border-copper/30" />
      <span className="h-2 w-2 rounded-full bg-copper" />
    </span>
  )
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold text-ink">
      <SignalMark />
      {!compact && <span className="text-[15px] tracking-tight">PulseKit</span>}
    </Link>
  )
}

// -----------------------------------------------------------------------
// Typography helpers
// -----------------------------------------------------------------------

export function Micro({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
      {children}
    </div>
  )
}

export function Mono({
  children,
  className = '',
}: { children: ReactNode; className?: string }) {
  return (
    <code className={`font-mono text-xs tabular-nums text-ink-2 ${className}`}>
      {children}
    </code>
  )
}

// -----------------------------------------------------------------------
// Copy button
// -----------------------------------------------------------------------

export function CopyButton({
  value,
  label = 'Copy',
}: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
      onClick={() => {
        navigator.clipboard?.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1400)
      }}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? 'Copied' : label}
    </button>
  )
}

// -----------------------------------------------------------------------
// Status (dot + label, per real event schema)
// -----------------------------------------------------------------------

const statusColor: Record<string, string> = {
  delivered: 'text-copper',
  failed: 'text-failure',
  pending: 'text-pending',
  deduplicated: 'text-ink-3',
  rate_limited: 'text-status-rate',
}

const statusLabel: Record<string, string> = {
  delivered: 'Delivered',
  failed: 'Failed',
  pending: 'Pending',
  deduplicated: 'Deduped',
  rate_limited: 'Rate limited',
}

export function Status({ status }: { status: string }) {
  const key = status.toLowerCase()
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusColor[key] ?? 'text-ink-3'}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel[key] ?? status}
    </span>
  )
}

// -----------------------------------------------------------------------
// Stat — mono 2xl tabular display, used in stat strips and project cards
// -----------------------------------------------------------------------

export function Stat({
  label,
  value,
  detail,
  className = '',
  valueClassName = 'text-ink',
}: {
  label: string
  value: string
  detail?: string
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={`border-r border-border px-5 last:border-r-0 ${className}`}>
      <Micro>{label}</Micro>
      <div
        className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${valueClassName}`}
      >
        {value}
      </div>
      {detail && <p className="mt-1 text-xs text-ink-3">{detail}</p>}
    </div>
  )
}

// -----------------------------------------------------------------------
// LiveDot — copper pulse indicator
// -----------------------------------------------------------------------

export function LiveDot({ label = 'Live' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-copper">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-copper opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-copper" />
      </span>
      {label}
    </span>
  )
}

// -----------------------------------------------------------------------
// Code — dark terminal/JSON well with copy
// -----------------------------------------------------------------------

export function Code({
  children,
  filename,
}: { children: string; filename?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-code-surface">
      <div className="flex items-center justify-between border-b border-code-line px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-code-muted">
          {filename ?? 'shell'}
        </span>
        <CopyButton value={children} />
      </div>
      <pre className="overflow-auto p-5 font-mono text-xs leading-6 text-code-foreground">
        {children}
      </pre>
    </div>
  )
}

// -----------------------------------------------------------------------
// Field — Micro label + styled input
// -----------------------------------------------------------------------

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export function Field({
  label,
  error,
  ...rest
}: InputProps & { label: string; error?: string }) {
  return (
    <label className="block">
      <Micro>{label}</Micro>
      <input
        className={`mt-2 h-10 w-full rounded-md border border-border-strong bg-surface px-3 font-mono text-sm tabular-nums text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-[#111827]/10 focus:ring-offset-2 focus:ring-offset-canvas ${error ? 'border-failure' : ''}`}
        {...rest}
      />
      {error && <p className="mt-1.5 text-xs text-failure">{error}</p>}
    </label>
  )
}

export function PasswordField({
  label,
  error,
  ...rest
}: InputProps & { label: string; error?: string }) {
  const [show, setShow] = useState(false)
  return (
    <label className="block">
      <Micro>{label}</Micro>
      <div className="relative mt-2">
        <input
          type={show ? 'text' : 'password'}
          className={`h-10 w-full rounded-md border border-border-strong bg-surface px-3 font-mono text-sm tabular-nums text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-[#111827]/10 focus:ring-offset-2 focus:ring-offset-canvas ${error ? 'border-failure' : ''}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-ink-3 transition-colors hover:text-ink"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-failure">{error}</p>}
    </label>
  )
}

export function AlertError({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-failure/20 bg-failure-tint px-3 py-2.5 text-sm text-failure">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}