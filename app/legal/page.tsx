"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  FileText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"

const LAVENDER = "#e1a8f0"

type LegalDoc = {
  title: string
  description: string
  href: string
  icon: LucideIcon
}

const DOCS: LegalDoc[] = [
  {
    title: "Terms of Service",
    description: "The rules and guidelines for using Yuki.",
    href: "/documents/terms",
    icon: FileText,
  },
  {
    title: "Privacy Policy",
    description: "How we collect, use, and protect your data.",
    href: "/documents/privacy",
    icon: ShieldCheck,
  },
  {
    title: "Risk Disclosure",
    description: "Important information about risks and disclaimers.",
    href: "/documents/risk",
    icon: AlertTriangle,
  },
]

const SUMMARY = [
  "Your assets are held on-chain, not by Yuki.",
  "We collect minimal personal data and never sell it.",
  "All crypto activity carries risk — use responsibly.",
  "You can delete your account and data at any time.",
]

// ────────────────────────────────────────────────────────────────────────────
// Pieces
// ────────────────────────────────────────────────────────────────────────────

function GroupHeader({ label }: { label: string }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/35 px-3 sm:px-4 pt-7 pb-3">
      {label}
    </p>
  )
}

function DocRow({ doc }: { doc: LegalDoc }) {
  const Icon = doc.icon
  return (
    <Link
      href={doc.href}
      className="group flex items-center gap-4 px-3 sm:px-4 py-4 rounded-[4px] outline-none transition-colors hover:bg-zinc-900 focus-visible:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
    >
      <div className="shrink-0 w-9 h-9 rounded-[4px] bg-zinc-900 group-hover:bg-zinc-800 flex items-center justify-center transition-colors">
        <Icon className="w-4 h-4 text-white/75" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium tracking-tight text-white">
          {doc.title}
        </p>
        <p className="text-xs text-white/45 mt-0.5 truncate">{doc.description}</p>
      </div>
      <ArrowUpRight
        className="w-4 h-4 shrink-0 text-white/35 transition-colors group-hover:text-white"
        aria-hidden
      />
    </Link>
  )
}

function SummaryItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 px-3 sm:px-4 py-2.5">
      <span
        aria-hidden
        className="shrink-0 mt-0.5 w-4 h-4 rounded-[2px] flex items-center justify-center"
        style={{ backgroundColor: "rgba(225,168,240,0.12)" }}
      >
        <Check className="w-3 h-3" style={{ color: LAVENDER }} strokeWidth={3} />
      </span>
      <span className="text-sm leading-relaxed text-white/65">{children}</span>
    </li>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function LegalPage() {
  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-[800px] mx-auto">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-white mb-2.5">
            Legal
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-white/55 max-w-xl">
            The full text of our policies, plus a short plain-language summary.
          </p>
        </header>

        <div className="-mx-3 sm:-mx-4">
          {/* Documents */}
          <section>
            <GroupHeader label="Documents" />
            {DOCS.map((doc) => (
              <DocRow key={doc.href} doc={doc} />
            ))}
          </section>

          {/* Summary */}
          <section>
            <GroupHeader label="In summary" />
            <ul>
              {SUMMARY.map((line, i) => (
                <SummaryItem key={i}>{line}</SummaryItem>
              ))}
            </ul>
            <p className="px-3 sm:px-4 pt-4 pb-2 text-xs leading-relaxed text-white/35 max-w-xl">
              The summary is for convenience only. Your relationship with Yuki
              is governed by the documents above.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
