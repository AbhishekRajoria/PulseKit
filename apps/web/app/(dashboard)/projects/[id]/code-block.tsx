'use client'

import { useState } from 'react'
import { CopyButton } from '@/app/components/Primitives'

type Tab = 'curl' | 'sdk'

export function CodeBlock({
  code,
  sdkCode,
}: {
  code: string
  sdkCode?: string
}) {
  const [tab, setTab] = useState<Tab>('curl')
  const activeCode = tab === 'curl' ? code : (sdkCode ?? code)

  return (
    <div className="overflow-hidden rounded-xl border border-strong-border bg-code-surface">
      <div className="flex items-center justify-between border-b border-code-line px-3 py-1.5">
        <div className="flex items-center gap-1">
          {(['curl', 'sdk'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                tab === t
                  ? 'bg-code-line text-code-foreground'
                  : 'text-code-muted hover:text-code-foreground'
              }`}
            >
              {t === 'curl' ? 'curl' : 'SDK'}
            </button>
          ))}
        </div>
        <CopyButton value={activeCode} />
      </div>
      <pre className="overflow-auto p-5 font-mono text-xs leading-6 text-code-foreground">
        {activeCode}
      </pre>
    </div>
  )
}
