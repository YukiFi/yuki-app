"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  Activity as ActivityIcon,
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { useSmartAccountClient } from "@account-kit/react"
import {
  useTransactionHistory,
  type Transaction,
  type TransactionType,
} from "@/lib/hooks/useTransactionHistory"

const LAVENDER = "#e1a8f0"

// ────────────────────────────────────────────────────────────────────────────
// Type metadata
// ────────────────────────────────────────────────────────────────────────────

const TYPE_META: Record<
  TransactionType,
  { Icon: LucideIcon; label: string; sign: "+" | "−"; accent?: string }
> = {
  sent:       { Icon: ArrowUpRight,    label: "Sent",       sign: "−" },
  received:   { Icon: ArrowDownLeft,   label: "Received",   sign: "+" },
  deposit:    { Icon: ArrowDownToLine, label: "Deposit",    sign: "+" },
  withdrawal: { Icon: ArrowUpFromLine, label: "Withdrawal", sign: "−" },
  yield:      { Icon: Sparkles,        label: "Yield",      sign: "+", accent: LAVENDER },
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatUSD(v: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

function shortHash(hash: string) {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}

const DAY_MS = 24 * 60 * 60 * 1000

function bucketFor(d: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((today.getTime() - target.getTime()) / DAY_MS)

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "long" })
  if (target.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric" })
  }
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function groupByBucket(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    const key = bucketFor(tx.timestamp)
    const arr = groups.get(key) ?? []
    arr.push(tx)
    groups.set(key, arr)
  }
  return Array.from(groups.entries())
}

// ────────────────────────────────────────────────────────────────────────────
// Pieces
// ────────────────────────────────────────────────────────────────────────────

function GroupHeader({ label }: { label: string }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/35 px-3 sm:px-4 pt-6 pb-3">
      {label}
    </p>
  )
}

function Row({ tx }: { tx: Transaction }) {
  const meta = TYPE_META[tx.type]
  const { Icon, label, sign, accent } = meta
  const isPending = tx.status === "pending"
  const detailHref = tx.txHash ? `/tx/${tx.txHash}` : undefined

  const inner = (
    <div
      className={`group flex items-center gap-4 px-3 sm:px-4 py-3.5 rounded-[4px] transition-colors hover:bg-zinc-900 focus-visible:bg-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-[#e1a8f0] ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="shrink-0 w-9 h-9 rounded-[4px] bg-zinc-900 group-hover:bg-zinc-800 flex items-center justify-center transition-colors">
        <Icon
          className="w-4 h-4"
          style={accent ? { color: accent } : { color: "rgba(255,255,255,0.75)" }}
          aria-hidden
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[14px] font-medium tracking-tight text-white truncate">
            {tx.description}
          </p>
          <p className="text-[14px] font-medium tabular-nums text-white shrink-0">
            {sign}${formatUSD(Math.abs(tx.amount))}
            {tx.tokenSymbol && tx.tokenSymbol.toUpperCase() !== "USDC" && (
              <span className="ml-1 text-xs text-white/40">{tx.tokenSymbol}</span>
            )}
          </p>
        </div>
        <div className="flex items-baseline justify-between gap-3 mt-0.5">
          <p className="text-xs text-white/45 truncate">
            <span>{label}</span>
            {tx.counterparty && <span className="text-white/35"> · {tx.counterparty}</span>}
            {tx.txHash && <span className="text-white/30"> · {shortHash(tx.txHash)}</span>}
          </p>
          <p className="text-xs text-white/45 shrink-0">
            {isPending ? "Pending" : formatTime(tx.timestamp)}
          </p>
        </div>
      </div>

      {detailHref && (
        <ChevronRight
          aria-hidden
          className="w-4 h-4 text-white/20 shrink-0 transition-colors group-hover:text-white/55"
        />
      )}
    </div>
  )

  return detailHref ? (
    <Link
      href={detailHref}
      className="block w-full outline-none rounded-[4px]"
      aria-label={`View transaction ${tx.description}`}
    >
      {inner}
    </Link>
  ) : (
    inner
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-3 sm:px-4 py-3.5">
      <div className="shrink-0 w-9 h-9 rounded-[4px] bg-zinc-900" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-1/3 rounded-[2px] bg-zinc-900" />
        <div className="h-3 w-1/4 rounded-[2px] bg-zinc-900/70" />
      </div>
      <div className="h-3.5 w-16 rounded-[2px] bg-zinc-900 shrink-0" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center py-16 sm:py-24">
      <div className="w-12 h-12 rounded-[4px] bg-zinc-900 flex items-center justify-center mb-5">
        <ActivityIcon className="w-5 h-5 text-white/45" aria-hidden />
      </div>
      <p className="text-base font-medium tracking-tight text-white">
        No activity yet
      </p>
      <p className="text-sm text-white/50 mt-1.5 max-w-xs leading-relaxed">
        Your sends, receives, deposits, and yield events will appear here.
      </p>
    </div>
  )
}

function ErrorState({ message }: { message: string | null }) {
  return (
    <div className="px-3 sm:px-4 py-12 text-center">
      <p className="text-sm text-white/65">Couldn&apos;t load activity right now.</p>
      {message && (
        <p className="mt-1 text-xs text-white/35 truncate max-w-md mx-auto">
          {message}
        </p>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const { client } = useSmartAccountClient({})
  const walletAddress = client?.account?.address as `0x${string}` | undefined
  const { transactions, isLoading, error } = useTransactionHistory(walletAddress, {
    enabled: !!walletAddress,
    limit: 100,
  })

  const groups = useMemo(() => groupByBucket(transactions), [transactions])

  const renderBody = () => {
    if (isLoading && transactions.length === 0) {
      return (
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )
    }
    if (error && transactions.length === 0) return <ErrorState message={error} />
    if (transactions.length === 0) return <EmptyState />

    return groups.map(([label, txs]) => (
      <section key={label}>
        <GroupHeader label={label} />
        <div>
          {txs.map((tx) => (
            <Row key={tx.id} tx={tx} />
          ))}
        </div>
      </section>
    ))
  }

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-[800px] mx-auto">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-white mb-2.5">
            Activity
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-white/55 max-w-xl">
            A history of your sends, receives, deposits, and yield events.
          </p>
        </header>

        <div className="-mx-3 sm:-mx-4">{renderBody()}</div>
      </div>
    </div>
  )
}
