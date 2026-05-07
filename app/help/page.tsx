"use client"

import { ArrowUpRight, ChevronDown, Mail, MessageCircle } from "lucide-react"

const LAVENDER = "#e1a8f0"

const SUPPORT_EMAIL = "support@yuki.finance"
const DISCORD_URL = "https://discord.gg/yuki"

type FAQ = { q: string; a: string }

const FAQS: FAQ[] = [
  {
    q: "Is my money safe?",
    a: "Your balance is held in smart contracts on the blockchain — not by Yuki. We prioritize liquidity and access over maximum returns. All on-chain activity carries some risk; only use Yuki with funds you're comfortable having at some risk.",
  },
  {
    q: "Can I always access my money?",
    a: "Yes. There are no lockups, no waiting periods, and no penalties. You can send or withdraw your entire balance at any time. Your money stays usable — that's a core principle.",
  },
  {
    q: "What does changing my comfort level do?",
    a: "It adjusts how your money behaves going forward — more stability or more growth exposure. Changes don't affect your past, there's no penalty for switching, and you can change back at any time.",
  },
  {
    q: "Where does yield come from?",
    a: "From decentralized finance — lending, liquidity provision, and similar on-chain activities. Yield fluctuates with market conditions and can sometimes drop to zero. Yuki intentionally avoids high-risk strategies that promise bigger returns.",
  },
  {
    q: "Can my balance go down?",
    a: "In extreme circumstances, yes. While uncommon, market conditions can cause temporary negative performance. Yuki prioritizes protecting your access to funds over protecting yield. Your money remains withdrawable regardless.",
  },
  {
    q: "Do I need to understand crypto?",
    a: "No. You don't need a wallet, seed phrases, or any blockchain knowledge. Sign in with your email and use Yuki like any other app. Everything technical happens behind the scenes.",
  },
  {
    q: "What fees does Yuki charge?",
    a: "Yuki takes a percentage of the yield you earn — never your deposits, withdrawals, or balance. No hidden fees. When you earn, we earn. When yields are low, our revenue is low too.",
  },
  {
    q: "What should I use Yuki for?",
    a: "Idle balances and flexible funds — money you want accessible but also working for you. Not for retirement savings or funds you can't afford to risk. Think of it as the middle ground between checking and long-term savings.",
  },
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

function ContactRow({
  href,
  external,
  icon: Icon,
  title,
  detail,
}: {
  href: string
  external?: boolean
  icon: typeof Mail
  title: string
  detail: string
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center gap-4 px-3 sm:px-4 py-4 rounded-[4px] outline-none transition-colors hover:bg-zinc-900 focus-visible:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
    >
      <div className="shrink-0 w-9 h-9 rounded-[4px] bg-zinc-900 group-hover:bg-zinc-800 flex items-center justify-center transition-colors">
        <Icon className="w-4 h-4 text-white/75" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium tracking-tight text-white">{title}</p>
        <p className="text-xs text-white/45 mt-0.5 truncate">{detail}</p>
      </div>
      <ArrowUpRight
        className="w-4 h-4 shrink-0 text-white/35 transition-colors group-hover:text-white"
        aria-hidden
      />
    </a>
  )
}

function FAQRow({ faq }: { faq: FAQ }) {
  return (
    <details className="group rounded-[4px] transition-colors open:bg-zinc-900 hover:bg-zinc-900">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between gap-4 px-3 sm:px-4 py-4 outline-none rounded-[4px] focus-visible:ring-2 focus-visible:ring-[#e1a8f0]">
        <p className="text-[14px] font-medium tracking-tight text-white">{faq.q}</p>
        <ChevronDown
          className="w-4 h-4 shrink-0 text-white/40 transition-transform duration-150 group-open:rotate-180 group-open:text-white/65"
          aria-hidden
        />
      </summary>
      <div className="px-3 sm:px-4 pb-4 -mt-1">
        <p className="text-sm leading-relaxed text-white/60 max-w-2xl">{faq.a}</p>
      </div>
    </details>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-[800px] mx-auto">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-white mb-2.5">
            Help
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-white/55 max-w-xl">
            Quick answers and ways to reach the team.
          </p>
        </header>

        <div className="-mx-3 sm:-mx-4">
          {/* Contact */}
          <section>
            <GroupHeader label="Contact" />
            <ContactRow
              href={`mailto:${SUPPORT_EMAIL}`}
              icon={Mail}
              title="Email support"
              detail={SUPPORT_EMAIL}
            />
            <ContactRow
              href={DISCORD_URL}
              external
              icon={MessageCircle}
              title="Discord community"
              detail="Live chat with the team and other users"
            />
          </section>

          {/* FAQ */}
          <section>
            <GroupHeader label="Frequently asked" />
            <div>
              {FAQS.map((faq) => (
                <FAQRow key={faq.q} faq={faq} />
              ))}
            </div>
          </section>

          {/* Still need help */}
          <section className="mt-10 px-3 sm:px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6">
              <div>
                <p className="text-[14px] font-medium tracking-tight text-white">
                  Still need help?
                </p>
                <p className="text-xs text-white/45 mt-0.5">
                  We typically reply within one business day.
                </p>
              </div>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                style={{ backgroundColor: LAVENDER }}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[4px] text-sm font-semibold tracking-tight text-black outline-none transition-[box-shadow,transform,filter] duration-150 hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                Email support
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
