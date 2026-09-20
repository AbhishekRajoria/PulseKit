export default function LoadingSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div
      className="mx-auto max-w-4xl px-6 py-8"
      role="status"
      aria-label="Loading"
    >
      <div className="h-4 w-24 animate-pulse rounded bg-border" />
      <div className="mt-5 space-y-3">
        <div className="h-8 w-52 animate-pulse rounded bg-border" />
        <div className="h-4 w-72 animate-pulse rounded bg-border" />
      </div>
      <div className="mt-6 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="card h-24 animate-pulse p-5" />
        ))}
      </div>
    </div>
  )
}