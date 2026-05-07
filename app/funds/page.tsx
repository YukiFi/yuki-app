"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { useSmartAccountClient } from "@account-kit/react"
import { useBalance } from "@/lib/hooks/useBalance"
import { OnrampComparison } from "@/components/onramp/OnrampComparison"
import { ProviderModal } from "@/components/onramp/ProviderModal"
import { InboundAddTab } from "@/components/funds/InboundAddTab"
import type { OnrampQuote } from "@/lib/types/onramp"

const LAVENDER = "#e1a8f0"

// Sub-phase 2a feature flag. When off (default), the Add tab renders the
// legacy single-input + OnrampComparison flow unchanged. When on, the Add
// tab renders the three-path InboundAddTab and the layout-level
// ArrivalListener handles arrival → DB write → auto-deposit UserOp.
const INBOUND_V2 = process.env.NEXT_PUBLIC_INBOUND_V2 === "1"

type Mode = "add" | "withdraw"
type Step = "input" | "confirm" | "success"

const QUICK_PICKS = [50, 100, 250, 500]

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatUSD(v: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function FundsPage() {
  const router = useRouter()
  const { client } = useSmartAccountClient({})
  const walletAddress = client?.account?.address as `0x${string}` | undefined
  const { balance: total, refetch } = useBalance(walletAddress, {
    enabled: !!walletAddress,
  })
  const balance = parseFloat(total) || 0

  const [mode, setMode] = useState<Mode>("add")
  const [step, setStep] = useState<Step>("input")
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [showProviderModal, setShowProviderModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedQuote, setSelectedQuote] = useState<OnrampQuote | null>(null)

  const numeric = parseFloat(amount) || 0
  const overBalance = mode === "withdraw" && numeric > balance
  const canContinue = numeric > 0 && !overBalance

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, "")
    const parts = val.split(".")
    if (parts.length > 2) return
    if (parts[1]?.length > 2) return
    setAmount(val)
  }

  const switchMode = (next: Mode) => {
    if (next === mode) return
    setMode(next)
    setAmount("")
    setStep("input")
  }

  const onSelectProvider = (provider: string, quote: OnrampQuote) => {
    setSelectedProvider(provider)
    setSelectedQuote(quote)
    setShowProviderModal(true)
  }

  const onProviderSuccess = () => {
    setShowProviderModal(false)
    setStep("success")
    refetch()
  }

  const confirmWithdraw = async () => {
    if (!canContinue) return
    setSubmitting(true)
    // In production this would broadcast a withdrawal transaction.
    setTimeout(() => {
      setSubmitting(false)
      setStep("success")
      refetch()
    }, 1400)
  }

  const close = () => {
    router.push("/")
  }

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-[600px] mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/45 mb-8 rounded-sm outline-none transition-colors hover:text-white focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
          Back to home
        </Link>

        {/* Header */}
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-white mb-2.5">
            Funds
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-white/55 max-w-xl">
            Add money to your balance, or move it to your bank.
          </p>
        </header>

        {/* Mode segmented toggle */}
        {step === "input" && (
          <div
            role="tablist"
            aria-label="Funds action"
            className="inline-flex bg-zinc-900 rounded-[6px] p-1 mb-8"
          >
            {(["add", "withdraw"] as const).map((m) => {
              const active = mode === m
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchMode(m)}
                  className={`h-8 px-4 rounded-[4px] text-sm font-medium tracking-tight outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
                    active
                      ? "bg-zinc-800 text-white"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  {m === "add" ? "Add" : "Withdraw"}
                </button>
              )
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Sub-phase 2a inbound-V2: when the flag is on and the user is on
              the Add tab, render the new three-path tab. The Withdraw tab is
              unchanged here (it still uses the legacy single-input flow);
              sub-phase 2b rebuilds it for off-ramp. */}
          {step === "input" && INBOUND_V2 && mode === "add" && (
            <motion.div
              key="inbound-v2-add"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <InboundAddTab walletAddress={walletAddress} />
            </motion.div>
          )}

          {step === "input" && !(INBOUND_V2 && mode === "add") && (
            <motion.div
              key={`input-${mode}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {/* Amount input */}
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/35 mb-3">
                  {mode === "add" ? "Amount to add" : "Amount to withdraw"}
                </p>
                <div className="flex items-baseline mb-4">
                  <span
                    style={{ color: LAVENDER }}
                    className="text-5xl sm:text-6xl font-light"
                  >
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="bg-transparent text-white text-5xl sm:text-6xl font-light w-full outline-none placeholder:text-white/20 tabular-nums"
                  />
                </div>

                <div className="flex items-center justify-between min-h-[20px]">
                  {mode === "withdraw" && (
                    <p className="text-xs text-white/45 tabular-nums">
                      Available{" "}
                      <span className="text-white/65">${formatUSD(balance)}</span>
                    </p>
                  )}
                  {mode === "add" && <span />}
                  {overBalance && (
                    <p className="text-xs text-red-300/80">
                      Exceeds available balance.
                    </p>
                  )}
                </div>
              </div>

              {/* Quick picks */}
              <div className="grid grid-cols-4 gap-2 mb-7">
                {QUICK_PICKS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(String(v))}
                    className="h-9 rounded-[4px] bg-zinc-900 text-sm font-medium tracking-tight text-white/70 outline-none transition-colors hover:bg-zinc-800 hover:text-white tabular-nums focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    ${v}
                  </button>
                ))}
              </div>

              {/* Mode-specific body */}
              {mode === "add" ? (
                numeric > 0 ? (
                  <section>
                    <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/35 mb-5">
                      Providers
                    </p>
                    <OnrampComparison
                      amount={numeric}
                      onSelectProvider={onSelectProvider}
                    />
                  </section>
                ) : (
                  <p className="text-sm text-white/45">
                    Enter an amount to compare onramp providers.
                  </p>
                )
              ) : (
                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={() => setStep("confirm")}
                  style={canContinue ? { backgroundColor: LAVENDER } : undefined}
                  className={`inline-flex w-full h-11 items-center justify-center rounded-[4px] text-sm font-semibold tracking-tight outline-none transition-[box-shadow,filter,opacity,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                    canContinue
                      ? "text-black hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)]"
                      : "bg-zinc-800 text-white/40 cursor-not-allowed"
                  }`}
                >
                  Continue
                </button>
              )}
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/35 mb-4">
                Review
              </p>
              <p className="text-5xl sm:text-6xl font-light tracking-tight tabular-nums text-white mb-2">
                <span style={{ color: LAVENDER }}>$</span>
                {formatUSD(numeric)}
              </p>
              <p className="text-sm text-white/55 mb-7">
                Withdraw to your bank account.
              </p>

              <div className="-mx-3 sm:-mx-4 mb-8">
                <div className="flex items-center justify-between gap-4 px-3 sm:px-4 py-3.5">
                  <p className="text-[14px] text-white/55">Arrival</p>
                  <p className="text-[14px] text-white">1–3 business days</p>
                </div>
                <div className="flex items-center justify-between gap-4 px-3 sm:px-4 py-3.5">
                  <p className="text-[14px] text-white/55">Network fee</p>
                  <p className="text-[14px] text-white">Free</p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep("input")}
                  disabled={submitting}
                  className="inline-flex h-11 px-5 items-center justify-center rounded-[4px] bg-zinc-900 text-sm font-medium tracking-tight text-white/70 outline-none transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={confirmWithdraw}
                  disabled={submitting}
                  style={{ backgroundColor: LAVENDER }}
                  className="inline-flex flex-1 h-11 items-center justify-center rounded-[4px] text-sm font-semibold tracking-tight text-black outline-none transition-[box-shadow,filter,opacity] duration-150 hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  {submitting ? "Sending…" : "Confirm withdrawal"}
                </button>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(225,168,240,0.12)" }}
              >
                <svg
                  className="w-6 h-6"
                  style={{ color: LAVENDER }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <p className="text-base font-medium tracking-tight text-white">
                {mode === "add" ? "Funds on the way" : "Withdrawal sent"}
              </p>
              <p className="text-sm text-white/45 mt-1 tabular-nums">
                ${formatUSD(numeric)}
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-6 inline-flex h-9 px-4 items-center justify-center rounded-[4px] bg-zinc-900 text-sm font-medium tracking-tight text-white/70 outline-none transition-colors hover:bg-zinc-800 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                Back to dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProviderModal
        isOpen={showProviderModal}
        provider={selectedProvider}
        quote={selectedQuote}
        walletAddress={walletAddress || ""}
        onClose={() => setShowProviderModal(false)}
        onSuccess={onProviderSuccess}
      />
    </div>
  )
}
