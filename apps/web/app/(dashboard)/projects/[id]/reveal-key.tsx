"use client";

import { useActionState, useState } from "react";
import { revealApiKey } from "@/app/actions/projects";

type RevealState = { error?: string; apiKey?: string };

export function RevealKey({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(
    revealApiKey.bind(null, projectId),
    {} as RevealState,
  );
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!state.apiKey) return;
    await navigator.clipboard.writeText(state.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
      <div className="mb-3 flex items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          API key
        </p>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
          masked
        </span>
      </div>

      {state.apiKey ? (
        <div className="flex flex-wrap items-center gap-2">
          <code className="inline-block max-w-full overflow-x-auto rounded-md border border-gray-100 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600">
            {showKey
              ? state.apiKey
              : state.apiKey.slice(0, 7) + "\u2022".repeat(state.apiKey.length - 7)}
          </code>
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            {showKey ? "Hide" : "Show"}
          </button>
          <button
            type="button"
            onClick={copy}
            className={`cursor-pointer rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
              copied
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : (
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <div>
            <label
              htmlFor="revealPassword"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Enter your password
            </label>
            <input
              type="password"
              id="revealPassword"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-44 rounded-md border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="cursor-pointer rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50 disabled:cursor-default"
          >
            {pending ? "Checking…" : "Reveal"}
          </button>
          {state.error && (
            <p className="w-full text-xs text-red-600">{state.error}</p>
          )}
        </form>
      )}
    </div>
  );
}