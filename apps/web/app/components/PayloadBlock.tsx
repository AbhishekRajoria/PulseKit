"use client";

import { useState } from "react";

export function PayloadBlock({ payload }: { payload: Record<string, unknown> }) {
  const [copied, setCopied] = useState(false);

  const json = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-ink-3">Payload</p>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs text-ink-4 transition-colors hover:text-ink-2"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-2 whitespace-pre-wrap rounded-[10px] border border-gray-200 bg-surface-2 p-4 font-mono text-[13px] leading-relaxed text-ink-2">
        {json}
      </pre>
    </div>
  );
}
