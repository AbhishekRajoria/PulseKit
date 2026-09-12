export const dynamic = "force-dynamic";
import { fetchApi } from "@/lib/api";
import { ApiResponse, Project, ProjectStats } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RevealKey } from "./reveal-key";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await fetchApi(`/api/v1/projects/${id}`);

  if (!res.ok) notFound();

  const response: ApiResponse<Project> = await res.json();
  const project = response.data;
  if (!project) notFound();

  const statsRes = await fetchApi(`/api/v1/projects/${id}/stats`);
  const stats: ProjectStats | null = statsRes.ok
    ? ((await statsRes.json()) as ApiResponse<ProjectStats>).data ?? null
    : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/projects"
        className="group inline-flex cursor-pointer items-center gap-1.5 text-sm text-ink-4 hover:text-ink"
      >
        <svg
          className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        All projects
      </Link>

      <div className="card mt-6">
        <div className="border-b border-gray-100 px-6 py-5">
          <h1 className="text-[1.25rem] font-semibold text-ink">
            {project.name}
          </h1>
          <p className="mt-0.5 font-mono text-[13px] text-ink-4">
            {project.id}
          </p>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-ink-3">Rate limit</p>
              <p className="text-sm text-ink">
                {project.rate_limit_per_min} req/min
              </p>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-medium text-ink-3">Created</p>
              <p className="text-sm text-ink">
                {new Date(project.created_at).toLocaleDateString("en-IN", {
                  dateStyle: "medium",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <RevealKey projectId={project.id} />
      </div>

      {/* Quick look cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href={`/projects/${id}/events`}
          className="group card flex items-center justify-between transition-colors hover:border-gray-300"
        >
          <div>
            <p className="text-sm font-semibold text-ink group-hover:text-ink-2">
              Events
            </p>
            <p className="mt-1 text-[1.875rem] font-bold leading-none tabular-nums text-ink">
              {stats ? stats.event_count.toLocaleString("en-IN") : "—"}
              <span className="ml-1.5 text-sm font-normal text-ink-3">total</span>
            </p>
            <p className="mt-1.5 text-xs text-ink-4">
              View event log and delivery status
            </p>
          </div>
          <svg className="h-4 w-4 shrink-0 text-ink-4 transition-colors group-hover:text-ink-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        <Link
          href={`/projects/${id}/notifications`}
          className="group card flex items-center justify-between transition-colors hover:border-gray-300"
        >
          <div>
            <p className="text-sm font-semibold text-ink group-hover:text-ink-2">
              Notifications
            </p>
            <p className="mt-1 text-[1.875rem] font-bold leading-none tabular-nums text-red-600">
              {stats ? stats.unread_count.toLocaleString("en-IN") : "—"}
              <span className="ml-1.5 text-sm font-normal text-ink-3">unread</span>
            </p>
            <p className="mt-1.5 text-xs text-ink-4">
              In-app notifications for end users
            </p>
          </div>
          <svg className="h-4 w-4 shrink-0 text-ink-4 transition-colors group-hover:text-ink-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
