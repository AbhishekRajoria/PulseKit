export const dynamic = "force-dynamic";
import { fetchApi } from "@/lib/api";
import { ApiResponse, Project } from "@/types";
import Link from "next/link";
import CreateProjectForm from "./create-form";

export default async function ProjectsPage() {
  const res = await fetchApi("/api/v1/projects");
  const data: ApiResponse<Project[]> = await res.json();
  const projects = data.data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Projects
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateProjectForm />
      </div>

      {projects.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">No projects yet</p>
            <p className="mt-1 text-xs text-gray-500">
              Create your first project to start sending notifications
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-50/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                  {project.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {project.rate_limit_per_min} req/min &middot; Created{" "}
                  {new Date(project.created_at).toLocaleDateString("en-IN", {
                    dateStyle: "medium",
                  })}
                </p>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}