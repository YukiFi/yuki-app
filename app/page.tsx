"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSignerStatus, useSmartAccountClient } from "@account-kit/react"
import {
  ArrowDownRight,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  ArrowUpRight,
} from "lucide-react"
import { useBalance } from "@/lib/hooks/useBalance"
import { SendModal } from "@/components/SendModal"
import { RequestModal } from "@/components/RequestModal"

const LAVENDER = "#e1a8f0"
const APY = 0.078

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

type DayYield = { date: Date; amount: number }

function generateYieldHistory(balance: number, days = 14): DayYield[] {
  const baseDaily = balance * (APY / 365)
  const out: DayYield[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const variance = 0.85 + Math.random() * 0.3
    out.push({ date, amount: baseDaily * variance })
  }
  return out
}

function formatUSD(value: number, opts?: Intl.NumberFormatOptions) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  })
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ────────────────────────────────────────────────────────────────────────────
// Yield chart
// ────────────────────────────────────────────────────────────────────────────

function YieldChart({ balance }: { balance: number }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [data, setData] = useState<DayYield[]>([])
  const initRef = useRef(false)

  useEffect(() => {
    if (balance > 0 && !initRef.current) {
      setData(generateYieldHistory(balance))
      initRef.current = true
    }
  }, [balance])

  const empty = data.length === 0
  const max = empty ? 1 : Math.max(...data.map((d) => d.amount))
  const total = empty ? 0 : data.reduce((s, d) => s + d.amount, 0)
  const idx = hovered ?? (empty ? -1 : data.length - 1)
  const day = idx >= 0 ? data[idx] : undefined

  const setFromTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.touches[0].clientX - r.left
    setHovered(Math.min(13, Math.max(0, Math.floor(x / (r.width / 14)))))
  }

  return (
    <section className="bg-zinc-900 rounded-md p-6 sm:p-8 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] uppercase tracking-[0.06em] text-white/45 font-medium">
          Daily yield
        </p>
        <p className="text-xs text-white/35 tabular-nums">
          ${formatUSD(total)} · 14d
        </p>
      </div>

      <div className="mb-6">
        <p
          className="text-2xl sm:text-[28px] font-medium tracking-tight tabular-nums"
          style={{ color: LAVENDER }}
        >
          +${day ? formatUSD(day.amount) : "0.00"}
        </p>
        <p className="text-xs text-white/40 mt-1">
          {day ? formatDate(day.date) : "—"}
          {hovered === null && day ? " · today" : ""}
        </p>
      </div>

      <div
        className="flex items-end gap-1 sm:gap-1.5 h-20 sm:h-24 touch-pan-x"
        onTouchStart={setFromTouch}
        onTouchMove={setFromTouch}
        onTouchEnd={() => setHovered(null)}
      >
        {Array.from({ length: 14 }).map((_, i) => {
          const d = data[i]
          const heightPct = d ? Math.max((d.amount / max) * 100, 8) : 28
          const isToday = i === 13
          const isActive = !empty && (hovered === null ? isToday : hovered === i)
          const dimmed = !empty && hovered !== null && hovered !== i
          return (
            <div
              key={i}
              className="flex-1 h-full flex items-end"
              onMouseEnter={() => !empty && setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="w-full rounded-[2px] transition-[background-color,opacity] duration-100"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: isActive ? LAVENDER : "rgb(39 39 42)",
                  opacity: dimmed ? 0.4 : 1,
                }}
              />
            </div>
          )
        })}
      </div>

      <div className="flex justify-between mt-4 text-[10px] sm:text-[11px] text-white/30 tabular-nums">
        <span>14d ago</span>
        <span>Today</span>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Action primitives
// ────────────────────────────────────────────────────────────────────────────

const PRIMARY =
  "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[4px] text-sm font-semibold tracking-tight text-black outline-none transition-[box-shadow,transform,filter] duration-150 hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"

const SECONDARY =
  "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[4px] bg-zinc-900 text-sm font-medium tracking-tight text-white outline-none transition-colors duration-150 hover:bg-zinc-800 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"

const TERTIARY =
  "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[4px] bg-zinc-900 text-sm font-medium tracking-tight text-white/65 outline-none transition-colors duration-150 hover:bg-zinc-800 hover:text-white active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isConnected, isInitializing } = useSignerStatus()
  const { client } = useSmartAccountClient({})
  const [sendOpen, setSendOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)

  const isPreview = !isInitializing && !isConnected

  const walletAddress = client?.account?.address as `0x${string}` | undefined
  const { balance: total } = useBalance(walletAddress, { enabled: !!walletAddress })

  const balance = parseFloat(total) || 0
  const todayYield = balance * (APY / 365)
  const monthEst = balance * (APY / 12)

  const [dollars, cents] = balance.toFixed(2).split(".")
  const dollarsFmt = parseInt(dollars).toLocaleString("en-US")

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-[1100px] mx-auto">
        {/* Balance hero */}
        <section className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <p className="text-sm tracking-tight text-white/55">Total balance</p>
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: LAVENDER }}
              />
              <span className="text-xs font-medium tracking-tight tabular-nums text-white/55">
                7.8% APY
              </span>
            </div>
          </div>

          <p className="text-[44px] sm:text-[64px] lg:text-[80px] leading-none font-medium tracking-tight tabular-nums text-white mb-7 sm:mb-9">
            <span style={{ color: LAVENDER }}>$</span>
            {dollarsFmt}
            <span className="text-white/30 text-[0.4em] font-normal ml-0.5">
              .{cents}
            </span>
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div>
              <p className="text-[15px] sm:text-base font-medium tabular-nums text-white">
                +${formatUSD(todayYield)}
              </p>
              <p className="text-xs text-white/45 mt-0.5">Earned today</p>
            </div>
            <div aria-hidden className="hidden sm:block w-px h-9 bg-zinc-900" />
            <div>
              <p className="text-[15px] sm:text-base font-medium tabular-nums text-white">
                ~${formatUSD(monthEst)}
              </p>
              <p className="text-xs text-white/45 mt-0.5">Estimated this month</p>
            </div>
          </div>
        </section>

        {/* Action bar */}
        <section className="mb-10 sm:mb-14">
          {isPreview ? (
            <div>
              <Link
                href="/login"
                style={{ backgroundColor: LAVENDER }}
                className={`${PRIMARY} w-full sm:w-auto`}
              >
                Get started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs sm:text-sm text-white/40 mt-3 max-w-md">
                Sign in to send, request, and earn 7.8% APY on your balance.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
              <button
                type="button"
                onClick={() => setSendOpen(true)}
                style={{ backgroundColor: LAVENDER }}
                className={PRIMARY}
              >
                <ArrowUpRight className="w-4 h-4" />
                Send
              </button>
              <button
                type="button"
                onClick={() => setRequestOpen(true)}
                className={SECONDARY}
              >
                <ArrowDownRight className="w-4 h-4" />
                Request
              </button>
              <Link href="/deposit" className={TERTIARY}>
                <ArrowDownToLine className="w-4 h-4" />
                Add
              </Link>
              <Link href="/withdraw" className={TERTIARY}>
                <ArrowUpFromLine className="w-4 h-4" />
                Withdraw
              </Link>
            </div>
          )}
        </section>

        {/* Yield chart */}
        <YieldChart balance={balance} />
      </div>

      <SendModal isOpen={sendOpen} onClose={() => setSendOpen(false)} />
      <RequestModal open={requestOpen} onClose={() => setRequestOpen(false)} />
    </div>
  )
}
