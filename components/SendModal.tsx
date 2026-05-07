"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowUpRight, Check, Copy, X } from "lucide-react"
import {
  useSendUserOperation,
  useSmartAccountClient,
} from "@account-kit/react"
import { buildTransfer, getBalance as getYusdBalance } from "@/lib/yusd"
import { DEMO_MODE, demoStore } from "@/lib/demo-fixtures"

const LAVENDER = "#e1a8f0"

interface SendModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (txHash: string) => void
}

type Step = "compose" | "confirm" | "sending" | "success" | "error"
type SendPhase = "signing" | "submitting" | "confirming" | "confirmed"

type ResolvedUser = {
  walletAddress: string
  username: string
  displayName?: string
  avatarUrl?: string
}

type Contact = {
  id: string
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  walletAddress: string
  nickname: string | null
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

function withAtSign(u: string) {
  return u.startsWith("@") ? u : `@${u}`
}

function getInitial(displayName: string | null | undefined, username: string) {
  const source = displayName || username.replace(/^@/, "")
  return source.charAt(0).toUpperCase() || "·"
}

function shortHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`
}

// ────────────────────────────────────────────────────────────────────────────
// Avatar
// ────────────────────────────────────────────────────────────────────────────

function Avatar({
  url,
  fallback,
  size = 32,
}: {
  url: string | null | undefined
  fallback: string
  size?: number
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="rounded-[4px] object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-[4px] bg-zinc-800 text-white/85 flex items-center justify-center shrink-0 text-xs font-semibold tracking-tight"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {fallback}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Stepper row (used in the sending state)
// ────────────────────────────────────────────────────────────────────────────

function StepRow({
  label,
  hint,
  state,
}: {
  label: string
  hint?: string
  state: "pending" | "active" | "done"
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div
        aria-hidden
        className="relative w-[18px] h-[18px] flex items-center justify-center shrink-0 mt-[2px]"
      >
        {state === "pending" && (
          <span className="block w-3.5 h-3.5 rounded-full border border-white/15" />
        )}
        {state === "active" && (
          <span
            className="block w-3.5 h-3.5 rounded-full border-2 animate-spin"
            style={{
              borderColor: "rgba(225,168,240,0.25)",
              borderTopColor: LAVENDER,
            }}
          />
        )}
        {state === "done" && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex items-center justify-center w-[18px] h-[18px] rounded-full"
            style={{ backgroundColor: "rgba(225,168,240,0.18)" }}
          >
            <Check className="w-2.5 h-2.5" style={{ color: LAVENDER }} strokeWidth={3.5} />
          </motion.span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-[13px] tracking-tight transition-colors duration-200 ${
            state === "pending"
              ? "text-white/35"
              : state === "active"
                ? "text-white"
                : "text-white/65"
          }`}
        >
          {label}
        </p>
        {hint && state === "active" && (
          <p className="text-[11px] text-white/40 mt-0.5">{hint}</p>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Detail row (used in the success state)
// ────────────────────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <p className="text-[13px] text-white/55">{label}</p>
      <div className="text-[13px] text-white">{value}</div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Modal
// ────────────────────────────────────────────────────────────────────────────

export function SendModal({ isOpen, onClose, onSuccess }: SendModalProps) {
  const recipientInputRef = useRef<HTMLInputElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)

  const { client } = useSmartAccountClient({})
  const walletAddress = client?.account?.address as `0x${string}` | undefined

  const { sendUserOperationAsync } = useSendUserOperation({
    client,
    waitForTxn: true,
    onSuccess: ({ hash }) => {
      setTxHash(hash)
      setPhase("confirmed")
      setConfirmedAt(Date.now())
      // Brief beat so all stepper rows show "done" before celebrating
      setTimeout(() => {
        setStep("success")
        onSuccess?.(hash)
      }, 550)
    },
    onError: (err) => {
      setError(err.message || "Transaction failed.")
      setStep("error")
    },
  })

  const [step, setStep] = useState<Step>("compose")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [resolved, setResolved] = useState<ResolvedUser | null>(null)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const [balance, setBalance] = useState<string>("0")
  const [contacts, setContacts] = useState<Contact[]>([])

  const [phase, setPhase] = useState<SendPhase>("signing")
  const [sendStartedAt, setSendStartedAt] = useState<number | null>(null)
  const [confirmedAt, setConfirmedAt] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const numericAmount = parseFloat(amount) || 0
  const availableBalance = parseFloat(balance) || 0

  const isSelf =
    !!resolved?.walletAddress &&
    !!walletAddress &&
    resolved.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  const overBalance = numericAmount > availableBalance
  const recipientReady = !!resolved && !isSelf
  const amountReady = numericAmount > 0 && !overBalance
  const canContinue = recipientReady && amountReady

  // Reset state on open / close
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setStep("compose")
        setRecipient("")
        setAmount("")
        setResolved(null)
        setError(null)
        setTxHash(null)
        setPhase("signing")
        setSendStartedAt(null)
        setConfirmedAt(null)
        setCopied(false)
      }, 200)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => recipientInputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [isOpen])

  // Fetch yUSD balance on open. In demo mode, subscribe to the shared store
  // so this modal reflects the same balance as every other widget.
  useEffect(() => {
    if (!isOpen || !walletAddress) return
    if (DEMO_MODE) {
      setBalance(demoStore.getBalance().total)
      const unsubscribe = demoStore.subscribe(() => {
        setBalance(demoStore.getBalance().total)
      })
      return unsubscribe
    }
    let cancelled = false
    getYusdBalance(walletAddress)
      .then((b) => {
        if (!cancelled) setBalance(b.assets)
      })
      .catch(() => {
        if (!cancelled) setBalance("0")
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, walletAddress])

  // Load saved contacts on open (lightweight — used as quick-pick chips)
  useEffect(() => {
    if (!isOpen || !walletAddress) return
    let cancelled = false
    fetch("/api/contacts", {
      headers: { "x-wallet-address": walletAddress },
    })
      .then((r) => (r.ok ? r.json() : { contacts: [] }))
      .then((data) => {
        if (!cancelled) setContacts((data?.contacts ?? []) as Contact[])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isOpen, walletAddress])

  // Phase timeline while sending — advances through signing → submitting → confirming.
  // Final phase ("confirmed") is set by the success handler (real or demo).
  useEffect(() => {
    if (step !== "sending") return
    const t1 = setTimeout(() => {
      setPhase((p) => (p === "signing" ? "submitting" : p))
    }, 600)
    const t2 = setTimeout(() => {
      setPhase((p) => (p === "submitting" ? "confirming" : p))
    }, 1700)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [step])

  // Resolve recipient (debounced)
  useEffect(() => {
    if (!recipient || recipient.length < 3) {
      setResolved(null)
      setResolving(false)
      return
    }
    setResolving(true)
    let cancelled = false
    const id = setTimeout(async () => {
      try {
        const res = await fetch("/api/user/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: recipient }),
        })
        if (cancelled) return
        if (res.ok) {
          const data = (await res.json()) as ResolvedUser
          setResolved(data)
        } else {
          setResolved(null)
        }
      } catch {
        if (!cancelled) setResolved(null)
      } finally {
        if (!cancelled) setResolving(false)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [recipient])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, "")
    const parts = val.split(".")
    if (parts.length > 2) return
    if (parts[1]?.length > 2) return
    setAmount(val)
  }

  const pickContact = (c: Contact) => {
    setRecipient(c.username.replace(/^@/, ""))
    setResolved({
      walletAddress: c.walletAddress,
      username: c.username,
      displayName: c.displayName || undefined,
      avatarUrl: c.avatarUrl || undefined,
    })
    setTimeout(() => amountInputRef.current?.focus(), 50)
  }

  const close = () => {
    if (step === "sending") return
    onClose()
  }

  const handleContinue = () => {
    setError(null)
    if (!resolved) return setError("User not found.")
    if (isSelf) return setError("You can't send to yourself.")
    if (numericAmount <= 0) return setError("Enter an amount.")
    if (overBalance) return setError("Insufficient balance.")
    setStep("confirm")
  }

  const handleSend = async () => {
    if (!resolved?.walletAddress) {
      setError("No recipient address.")
      return
    }
    setStep("sending")
    setError(null)
    setPhase("signing")
    setSendStartedAt(Date.now())
    setConfirmedAt(null)

    if (DEMO_MODE) {
      const fakeHash = `0xdemo${Date.now().toString(16).padStart(60, "0")}` as `0x${string}`
      // Walk through the same timeline the timer effect drives, then "confirm".
      await new Promise((r) => setTimeout(r, 2400))
      // Write through the shared demo store: debits balance + prepends a tx,
      // notifying every other balance/activity widget.
      demoStore.recordSend({
        counterparty: resolved.walletAddress,
        counterpartyLabel: withAtSign(resolved.username),
        amount: numericAmount,
        txHash: fakeHash,
      })
      setPhase("confirmed")
      setConfirmedAt(Date.now())
      setTxHash(fakeHash)
      await new Promise((r) => setTimeout(r, 550))
      setStep("success")
      onSuccess?.(fakeHash)
      return
    }

    try {
      const call = buildTransfer(resolved.walletAddress as `0x${string}`, amount)
      await sendUserOperationAsync({ uo: call })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed.")
      setStep("error")
    }
  }

  const recipientLabel = resolved
    ? withAtSign(resolved.username)
    : recipient
      ? withAtSign(recipient)
      : ""

  const elapsedSeconds =
    sendStartedAt && confirmedAt
      ? ((confirmedAt - sendStartedAt) / 1000).toFixed(1)
      : null

  const isDemoHash = !!txHash && txHash.startsWith("0xdemo")

  const copyHash = async () => {
    if (!txHash) return
    try {
      await navigator.clipboard.writeText(txHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard unavailable — silently no-op
    }
  }

  const sendAnother = () => {
    setStep("compose")
    setAmount("")
    setError(null)
    setTxHash(null)
    setPhase("signing")
    setSendStartedAt(null)
    setConfirmedAt(null)
    setCopied(false)
    setTimeout(() => amountInputRef.current?.focus(), 80)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
          onClick={close}
        >
          <div className="absolute inset-0 bg-black/70" />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-[440px] bg-zinc-900 rounded-md p-7 sm:p-8 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
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
                      Send
                    </p>
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Close"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-white/40 outline-none transition-colors hover:bg-zinc-800 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Recipient */}
                  <div className="space-y-2 mb-5">
                    <label
                      htmlFor="send-to"
                      className="block text-[11px] font-medium uppercase tracking-[0.06em] text-white/50"
                    >
                      To
                    </label>
                    <div className="flex items-center bg-zinc-800 rounded-[4px] focus-within:shadow-[0_0_0_2px_#e1a8f0] transition-shadow">
                      <span style={{ color: LAVENDER }} className="pl-3 pr-1 text-base">
                        @
                      </span>
                      <input
                        id="send-to"
                        ref={recipientInputRef}
                        type="text"
                        value={recipient}
                        onChange={(e) =>
                          setRecipient(
                            e.target.value
                              .replace(/^@/, "")
                              .replace(/[^a-zA-Z0-9_]/g, ""),
                          )
                        }
                        placeholder="username"
                        className="flex-1 h-11 pr-3 bg-transparent text-white text-[15px] outline-none placeholder:text-white/30"
                      />
                    </div>

                    {/* Resolution status */}
                    <div className="min-h-[20px]">
                      {recipient.length >= 3 && resolving && (
                        <p className="text-xs text-white/45 flex items-center gap-2">
                          <span className="inline-block w-3 h-3 border-2 border-white/20 border-t-white/55 rounded-full animate-spin" />
                          Looking up {withAtSign(recipient)}…
                        </p>
                      )}
                      {!resolving && resolved && !isSelf && (
                        <div className="flex items-center gap-2.5 text-xs">
                          <Avatar
                            url={resolved.avatarUrl}
                            fallback={getInitial(resolved.displayName, resolved.username)}
                            size={20}
                          />
                          <span className="text-white">
                            {resolved.displayName || withAtSign(resolved.username)}
                          </span>
                          <span style={{ color: LAVENDER }} className="inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Found
                          </span>
                        </div>
                      )}
                      {!resolving && resolved && isSelf && (
                        <p className="text-xs text-red-300/80">
                          You can't send to yourself.
                        </p>
                      )}
                      {!resolving && !resolved && recipient.length >= 3 && (
                        <p className="text-xs text-red-300/80">
                          No user found for {withAtSign(recipient)}.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contacts quick-picks (only when recipient empty) */}
                  {recipient.length === 0 && contacts.length > 0 && (
                    <div className="mb-5">
                      <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/35 mb-2">
                        Contacts
                      </p>
                      <div className="-mx-2 max-h-[160px] overflow-y-auto">
                        {contacts.slice(0, 6).map((c) => {
                          const primary = c.nickname || c.displayName || c.username
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => pickContact(c)}
                              className="w-full flex items-center gap-3 px-2 py-2 rounded-[4px] text-left outline-none transition-colors hover:bg-zinc-800 focus-visible:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
                            >
                              <Avatar
                                url={c.avatarUrl}
                                fallback={getInitial(c.displayName, c.username)}
                                size={28}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium tracking-tight text-white truncate">
                                  {primary}
                                </p>
                                <p className="text-[11px] text-white/45 truncate">
                                  {withAtSign(c.username)}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Amount */}
                  <div className="mb-5">
                    <label
                      htmlFor="send-amount"
                      className="block text-[11px] font-medium uppercase tracking-[0.06em] text-white/50 mb-2"
                    >
                      Amount
                    </label>
                    <div className="flex items-baseline">
                      <span style={{ color: LAVENDER }} className="text-4xl sm:text-5xl font-light">
                        $
                      </span>
                      <input
                        id="send-amount"
                        ref={amountInputRef}
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="bg-transparent text-white text-4xl sm:text-5xl font-light w-full outline-none placeholder:text-white/20 tabular-nums"
                      />
                    </div>
                    <p className="text-xs text-white/45 mt-2 tabular-nums">
                      Available{" "}
                      <span className={overBalance ? "text-red-300/80" : "text-white/65"}>
                        ${formatUSD(availableBalance)}
                      </span>
                      {overBalance && <span className="text-red-300/80"> · over balance</span>}
                    </p>
                  </div>

                  {error && (
                    <p role="alert" className="text-sm text-red-300/80 mb-4">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!canContinue}
                    style={canContinue ? { backgroundColor: LAVENDER } : undefined}
                    className={`inline-flex w-full h-11 items-center justify-center rounded-[4px] text-sm font-semibold tracking-tight outline-none transition-[box-shadow,filter,opacity,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
                      canContinue
                        ? "text-black hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)]"
                        : "bg-zinc-800 text-white/40 cursor-not-allowed"
                    }`}
                  >
                    {!recipientReady
                      ? "Choose recipient"
                      : !amountReady
                        ? "Enter amount"
                        : "Continue"}
                  </button>
                </motion.div>
              )}

              {step === "confirm" && resolved && (
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
                      onClick={close}
                      aria-label="Close"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-white/40 outline-none transition-colors hover:bg-zinc-800 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/50 mb-2">
                    Sending
                  </p>
                  <p className="text-4xl sm:text-5xl font-light tracking-tight tabular-nums text-white mb-3">
                    <span style={{ color: LAVENDER }}>$</span>
                    {formatUSD(numericAmount)}
                  </p>
                  <div className="flex items-center gap-2.5 mb-7">
                    <Avatar
                      url={resolved.avatarUrl}
                      fallback={getInitial(resolved.displayName, resolved.username)}
                      size={24}
                    />
                    <p className="text-sm text-white/55">
                      to <span className="text-white">{recipientLabel}</span>
                      {resolved.displayName && (
                        <span className="text-white/35"> · {resolved.displayName}</span>
                      )}
                    </p>
                  </div>

                  <div className="-mx-3 sm:-mx-4 mb-7">
                    <div className="flex items-center justify-between gap-4 px-3 sm:px-4 py-3">
                      <p className="text-[13px] text-white/55">Network</p>
                      <p className="text-[13px] text-white">Base</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-3 sm:px-4 py-3">
                      <p className="text-[13px] text-white/55">Network fee</p>
                      <p className="text-[13px] text-white">Sponsored</p>
                    </div>
                  </div>

                  {error && (
                    <p role="alert" className="text-sm text-red-300/80 mb-4">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleSend}
                    style={{ backgroundColor: LAVENDER }}
                    className="inline-flex w-full h-11 items-center justify-center rounded-[4px] text-sm font-semibold tracking-tight text-black outline-none transition-[box-shadow,filter] duration-150 hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)] focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                  >
                    Confirm send
                  </button>
                </motion.div>
              )}

              {step === "sending" && (
                <motion.div
                  key="sending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/50">
                      Sending
                    </p>
                    <span className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/30">
                      Don't close
                    </span>
                  </div>

                  <p className="text-4xl sm:text-5xl font-light tracking-tight tabular-nums text-white mb-3">
                    <span style={{ color: LAVENDER }}>$</span>
                    {formatUSD(numericAmount)}
                  </p>
                  {resolved && (
                    <div className="flex items-center gap-2.5 mb-7">
                      <Avatar
                        url={resolved.avatarUrl}
                        fallback={getInitial(resolved.displayName, resolved.username)}
                        size={24}
                      />
                      <p className="text-sm text-white/55">
                        to <span className="text-white">{recipientLabel}</span>
                      </p>
                    </div>
                  )}

                  <div className="rounded-[6px] border border-white/5 bg-zinc-950/40 px-4 py-2 mb-5">
                    <StepRow
                      label="Authorizing"
                      hint="Signing with your smart wallet"
                      state={phase === "signing" ? "active" : "done"}
                    />
                    <StepRow
                      label="Submitting to network"
                      hint="Sending to Base via Alchemy"
                      state={
                        phase === "signing"
                          ? "pending"
                          : phase === "submitting"
                            ? "active"
                            : "done"
                      }
                    />
                    <StepRow
                      label="Waiting for confirmation"
                      hint="Usually under 3 seconds"
                      state={
                        phase === "confirming"
                          ? "active"
                          : phase === "confirmed"
                            ? "done"
                            : "pending"
                      }
                    />
                  </div>

                  <p className="text-[11px] text-white/35 text-center">
                    Funds are released only when confirmed.
                  </p>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/50">
                      Sent
                    </p>
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Close"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-white/40 outline-none transition-colors hover:bg-zinc-800 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center mb-7">
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                      style={{ backgroundColor: "rgba(225,168,240,0.12)" }}
                    >
                      <Check className="w-6 h-6" style={{ color: LAVENDER }} strokeWidth={2.5} />
                    </motion.div>
                    <p className="text-3xl sm:text-4xl font-light tracking-tight tabular-nums text-white">
                      <span style={{ color: LAVENDER }}>$</span>
                      {formatUSD(numericAmount)}
                    </p>
                    {resolved && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-white/55">
                        <span>sent to</span>
                        <Avatar
                          url={resolved.avatarUrl}
                          fallback={getInitial(resolved.displayName, resolved.username)}
                          size={18}
                        />
                        <span className="text-white">{recipientLabel}</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[6px] border border-white/5 bg-zinc-950/40 divide-y divide-white/5 mb-6">
                    <DetailRow label="Network" value="Base" />
                    <DetailRow label="Network fee" value="Sponsored" />
                    {elapsedSeconds && (
                      <DetailRow
                        label="Confirmed in"
                        value={<span className="tabular-nums">{elapsedSeconds}s</span>}
                      />
                    )}
                    {txHash && (
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <p className="text-[13px] text-white/55">Transaction</p>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={copyHash}
                            aria-label="Copy transaction hash"
                            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[4px] bg-zinc-800 text-[12px] font-medium tracking-tight text-white/80 outline-none transition-colors hover:bg-zinc-700 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
                          >
                            <span className="tabular-nums">{shortHash(txHash)}</span>
                            {copied ? (
                              <Check className="w-3 h-3" style={{ color: LAVENDER }} strokeWidth={3} />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          {!isDemoHash && (
                            <a
                              href={`https://basescan.org/tx/${txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="View on BaseScan"
                              className="inline-flex items-center justify-center h-7 w-7 rounded-[4px] bg-zinc-800 text-white/70 outline-none transition-colors hover:bg-zinc-700 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={sendAnother}
                      className="inline-flex flex-1 h-11 items-center justify-center rounded-[4px] bg-zinc-800 text-sm font-medium tracking-tight text-white outline-none transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                    >
                      Send another
                    </button>
                    <button
                      type="button"
                      onClick={close}
                      style={{ backgroundColor: LAVENDER }}
                      className="inline-flex flex-1 h-11 items-center justify-center rounded-[4px] text-sm font-semibold tracking-tight text-black outline-none transition-[box-shadow,filter] duration-150 hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)] focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-center py-2"
                >
                  <p className="text-base font-medium tracking-tight text-white mb-1">
                    Transaction failed
                  </p>
                  <p className="text-sm text-white/55 mb-6 max-w-[320px] mx-auto">
                    {error || "Something went wrong. Try again."}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null)
                        setStep("compose")
                      }}
                      className="inline-flex items-center justify-center h-9 px-4 rounded-[4px] bg-zinc-800 text-sm font-medium tracking-tight text-white outline-none transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
                    >
                      Try again
                    </button>
                    <button
                      type="button"
                      onClick={close}
                      className="inline-flex items-center justify-center h-9 px-4 rounded-[4px] text-sm font-medium tracking-tight text-white/55 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
