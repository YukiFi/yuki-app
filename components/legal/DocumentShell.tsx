"use client"

import Link from "next/link"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import type { ReactNode } from "react"

export type DocumentSection = {
  id: string
  title: string
  body: ReactNode
}

export type DocumentSlug = "terms" | "privacy" | "risk"

const DOC_INDEX: { slug: DocumentSlug; title: string; href: string }[] = [
  { slug: "terms",   title: "Terms of Service",   href: "/documents/terms" },
  { slug: "privacy", title: "Privacy Policy",     href: "/documents/privacy" },
  { slug: "risk",    title: "Risk Disclosure",    href: "/documents/risk" },
]

type Props = {
  slug: DocumentSlug
  title: string
  lastUpdated: string
  groupLabel: string
  sections: DocumentSection[]
  callout?: ReactNode
  footer: ReactNode
}

export function DocumentShell({
  slug,
  title,
  lastUpdated,
  groupLabel,
  sections,
  callout,
  footer,
}: Props) {
  const others = DOC_INDEX.filter((d) => d.slug !== slug)

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-[760px] mx-auto">
        {/* Back link */}
        <Link
          href="/legal"
          className="inline-flex items-center gap-1.5 text-xs text-white/45 mb-8 rounded-sm outline-none transition-colors hover:text-white focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
          Back to Legal
        </Link>

        {/* Header */}
        <header className="mb-10 sm:mb-12">
          <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/35 mb-3">
            Legal · Document
          </p>
          <h1 className="text-2xl sm:text-[32px] font-medium tracking-tight text-white mb-3">
            {title}
          </h1>
          <p className="text-xs text-white/45 tabular-nums">
            Last updated · {lastUpdated}
          </p>
        </header>

        {callout && <div className="mb-10 sm:mb-12">{callout}</div>}

        {/* Sectioned body */}
        <div className="-mx-3 sm:-mx-4">
          <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/35 px-3 sm:px-4 pb-4">
            {groupLabel}
          </p>
          <div className="space-y-7 sm:space-y-8">
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="px-3 sm:px-4 scroll-mt-24"
              >
                <h2 className="text-[15px] font-medium tracking-tight text-white mb-2 flex items-baseline gap-2.5">
                  <span className="text-[11px] tabular-nums text-white/35 font-medium">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                </h2>
                <div className="text-sm leading-relaxed text-white/65 max-w-[64ch] space-y-3">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Per-doc footer (contact, acknowledgment, etc.) */}
        <div className="mt-12 sm:mt-14 px-3 sm:px-4">{footer}</div>

        {/* Other documents */}
        {others.length > 0 && (
          <div className="mt-12 sm:mt-14 -mx-3 sm:-mx-4">
            <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/35 px-3 sm:px-4 pb-3">
              Other documents
            </p>
            {others.map((d) => (
              <Link
                key={d.slug}
                href={d.href}
                className="group flex items-center gap-3 px-3 sm:px-4 py-3.5 rounded-[4px] outline-none transition-colors hover:bg-zinc-900 focus-visible:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
              >
                <span className="text-[14px] font-medium tracking-tight text-white">
                  {d.title}
                </span>
                <ArrowUpRight
                  className="w-3.5 h-3.5 ml-auto shrink-0 text-white/35 transition-colors group-hover:text-white"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
