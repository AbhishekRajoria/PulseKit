"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createProject } from "@/app/actions/projects";
import Link from "next/link";

export default function CreateProjectForm() {
  const [state, formAction, pending] = useActionState(createProject, {});
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [rateLimit, setRateLimit] = useState(30);
  const nameRef = useRef<HTMLInputElement>(null);

  const copy = async () => {
    if (!state.apiKey) return;
    await navigator.clipboard.writeText(state.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) nameRef.current?.focus();
  }, [open]);

  if (state.success && state.apiKey) {
    return (
      <div className="card border-emerald-200 bg-pulse-bg">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Project created</p>
            <p className="mt-1 text-xs text-ink-3">
              Copy this API key now. It won&apos;t be shown again after you leave this page.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[6px] border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-4">API key</span>
            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">shown once</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-[6px] border border-gray-200 bg-surface px-2.5 py-2 font-mono text-[13px] text-ink-2">
              {showKey ? state.apiKey : state.apiKey.slice(0, 7) + "\u2022".repeat(state.apiKey.length - 7)}
            </code>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="shrink-0 cursor-pointer rounded-[6px] border border-gray-200 bg-surface px-2.5 py-2 text-xs text-ink-3 transition-colors hover:bg-gray-50"
            >
              {showKey ? "Hide" : "Show"}
            </button>
            <button
              type="button"
              onClick={copy}
              className={`shrink-0 cursor-pointer rounded-[6px] border px-2.5 py-2 text-xs font-medium transition-colors ${
                copied
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-surface text-ink-3 transition-colors hover:bg-gray-50"
              }`}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <Link
            href={`/projects/${state.projectId}`}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            View project
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-2 rounded-[6px] border border-dashed border-gray-300 bg-surface px-4 py-2.5 text-sm font-medium text-ink-3 transition-colors hover:border-gray-400 hover:text-ink-2"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        New project
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-4/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="card w-full max-w-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">Create project</p>
                <p className="mt-0.5 text-xs text-ink-4">
                  Instrument a new app to receive event notifications.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-[6px] p-1 text-ink-4 transition-colors hover:bg-gray-100 hover:text-ink"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form action={formAction} className="mt-4">
              <label htmlFor="projectName" className="block text-[11px] font-medium text-ink-3">
                Project name
              </label>
              <input
                type="text"
                id="projectName"
                name="name"
                required
                ref={nameRef}
                placeholder="e.g. my-app"
                className="mt-1 w-full rounded-[6px] border border-gray-200 bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-gray-300 focus:outline-none"
              />

              <div className="mt-4 flex items-baseline justify-between gap-3">
                <label htmlFor="rateLimit" className="text-[11px] font-medium text-ink-3">
                  Rate limit
                </label>
                <span className="text-[11px] tabular-nums text-ink-4">
                  {rateLimit} req/min
                </span>
              </div>
              <div
                id="rateLimit"
                role="radiogroup"
                aria-label="Rate limit"
                className="mt-2 grid grid-cols-6 gap-1.5"
              >
                {[5, 10, 15, 20, 25, 30].map((value) => (
                  <label
                    key={value}
                    className={`relative flex cursor-pointer items-center justify-center rounded-[6px] border px-1 py-2 text-xs font-medium transition-colors ${
                      rateLimit === value
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-surface text-ink-3 hover:border-gray-300 hover:text-ink-2"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rate_limit_per_min"
                      value={value}
                      checked={rateLimit === value}
                      onChange={() => setRateLimit(value)}
                      className="sr-only"
                    />
                    {value}
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink-4">
                Max events accepted per minute. Defaults to 30.
              </p>

              {state.error && (
                <p className="mt-2 text-xs text-red-600">{state.error}</p>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-[6px] px-3 py-2 text-sm text-ink-4 transition-colors hover:text-ink-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer rounded-[6px] bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50 disabled:cursor-default"
                >
                  {pending ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}