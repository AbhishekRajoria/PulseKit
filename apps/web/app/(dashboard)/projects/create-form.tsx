"use client";

import { useActionState, useState } from "react";
import { createProject } from "@/app/actions/projects";
import Link from "next/link";

export default function CreateProjectForm() {
  const [state, formAction, pending] = useActionState(createProject, {});
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!state.apiKey) return;
    await navigator.clipboard.writeText(state.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (state.success && state.apiKey) {
    return (
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Project created</p>
            <p className="mt-1 text-xs text-gray-500">
              Copy this API key now. It won&apos;t be shown again after you leave this page.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400">API key</span>
            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">shown once</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded border border-gray-200 bg-white px-2.5 py-2 font-mono text-xs text-gray-700">
              {showKey ? state.apiKey : state.apiKey.slice(0, 7) + "\u2022".repeat(state.apiKey.length - 7)}
            </code>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="shrink-0 cursor-pointer rounded border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50"
            >
              {showKey ? "Hide" : "Show"}
            </button>
            <button
              type="button"
              onClick={copy}
              className={`shrink-0 cursor-pointer rounded border px-2.5 py-2 text-xs font-medium transition-colors ${
                copied
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/projects/${state.projectId}`}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            View Project
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div>
        <label
          htmlFor="projectName"
          className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500"
        >
          New project
        </label>
        <input
          type="text"
          id="projectName"
          name="name"
          required
          placeholder="e.g. my-app"
          className="w-48 rounded-md border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50 disabled:cursor-default"
      >
        {pending ? "Creating…" : "Create"}
      </button>
      {state.error && (
        <p className="ml-2 text-xs text-red-600">{state.error}</p>
      )}
    </form>
  );
}