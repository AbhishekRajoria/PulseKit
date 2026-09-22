import type { ReactNode } from 'react'
import { Micro } from './Primitives'

export function DocSection({
  id,
  index,
  title,
  children,
}: {
  id: string
  index?: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-2">
        {index && <Micro>{index}</Micro>}
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          {title}
        </h2>
      </div>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  )
}

export function DocP({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-ink-2">{children}</p>
}

export function DocTable({
  head,
  rows,
}: {
  head: ReactNode[]
  rows: ReactNode[][]
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {head.map((h, i) => (
              <th
                key={i}
                scope="col"
                className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-surface-2">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2.5 align-top text-ink-2">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AnchorNav({ items }: { items: { href: string; label: string }[] }) {
  return (
    <nav className="hidden min-w-44 lg:block">
      <div className="sticky top-24 space-y-0.5">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="block truncate rounded-md px-3 py-1.5 text-sm text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  )
}

export function PageHeader({
  meta,
  title,
  description,
}: {
  meta: string
  title: string
  description: string
}) {
  return (
    <header>
      <Micro>{meta}</Micro>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">
        {description}
      </p>
    </header>
  )
}

export function PageFooter() {
  return (
    <footer className="mt-20 border-t border-border pt-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Micro>PulseKit</Micro>
        <div className="flex items-center gap-5 text-sm text-ink-3">
          <p>Built for deliberate engineering.</p>
          <a
            href="https://www.npmjs.com/package/pulsekit-sdk"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs transition-colors hover:text-ink"
          >
            pulsekit-sdk
          </a>
        </div>
      </div>
    </footer>
  )
}