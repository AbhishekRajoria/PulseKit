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

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

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
    <section className="card mt-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                connStatus === "open"
                  ? "bg-emerald-400 animate-ping"
                  : "bg-gray-300"
              }`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                connStatus === "open"
                  ? "bg-emerald-500"
                  : connStatus === "connecting"
                    ? "bg-amber-400"
                    : "bg-gray-400"
              }`}
            />
          </span>
          <h2 className="text-[11px] font-medium text-ink-3">Live feed</h2>
          <span
            className={`text-[11px] font-medium ${
              connStatus === "open"
                ? "text-emerald-600"
                : connStatus === "connecting"
                  ? "text-amber-600"
                  : "text-ink-4"
            }`}
          >
            {connStatus === "open"
              ? "connected"
              : connStatus === "connecting"
                ? "connecting…"
                : "disconnected"}
          </span>
        </div>
      </div>

      {/* Rows */}
      <div className="px-2 py-2">
        {updates.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <p className="text-sm text-ink-4">Waiting for events — send one to see it appear here.</p>
          </div>
        ) : (
          <div className="max-h-80 space-y-0.5 overflow-y-auto pb-1">
            {updates.map((u, i) => (
              <div
                key={`${u.eventId}-${u.deliveredAt}-${i}`}
                className="grid items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm transition-colors hover:bg-gray-100 animate-[fadeInUp_200ms_ease-out]"
                style={{ animationFillMode: "both" }}
              >
                <span className="truncate font-mono text-[13px] text-ink-3">
                  {u.eventId.slice(0, 8)}
                </span>
                <span className="hidden items-center gap-1.5 font-medium capitalize text-ink-3 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink-4" />
                  {u.channel}
                </span>
                <span
                  className={`inline-flex w-fit items-center gap-1.5 text-xs font-medium ${
                    u.status === "delivered"
                      ? "text-emerald-600"
                      : u.status === "failed"
                        ? "text-red-600"
                        : "text-ink-4"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      u.status === "delivered"
                        ? "bg-emerald-500"
                        : u.status === "failed"
                          ? "bg-red-500"
                          : "bg-ink-4"
                    }`}
                  />
                  {u.status}
                </span>
                <span className="text-right text-xs tabular-nums text-ink-4">
                  {timeAgo(u.deliveredAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </section>
  );
}
