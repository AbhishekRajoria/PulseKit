export const dynamic = "force-dynamic";
import { fetchApi } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { ApiResponse, Project, ProjectStats } from "@/types";
import Link from "next/link";
import CreateProjectForm from "./create-form";

export default async function ProjectsPage() {
  const res = await fetchApi("/api/v1/projects");
  const data: ApiResponse<Project[]> = await res.json();
  const projects = data.data ?? [];

  const statsList = await Promise.all(
    projects.map(async (project) => {
      try {
        const sres = await fetchApi(`/api/v1/projects/${project.id}/stats`);
        if (!sres.ok) return null;
        const sdata: ApiResponse<ProjectStats> = await sres.json();
        return sdata.data ?? null;
      } catch {
        return null;
      }
    }),
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.25rem] font-semibold text-ink">Projects</h1>
          <p className="mt-1 text-sm text-ink-3">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="mt-12 flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <svg className="h-8 w-8 text-ink-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-ink">No projects yet</p>
            <p className="mt-1 text-xs text-ink-4">
              Create your first project to start sending notifications
            </p>
          </div>
          <div className="w-full max-w-md">
            <CreateProjectForm />
          </div>
        </div>
      )}

      {/* Project grid */}
      {projects.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((project, i) => {
              const stats = statsList[i];

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group card flex flex-col gap-4 transition-colors hover:border-gray-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink group-hover:text-ink-2">
                        {project.name}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-4">
                        {project.rate_limit_per_min} req/min
                      </p>
                    </div>
                    <svg className="h-4 w-4 shrink-0 text-ink-4 transition-colors group-hover:text-ink-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>

                  {/* Stats strip */}
                  {stats && (
                    <div className="grid grid-cols-3 divide-x divide-gray-100 border-y border-gray-100 py-3">
                      <div className="px-1 first:pl-0">
                        <p className="text-[1.125rem] font-bold leading-none tabular-nums text-ink">
                          {stats.event_count.toLocaleString("en-IN")}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-4">events</p>
                      </div>
                      <div className="px-3">
                        <p className="text-[1.125rem] font-bold leading-none tabular-nums text-ink">
                          {stats.unique_users.toLocaleString("en-IN")}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-4">users</p>
                      </div>
                      <div className="px-3">
                        <p className="text-[1.125rem] font-bold leading-none tabular-nums text-red-600">
                          {stats.unread_count.toLocaleString("en-IN")}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-4">unread</p>
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-ink-4">
                      Created{" "}
                      {new Date(project.created_at).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })}
                    </p>
                    {stats?.last_event_at && (
                      <p className="text-xs text-ink-4">
                        Last event {timeAgo(stats.last_event_at)} ago
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Create form below the grid */}
          <div className="mt-6">
            <CreateProjectForm />
          </div>
        </>
      )}
    </div>
  );
}