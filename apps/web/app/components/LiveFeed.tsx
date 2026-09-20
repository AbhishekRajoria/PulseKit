'use client'

import { useEffect, useRef, useState } from 'react'

type ConnStatus = 'connecting' | 'open' | 'closed'

const statusText: Record<ConnStatus, string> = {
  open: 'Connected',
  connecting: 'Connecting…',
  closed: 'Disconnected',
}

// Compact 36px status banner perched above the events table.
// Green ping when the socket is open, amber while (re)connecting, gray when closed.
export function LiveFeed({ projectId }: { projectId: string }) {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL
  const [connStatus, setConnStatus] = useState<ConnStatus>(
    wsUrl ? 'connecting' : 'closed',
  )
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const delayRef = useRef(1000)

  useEffect(() => {
    if (!wsUrl) return
    const connect = () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      if (wsRef.current?.readyState === WebSocket.OPEN) return
      setConnStatus('connecting')
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onopen = () => setConnStatus('open')
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          const data = msg.data as { projectId?: string }
          if (data?.projectId && data.projectId !== projectId) return
        } catch {
          /* ignore */
        }
      }
      ws.onclose = () => {
        setConnStatus('closed')
        if (wsRef.current === ws) {
          retryRef.current = setTimeout(connect, delayRef.current)
          delayRef.current = Math.min(delayRef.current * 2, 10000)
        }
      }
      ws.onerror = () => ws.close()
    }
    connect()
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [projectId, wsUrl])

  return (
    <section
      aria-label="Live feed status"
      className="flex h-9 items-center justify-between rounded-t-lg border border-b-0 border-border bg-surface-2 px-4"
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          {connStatus === 'open' && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-delivered opacity-60" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              connStatus === 'open'
                ? 'bg-status-delivered'
                : connStatus === 'connecting'
                  ? 'bg-pending'
                  : 'bg-ink-3'
            }`}
          />
        </span>
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-ink-3">
          WebSocket Live Feed
        </p>
        <p
          className={`text-[11px] font-medium ${
            connStatus === 'open'
              ? 'text-status-delivered'
              : connStatus === 'connecting'
                ? 'text-pending'
                : 'text-ink-3'
          }`}
        >
          {statusText[connStatus]}
        </p>
      </div>
      <p className="hidden text-[11px] italic text-ink-4 sm:block">
        Listening for incoming events…
      </p>
    </section>
  )
}