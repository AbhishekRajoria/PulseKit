import { fetchApi } from '@/lib/api'
import type { ApiResponse, Project } from '@/types'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const res = await fetchApi(`/api/v1/projects/${id}`)
  if (!res.ok) return { title: 'Notifications' }
  const data = (await res.json()) as ApiResponse<Project>
  const name = data.data?.name
  return {
    title: name ? `${name} · Notifications` : 'Notifications',
    description: name
      ? `In-app notifications delivered to end users of ${name}.`
      : 'In-app notifications delivered to end users.',
  }
}

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}