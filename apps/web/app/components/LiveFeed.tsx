"use client";

import { useEffect, useRef, useState } from "react";

type DeliveryUpdate = {
  eventId: string;
  projectId: string;
  channel: "email" | "slack" | "webhook" | "inapp";
  status: "delivered" | "failed" | "sentinel";
  deliveredAt: string;
};

type ConnStatus = "connecting" | "open" | "closed";

const rowStyles: Record<DeliveryUpdate["status"], string> = {
  delivered: "border-l-emerald-500",
  failed: "border-l-red-500",
  sentinel: "border-l-amber-500",
};

const badgeStyles: Record<DeliveryUpdate["status"], string> = {
  delivered: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  sentinel: "bg-amber-50 text-amber-700",
};

const dotStyles: Record<DeliveryUpdate["status"], string> = {
  delivered: "bg-emerald-500",
  failed: "bg-red-500",
  sentinel: "bg-amber-500",
};

export function LiveFeed({ projectId }: { projectId: string }) {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  const [updates, setUpdates] = useState<DeliveryUpdate[]>([]);
  const [connStatus, setConnStatus] = useState<ConnStatus>(wsUrl ? "connecting" : "closed");
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef(1000);

  useEffect(() => {
    if (!wsUrl) return;
    const connect = () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      if (wsRef.current?.readyState === WebSocket.OPEN) return;
      setConnStatus("connecting");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => setConnStatus("open");
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type !== "delivery_update") return;
          const data = msg.data as DeliveryUpdate;
          if (data.projectId !== projectId) return;
          setUpdates((prev) => [data, ...prev]);
        } catch { /* ignore */ }
      };
      ws.onclose = () => {
        setConnStatus("closed");
        if (wsRef.current === ws) {
          retryRef.current = setTimeout(connect, delayRef.current);
          delayRef.current = Math.min(delayRef.current * 2, 10000);
        }
      };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [projectId, wsUrl]);

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${connStatus === "open" ? "bg-emerald-400 animate-ping" : "bg-gray-300"}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${connStatus === "open" ? "bg-emerald-500" : connStatus === "connecting" ? "bg-amber-400" : "bg-gray-400"}`} />
          </span>
          <h2 className="text-sm font-semibold text-gray-900">Live Feed</h2>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${connStatus === "open" ? "text-emerald-600" : connStatus === "connecting" ? "text-amber-600" : "text-gray-400"}`}>
            {connStatus === "open" ? "Live" : connStatus === "connecting" ? "Connecting…" : "Disconnected"}
          </span>
        </div>
      </div>
      <div className="px-2 py-2">
        <div className="grid grid-cols-[minmax(0,1fr)_80px_80px] gap-3 px-3 pb-1 text-xs font-medium uppercase tracking-wider text-gray-400 sm:grid-cols-[minmax(0,1fr)_80px_100px_80px]">
          <span>Event</span>
          <span className="hidden sm:block">Channel</span>
          <span>Status</span>
          <span className="text-right">Time</span>
        </div>
        {updates.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-3 py-10 text-center">
            <p className="text-sm font-medium text-gray-500">No live updates yet</p>
            <p className="text-xs text-gray-400">Send an event to see deliveries stream in real time</p>
          </div>
        ) : (
          <div className="max-h-80 space-y-0.5 overflow-y-auto pb-1">
            {updates.map((u, i) => (
              <div key={`${u.eventId}-${u.deliveredAt}-${i}`} className={`grid grid-cols-[minmax(0,1fr)_80px_80px] items-center gap-3 rounded-lg border-l-4 bg-gray-50 px-3 py-2 text-sm transition-colors hover:bg-gray-100 sm:grid-cols-[minmax(0,1fr)_80px_100px_80px] ${rowStyles[u.status]}`}>
                <span className="truncate font-mono text-xs text-gray-500">{u.eventId.slice(0, 8)}</span>
                <span className="hidden sm:flex items-center gap-1.5 font-medium capitalize text-gray-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                  {u.channel}
                </span>
                <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyles[u.status]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[u.status]}`} />
                  {u.status}
                </span>
                <span className="text-right text-xs tabular-nums text-gray-400">
                  {new Date(u.deliveredAt).toLocaleTimeString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
