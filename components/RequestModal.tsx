"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Check, X } from "lucide-react"

const LAVENDER = "#e1a8f0"

type Step = "compose" | "confirm" | "success"

interface RequestModalProps {
  open: boolean
  onClose: () => void
  onSubmit?: (payload: { amount: number; from: string }) => void
}

function formatUSD(v: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function RequestModal({ open, onClose, onSubmit }: RequestModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>("compose")
  const [amount, setAmount] = useState("")
  const [from, setFrom] = useState("")

  const numeric = parseFloat(amount) || 0
  const canSend = numeric > 0
  const fromLabel = from ? `@${from}` : "anyone"

  useEffect(() => {
    if (open && step === "compose") {
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open, step])

  const reset = () => {
    setAmount("")
    setFrom("")
    setStep("compose")
  }

  const handleClose = () => {
    onClose()
    setTimeout(reset, 200)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, "")
    const parts = val.split(".")
    if (parts.length > 2) return
    if (parts[1]?.length > 2) return
    setAmount(val)
  }

  const handleConfirm = () => {
    onSubmit?.({ amount: numeric, from })
    setStep("success")
    setTimeout(handleClose, 1500)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/70" />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-[420px] bg-zinc-900 rounded-md p-7 sm:p-8 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
          >
            <AnimatePresence mode="wait">
              {step === "compose" && (
                <motion.div
                  key="compose"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/50">
                      Request
                    </p>
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-white/40 outline-none transition-colors hover:bg-zinc-800 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-baseline mb-6">
                    <span style={{ color: LAVENDER }} className="text-4xl sm:text-5xl font-light">
                      $
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0"
                      className="bg-transparent text-white text-4xl sm:text-5xl font-light w-full outline-none placeholder:text-white/20 tabular-nums"
                    />
                  </div>

                  <div className="space-y-2 mb-6">
                    <label
                      htmlFor="request-from"
                      className="block text-[11px] font-medium uppercase tracking-[0.06em] text-white/50"
                    >
                      From{" "}
                      <span className="text-white/30 normal-case tracking-normal">
                        (optional)
                      </span>
                    </label>
                    <div className="flex items-center bg-zinc-800 rounded-[4px] focus-within:shadow-[0_0_0_2px_#e1a8f0] transition-shadow">
                      <span style={{ color: LAVENDER }} className="pl-3 pr-1 text-base">
                        @
                      </span>
                      <input
                        id="request-from"
                        type="text"
                        value={from}
                        onChange={(e) =>
                          setFrom(
                            e.target.value
                              .replace(/^@/, "")
                              .replace(/[^a-zA-Z0-9_]/g, ""),
                          )
                        }
                        placeholder="anyone"
                        className="flex-1 h-11 pr-3 bg-transparent text-white text-[15px] outline-none placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => canSend && setStep("confirm")}
                    disabled={!canSend}
                    style={canSend ? { backgroundColor: LAVENDER } : undefined}
                    className={`inline-flex w-full h-11 items-center justify-center rounded-[4px] text-sm font-semibold tracking-tight outline-none transition-[box-shadow,filter,opacity,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
                      canSend
                        ? "text-black hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)]"
                        : "bg-zinc-800 text-white/40 cursor-not-allowed"
                    }`}
                  >
                    {canSend ? "Continue" : "Enter amount"}
                  </button>
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
                  <div className="flex items-center justify-between mb-6">
                    <button
                      type="button"
                      onClick={() => setStep("compose")}
                      aria-label="Back"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-white/50 outline-none transition-colors hover:bg-zinc-800 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-white/40 outline-none transition-colors hover:bg-zinc-800 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/50 mb-2">
                    Requesting
                  </p>
                  <p className="text-4xl sm:text-5xl font-light tracking-tight tabular-nums text-white">
                    <span style={{ color: LAVENDER }}>$</span>
                    {formatUSD(numeric)}
                  </p>
                  <p className="text-sm text-white/55 mt-2 mb-7">
                    From <span className="text-white">{fromLabel}</span>
                  </p>

                  <button
                    type="button"
                    onClick={handleConfirm}
                    style={{ backgroundColor: LAVENDER }}
                    className="inline-flex w-full h-11 items-center justify-center rounded-[4px] text-sm font-semibold tracking-tight text-black outline-none transition-[box-shadow,filter] duration-150 hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)] focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                  >
                    Send request
                  </button>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="py-3 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                    className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: "rgba(225,168,240,0.12)" }}
                  >
                    <Check className="w-6 h-6" style={{ color: LAVENDER }} strokeWidth={2.5} />
                  </motion.div>
                  <p className="text-base font-medium tracking-tight text-white">
                    Request sent
                  </p>
                  <p className="text-sm text-white/45 mt-1 tabular-nums">
                    ${formatUSD(numeric)} from {fromLabel}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
