'use client'

import { useEffect, useRef, useState } from 'react'

type ConnStatus = 'connecting' | 'open' | 'closed'

// Compact stream indicator for the events feed toolbar.
// Copper ping while the socket is open, amber while (re)connecting, gray when closed.
export type DeliveryUpdate = {
  eventId: string
  channel: string
  status: string
}

// Compact stream indicator for the events feed toolbar.
// Copper ping while the socket is open, amber while (re)connecting, gray when closed.
// Delivery broadcasts for this project are forwarded to onDeliveryUpdate (if given)
// so the parent can patch rows in real time instead of waiting for the next poll.
export function LiveFeed({
  projectId,
  updates = 0,
  onDeliveryUpdate,
}: {
  projectId: string
  updates?: number
  onDeliveryUpdate?: (update: DeliveryUpdate) => void
}) {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL
  const [connStatus, setConnStatus] = useState<ConnStatus>(
    wsUrl ? 'connecting' : 'closed',
  )
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const delayRef = useRef(1000)
  const onDeliveryUpdateRef = useRef(onDeliveryUpdate)
  useEffect(() => {
    onDeliveryUpdateRef.current = onDeliveryUpdate
  })

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
          const msg = JSON.parse(e.data) as {
            type?: string
            data?: {
              projectId?: string
              eventId?: string
              channel?: string
              status?: string
            }
          }
          const data = msg.data
          if (data?.projectId && data.projectId !== projectId) return
          if (
            msg.type === 'delivery_update' &&
            data?.eventId &&
            data?.channel &&
            data?.status
          ) {
            onDeliveryUpdateRef.current?.({
              eventId: data.eventId,
              channel: data.channel,
              status: data.status,
            })
          }
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
    <p
      aria-label="Live feed status"
      className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${
        connStatus === 'open'
          ? 'text-copper'
          : connStatus === 'connecting'
            ? 'text-pending'
            : 'text-ink-3'
      }`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {connStatus === 'open' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-copper opacity-60" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            connStatus === 'open'
              ? 'bg-copper'
              : connStatus === 'connecting'
                ? 'bg-pending'
                : 'bg-ink-3'
          }`}
        />
      </span>
      {connStatus === 'open'
        ? `WebSocket stream · ${updates} updates`
        : connStatus === 'connecting'
          ? 'Connecting…'
          : `Stream offline · ${updates} updates`}
    </p>
  )
}