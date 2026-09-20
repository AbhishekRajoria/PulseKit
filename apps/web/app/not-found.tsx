import Link from 'next/link'
import { Brand } from '@/app/components/Primitives'

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Brand />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-ink-3">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>
      <Link
        href="/projects"
        className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-action-hover"
      >
        Back to projects
      </Link>
    </main>
  )
}