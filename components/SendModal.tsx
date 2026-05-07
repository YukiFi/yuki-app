"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowUpRight, Check, X } from "lucide-react"
import {
  useSendUserOperation,
  useSmartAccountClient,
} from "@account-kit/react"
import { encodeFunctionData, erc20Abi, parseUnits } from "viem"
import {
  USDC_ADDRESS,
  USDC_DECIMALS,
  getUSDCBalance,
} from "@/lib/transactions/sendYUSD"

const LAVENDER = "#e1a8f0"

interface SendModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (txHash: string) => void
}

type Step = "compose" | "confirm" | "sending" | "success" | "error"

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
      setStep("success")
      onSuccess?.(hash)
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
      }, 200)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => recipientInputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [isOpen])

  // Fetch USDC balance on open
  useEffect(() => {
    if (!isOpen || !walletAddress) return
    let cancelled = false
    getUSDCBalance(walletAddress)
      .then((bal) => {
        if (!cancelled) setBalance(bal)
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
    try {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [
          resolved.walletAddress as `0x${string}`,
          parseUnits(amount, USDC_DECIMALS),
        ],
      })
      await sendUserOperationAsync({
        uo: {
          target: USDC_ADDRESS,
          data,
          value: 0n,
        },
      })
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
                  className="text-center py-6"
                >
                  <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 bg-zinc-800">
                    <span
                      aria-hidden
                      className="inline-block w-5 h-5 border-2 rounded-full animate-spin"
                      style={{
                        borderColor: "rgba(225,168,240,0.25)",
                        borderTopColor: LAVENDER,
                      }}
                    />
                  </div>
                  <p className="text-base font-medium tracking-tight text-white">
                    Sending…
                  </p>
                  <p className="text-sm text-white/45 mt-1 tabular-nums">
                    ${formatUSD(numericAmount)} to {recipientLabel}
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
                  className="text-center py-4"
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
                    Sent
                  </p>
                  <p className="text-sm text-white/55 mt-1 tabular-nums">
                    ${formatUSD(numericAmount)} to {recipientLabel}
                  </p>

                  <div className="flex items-center justify-center gap-2 mt-5">
                    {txHash && (
                      <a
                        href={`https://basescan.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] bg-zinc-800 text-xs font-medium tracking-tight text-white/80 outline-none transition-colors hover:bg-zinc-700 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
                      >
                        {shortHash(txHash)}
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={close}
                      className="inline-flex items-center justify-center h-8 px-3 rounded-[4px] bg-zinc-800 text-xs font-medium tracking-tight text-white/80 outline-none transition-colors hover:bg-zinc-700 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
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
