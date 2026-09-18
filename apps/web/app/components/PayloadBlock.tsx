'use client'

import { CopyButton } from './Primitives'

export function PayloadBlock({
  payload,
}: {
  payload: Record<string, unknown>
}) {
  const json = JSON.stringify(payload, null, 2)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-code-surface">
      <div className="flex items-center justify-between border-b border-code-line px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-code-muted">
          payload
        </span>
        <CopyButton value={json} />
      </div>
      <pre className="overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-6 text-code-foreground">
        {json}
      </pre>
    </div>
  )
}