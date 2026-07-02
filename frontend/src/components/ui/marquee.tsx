import type { ReactNode } from 'react'

export default function Marquee({ items }: { items: ReactNode[] }) {
  return (
    <div className="flex w-full overflow-hidden border-y-2 border-border bg-secondary-background py-2 text-foreground font-base">
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className="flex min-w-full shrink-0 items-center justify-around gap-8 animate-marquee"
        >
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 whitespace-nowrap text-xl">
              {item}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
