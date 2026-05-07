"use client"

import { useState } from "react"
import { useSmartAccountClient } from "@account-kit/react"
import { useBalance } from "@/lib/hooks/useBalance"

const LAVENDER = "#e1a8f0"

// ────────────────────────────────────────────────────────────────────────────
// Placeholder allocation set — replace with a real source later.
// Weights must sum to 1.
// ────────────────────────────────────────────────────────────────────────────

type Allocation = {
  id: string
  name: string
  description: string
  weight: number
  apy: number
}

const ALLOCATIONS: Allocation[] = [
  { id: "aave",    name: "Aave v3",    description: "Lending on Base",          weight: 0.42, apy: 0.048 },
  { id: "morpho",  name: "Morpho",     description: "Curated lending vault",    weight: 0.28, apy: 0.091 },
  { id: "pendle",  name: "Pendle PT",  description: "Fixed-rate principal",     weight: 0.18, apy: 0.124 },
  { id: "native",  name: "Native",     description: "Sponsored by Yuki",        weight: 0.12, apy: 0.070 },
]

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const SLICE_FILL = (i: number) =>
  `rgba(255,255,255,${Math.max(0.92 - i * 0.18, 0.16)})`

function formatUSD(v: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPct(v: number, digits = 1) {
  return `${(v * 100).toFixed(digits)}%`
}

// ────────────────────────────────────────────────────────────────────────────
// Donut
// ────────────────────────────────────────────────────────────────────────────

function Donut({
  allocations,
  total,
  hovered,
  onHover,
}: {
  allocations: Allocation[]
  total: number
  hovered: string | null
  onHover: (id: string | null) => void
}) {
  const size = 320
  const stroke = 28
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const C = 2 * Math.PI * r

  let cumulative = 0
  const segments = allocations.map((a, i) => {
    const length = a.weight * C
    const seg = { ...a, length, offset: -cumulative, idx: i }
    cumulative += length
    return seg
  })

  const active = hovered ? allocations.find((a) => a.id === hovered) : undefined

  return (
    <div className="relative w-full max-w-[320px] mx-auto" style={{ aspectRatio: "1" }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 w-full h-full"
        role="img"
        aria-label="Allocation breakdown"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgb(24 24 27)"
          strokeWidth={stroke}
        />
        {segments.map((seg) => {
          const isActive = hovered === seg.id
          const isDimmed = hovered !== null && hovered !== seg.id
          return (
            <circle
              key={seg.id}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={isActive ? LAVENDER : SLICE_FILL(seg.idx)}
              strokeWidth={stroke}
              strokeDasharray={`${seg.length} ${C - seg.length}`}
              strokeDashoffset={seg.offset}
              opacity={isDimmed ? 0.28 : 1}
              className="transition-[stroke,opacity] duration-150 cursor-pointer"
              onMouseEnter={() => onHover(seg.id)}
              onMouseLeave={() => onHover(null)}
            />
          )
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {active ? (
          <>
            <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/50">
              {active.name}
            </p>
            <p
              className="mt-1.5 text-[28px] font-medium tracking-tight tabular-nums"
              style={{ color: LAVENDER }}
            >
              {formatPct(active.weight, 0)}
            </p>
            <p className="mt-1.5 text-xs text-white/45 tabular-nums">
              ${formatUSD(active.weight * total)}
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/45">
              Total
            </p>
            <p className="mt-1.5 text-[28px] font-medium tracking-tight tabular-nums text-white">
              <span style={{ color: LAVENDER }}>$</span>
              {formatUSD(total)}
            </p>
            <p className="mt-1.5 text-xs text-white/45">
              {allocations.length} strategies
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// List
// ────────────────────────────────────────────────────────────────────────────

function List({
  allocations,
  total,
  hovered,
  onHover,
}: {
  allocations: Allocation[]
  total: number
  hovered: string | null
  onHover: (id: string | null) => void
}) {
  return (
    <div className="-mx-3 sm:-mx-4">
      {allocations.map((a, i) => {
        const isActive = hovered === a.id
        const isDimmed = hovered !== null && !isActive
        return (
          <button
            key={a.id}
            type="button"
            onMouseEnter={() => onHover(a.id)}
            onMouseLeave={() => onHover(null)}
            aria-pressed={isActive}
            className={`w-full text-left flex items-start gap-4 px-3 sm:px-4 py-4 rounded-[4px] outline-none transition-[background-color,opacity] duration-150 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
              isActive ? "bg-zinc-900" : "hover:bg-zinc-900"
            } ${isDimmed ? "opacity-50" : ""}`}
          >
            <span
              aria-hidden
              className="w-2 h-2 rounded-[1px] mt-[7px] shrink-0 transition-colors"
              style={{
                backgroundColor: isActive ? LAVENDER : SLICE_FILL(i),
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <p className="text-[15px] font-medium tracking-tight text-white truncate">
                  {a.name}
                </p>
                <p className="text-[15px] font-medium tabular-nums text-white">
                  {formatPct(a.weight, 0)}
                </p>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs text-white/45 truncate">
                  <span className="tabular-nums">${formatUSD(a.weight * total)}</span>
                  <span className="text-white/30"> · {a.description}</span>
                </p>
                <p className="text-xs text-white/45 tabular-nums shrink-0">
                  {formatPct(a.apy)} APY
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function AllocationsPage() {
  const [hovered, setHovered] = useState<string | null>(null)

  const { client } = useSmartAccountClient({})
  const walletAddress = client?.account?.address as `0x${string}` | undefined
  const { total } = useBalance(walletAddress, { enabled: !!walletAddress })
  const balance = parseFloat(total) || 0

  const allocations = ALLOCATIONS
  const aggregateAPY = allocations.reduce((s, a) => s + a.weight * a.apy, 0)

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-[1100px] mx-auto">
        {/* Header */}
        <header className="mb-10 sm:mb-14">
          <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-white mb-2.5">
            Allocations
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-white/55 max-w-xl">
            Visual breakdown of your yUSD holdings across yield strategies.
          </p>
        </header>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_1fr] gap-10 sm:gap-12 lg:gap-16 items-start">
          <Donut
            allocations={allocations}
            total={balance}
            hovered={hovered}
            onHover={setHovered}
          />

          <List
            allocations={allocations}
            total={balance}
            hovered={hovered}
            onHover={setHovered}
          />
        </div>

        {/* Aggregate footer */}
        <div className="mt-12 sm:mt-16 flex items-center gap-3">
          <span
            aria-hidden
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: LAVENDER }}
          />
          <span className="text-sm tracking-tight text-white/55">Aggregate yield</span>
          <span className="text-sm font-medium tracking-tight tabular-nums text-white">
            {formatPct(aggregateAPY)} APY
          </span>
        </div>
      </div>
    </div>
  )
}
