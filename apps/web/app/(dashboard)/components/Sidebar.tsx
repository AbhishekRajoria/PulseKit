"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import logout from "@/app/actions/logout";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

type ProjectSummary = {
  id: string;
  name: string;
};

const projectIcon = (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const eventsIcon = (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const notifIcon = (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

export function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (href: string) => {
    if (href === "/projects") {
      return pathname === "/projects";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const pathProjectId = projectMatch?.[1] ?? null;

  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [lastPathProjectId, setLastPathProjectId] = useState<string | null>(null);

  if (pathProjectId && pathProjectId !== lastPathProjectId) {
    setLastPathProjectId(pathProjectId);
    setSelectedProjectId(pathProjectId);
  }

  const resolvedProjectId = pathProjectId ?? selectedProjectId;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success) {
          const list: ProjectSummary[] = data.data ?? [];
          setProjects(list);
        }
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const currentProject = projects?.find((p) => p.id === resolvedProjectId);

  const topItems: NavItem[] = [
    { href: "/projects", label: "Projects", icon: projectIcon },
  ];

  const projectItems: NavItem[] = resolvedProjectId
    ? [
        { href: `/projects/${resolvedProjectId}/events`, label: "Events", icon: eventsIcon },
        { href: `/projects/${resolvedProjectId}/notifications`, label: "Notifications", icon: notifIcon },
      ]
    : [];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-white transition-all duration-200 ${
          open ? "w-60" : "w-0 lg:w-16"
        } overflow-hidden`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-gray-100 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
            P
          </div>
          {open && (
            <span className="text-sm font-semibold tracking-tight text-gray-900">
              PulseKit
            </span>
          )}
        </div>

        {/* Project switcher pill — expanded only */}
        {open && (
          <div className="relative border-b border-gray-100 px-3 py-2">
            <button
              type="button"
              onClick={() => setSwitcherOpen((o) => !o)}
              className={`flex w-full items-center justify-between gap-2 rounded-[6px] border border-border bg-surface px-2.5 py-1.5 text-sm transition-colors hover:bg-gray-50 ${
                currentProject ? "font-medium text-ink-2" : "text-ink-4"
              }`}
              aria-haspopup="listbox"
              aria-expanded={switcherOpen}
            >
              <span className="truncate">{currentProject?.name ?? "Select project"}</span>
              <svg
                className={`h-3.5 w-3.5 shrink-0 text-ink-4 transition-transform ${
                  switcherOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {switcherOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
                <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-md border border-border bg-surface py-1 shadow-card">
                  <p className="px-3 pb-1 pt-0.5 text-[11px] font-medium text-ink-4">
                    Switch project
                  </p>
                  {projects?.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setSwitcherOpen(false);
                        router.push(`/projects/${p.id}`);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                        p.id === resolvedProjectId
                          ? "bg-sidebar-active-bg font-medium text-sidebar-active-text"
                          : "text-ink-2 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {p.id === resolvedProjectId && (
                        <svg
                          className="ml-auto h-3.5 w-3.5 shrink-0 text-pulse"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  ))}
                  {projects === null && (
                    <p className="px-3 py-1.5 text-xs text-ink-4">Loading…</p>
                  )}
                  {projects?.length === 0 && (
                    <p className="px-3 py-1.5 text-xs text-ink-4">No projects yet</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Nav — icons always visible, labels only when expanded */}
        <nav className="flex-1 space-y-1 px-2 py-3">
          {topItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-[6px] px-2.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                } ${!open ? "justify-center" : ""}`}
                title={!open ? item.label : undefined}
              >
                <span className={`shrink-0 ${active ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600"}`}>
                  {item.icon}
                </span>
                {open && item.label}
              </Link>
            );
          })}

          {/* Project items — icons always when resolved, labels + divider only when expanded */}
          {resolvedProjectId && (
            <>
              {open && (
                <>
                  <div className="my-3 border-t border-gray-100" />
                  <p
                    className="mb-2 truncate px-2 text-[11px] font-medium text-ink-3"
                    title={currentProject?.name}
                  >
                    {currentProject?.name ?? "Project"}
                  </p>
                </>
              )}
              {!open && <div className="my-2 border-t border-gray-100" />}
              {projectItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-[6px] px-2.5 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    } ${!open ? "justify-center" : ""}`}
                    title={!open ? item.label : undefined}
                  >
                    <span className={`shrink-0 ${active ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600"}`}>
                      {item.icon}
                    </span>
                    {open && item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Logout — icon always visible, label only when expanded */}
        <div className="border-t border-gray-100 px-2 py-3">
          <form action={logout}>
            <button
              type="submit"
              className={`group flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 ${
                !open ? "justify-center" : ""
              }`}
              title={!open ? "Log out" : undefined}
            >
              <svg
                className="h-[18px] w-[18px] shrink-0 text-gray-400 group-hover:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              {open && "Log out"}
            </button>
          </form>
        </div>
      </aside>

      {/* Toggle button — floating circle on right edge at bottom */}
      <button
        type="button"
        onClick={onToggle}
        className={`fixed bottom-4 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition-all duration-200 hover:text-gray-600 ${
          open ? "left-60" : "left-16"
        }`}
        style={{ transform: "translateX(-50%)" }}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "" : "rotate-180"}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
    </>
  );
}
