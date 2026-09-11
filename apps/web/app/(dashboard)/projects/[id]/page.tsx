export const dynamic = "force-dynamic";
import { fetchApi } from "@/lib/api";
import { ApiResponse, Project } from "@/types";
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/projects"
        className="group inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <svg
          className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        All projects
      </Link>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-5">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            {project.name}
          </h1>
          <p className="mt-0.5 font-mono text-xs text-gray-400">
            {project.id}
          </p>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
                Rate limit
              </p>
              <p className="text-sm text-gray-900">
                {project.rate_limit_per_min} req/min
              </p>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
                Created
              </p>
              <p className="text-sm text-gray-900">
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

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href={`/projects/${id}/events`}
          className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-50/50"
        >
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
              Events
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              View event log and delivery status
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

        <Link
          href={`/notifications`}
          className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-50/50"
        >
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
              Notifications
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              In-app notifications for end users
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
      </div>
    </div>
  );
}