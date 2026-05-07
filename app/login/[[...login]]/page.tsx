"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  useAuthenticate,
  useSignerStatus,
  useSmartAccountClient,
} from "@account-kit/react"
import { ArrowLeft, Check, Fingerprint } from "lucide-react"

const LAVENDER = "#e1a8f0"

type Step = "email" | "verify" | "passkey" | "success"

// ────────────────────────────────────────────────────────────────────────────
// Primitives
// ────────────────────────────────────────────────────────────────────────────

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
    />
  )
}

const PRIMARY =
  "inline-flex items-center justify-center gap-2 w-full h-11 rounded-[4px] text-sm font-semibold tracking-tight text-black outline-none transition-[box-shadow,filter,opacity] duration-150 enabled:hover:brightness-105 enabled:hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)] focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"

const SECONDARY =
  "inline-flex items-center justify-center gap-2 w-full h-11 rounded-[4px] bg-zinc-800 text-sm font-medium tracking-tight text-white outline-none transition-colors duration-150 enabled:hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"

const TEXT_BTN =
  "inline-flex items-center justify-center h-9 px-2 rounded-[4px] text-xs tracking-tight text-white/55 outline-none transition-colors hover:text-white focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0] disabled:opacity-50 disabled:cursor-not-allowed"

// ────────────────────────────────────────────────────────────────────────────
// OTP input
// ────────────────────────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  autoFocus,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const focus = () => inputRef.current?.focus()

  return (
    <div className="relative" onClick={focus}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-label="One-time code"
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
      />
      <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => {
          const char = value[i] ?? ""
          const isActive = i === Math.min(value.length, 5)
          return (
            <div
              key={i}
              className={`h-12 sm:h-14 rounded-[4px] bg-zinc-800 flex items-center justify-center text-lg sm:text-xl font-medium tabular-nums text-white transition-shadow ${
                isActive ? "shadow-[0_0_0_2px_#e1a8f0]" : ""
              }`}
            >
              {char ||
                (isActive ? (
                  <span
                    aria-hidden
                    className="block w-px h-5 animate-pulse"
                    style={{ backgroundColor: LAVENDER }}
                  />
                ) : (
                  ""
                ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const { authenticate } = useAuthenticate()
  const { isConnected, isInitializing, status } = useSignerStatus()
  const { client } = useSmartAccountClient({})
  const walletAddress = client?.account?.address

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [hasMounted, setHasMounted] = useState(false)
  const manualReturnRef = useRef(false)

  // Avoid hydration mismatch — branch on init state only after first paint.
  useEffect(() => {
    setHasMounted(true)
  }, [])

  const statusStr = status as unknown as string
  const isAwaitingOtp =
    statusStr === "AWAITING_EMAIL_AUTH" || statusStr === "AWAITING_OTP_AUTH"

  // Already connected on mount → success → route
  useEffect(() => {
    if (isInitializing) return
    if (isConnected && (step === "email" || step === "verify")) {
      setStep("success")
    }
  }, [isInitializing, isConnected, step])

  // Signer awaiting OTP but UI hasn't moved
  useEffect(() => {
    if (isAwaitingOtp && step === "email" && !manualReturnRef.current) {
      setStep("verify")
      setCooldown((c) => (c > 0 ? c : 60))
    }
  }, [isAwaitingOtp, step])

  // Cooldown
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Auto-submit at 6 digits
  useEffect(() => {
    if (code.length === 6 && step === "verify" && !loading) {
      void verifyCode()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step])

  // Verified → passkey upsell
  useEffect(() => {
    if (isConnected && step === "verify") {
      setStep("passkey")
    }
  }, [isConnected, step])

  // Success → onboarding-aware redirect (avoids landing on / and bouncing)
  useEffect(() => {
    if (step !== "success") return
    if (!walletAddress) return

    let cancelled = false
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, 500))

    ;(async () => {
      let target = "/setup"
      try {
        const res = await fetch("/api/auth/onboarding-status", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
          body: JSON.stringify({ walletAddress }),
        })
        if (res.ok) {
          const data = (await res.json()) as { completed?: boolean }
          if (data.completed) {
            target = "/"
            try {
              sessionStorage.setItem(`onboarding_complete_${walletAddress}`, "true")
            } catch {
              // sessionStorage unavailable; OnboardingGuard will re-check
            }
          }
        }
      } catch {
        // Network failure → /setup is the safe default for new users
      }

      await minDelay
      if (!cancelled) router.replace(target)
    })()

    return () => {
      cancelled = true
    }
  }, [step, walletAddress, router])

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    setError(null)
    manualReturnRef.current = false
    try {
      await authenticate({ type: "email", email, emailMode: "otp" })
      setStep("verify")
      setCooldown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your code. Try again.")
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode() {
    if (code.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      await authenticate({ type: "otp", otpCode: code })
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work. Try again.")
      setCode("")
    } finally {
      setLoading(false)
    }
  }

  async function resendCode() {
    if (cooldown > 0 || loading) return
    setLoading(true)
    setError(null)
    try {
      await authenticate({ type: "email", email, emailMode: "otp" })
      setCooldown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resend the code.")
    } finally {
      setLoading(false)
    }
  }

  async function passkeyLogin() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      await authenticate({ type: "passkey", createNew: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : "No passkey found. Try email instead.")
    } finally {
      setLoading(false)
    }
  }

  async function createPasskey() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      await authenticate({
        type: "passkey",
        createNew: true,
        username: email || "yuki-user",
      })
      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add a passkey.")
    } finally {
      setLoading(false)
    }
  }

  if (hasMounted && isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Spinner className="w-6 h-6 text-white/40" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="px-5 sm:px-8 py-5 sm:py-6">
        <Link
          href="/"
          aria-label="Yuki home"
          className="inline-flex items-center rounded-[4px] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
        >
          <Image src="/images/applet.svg" alt="Yuki" width={28} height={28} priority />
        </Link>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-5 pt-2 sm:pt-0 pb-16">
        <div className="w-full max-w-[400px]">
          <section className="bg-zinc-900 rounded-md p-7 sm:p-9 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
            <AnimatePresence mode="wait">
              {step === "email" && (
                <motion.form
                  key="email"
                  onSubmit={sendEmail}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-7"
                >
                  <div className="space-y-2.5">
                    <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/50">
                      Welcome
                    </p>
                    <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-white">
                      Sign in to Yuki
                    </h1>
                    <p className="text-sm leading-relaxed text-white/55">
                      Enter your email to continue. We'll create an account if it's new.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-[11px] font-medium uppercase tracking-[0.06em] text-white/50"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={loading}
                      className="w-full h-11 rounded-[4px] bg-zinc-800 px-3.5 text-[15px] text-white placeholder:text-white/30 outline-none transition-shadow focus:shadow-[0_0_0_2px_#e1a8f0] disabled:opacity-60"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="text-sm leading-relaxed text-red-300/90">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!email || loading}
                    style={!email || loading ? undefined : { backgroundColor: LAVENDER }}
                    className={`${PRIMARY} ${!email || loading ? "bg-zinc-800 text-white/40" : ""}`}
                  >
                    {loading ? <Spinner className="text-black" /> : "Continue"}
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-[11px] uppercase tracking-[0.06em] text-white/30">
                      or
                    </span>
                    <span className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  <button
                    type="button"
                    onClick={passkeyLogin}
                    disabled={loading}
                    className={SECONDARY}
                  >
                    <Fingerprint className="w-4 h-4" />
                    Continue with passkey
                  </button>
                </motion.form>
              )}

              {step === "verify" && (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-7"
                >
                  <div className="space-y-2.5">
                    <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/50">
                      Verify
                    </p>
                    <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-white">
                      Check your email
                    </h1>
                    <p className="text-sm leading-relaxed text-white/55">
                      We sent a six-digit code to{" "}
                      <span className="text-white">{email}</span>.
                    </p>
                  </div>

                  <OtpInput value={code} onChange={setCode} autoFocus disabled={loading} />

                  {error && (
                    <p role="alert" className="text-sm leading-relaxed text-red-300/90">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={verifyCode}
                    disabled={code.length !== 6 || loading}
                    style={
                      code.length !== 6 || loading ? undefined : { backgroundColor: LAVENDER }
                    }
                    className={`${PRIMARY} ${
                      code.length !== 6 || loading ? "bg-zinc-800 text-white/40" : ""
                    }`}
                  >
                    {loading ? <Spinner className="text-black" /> : "Verify"}
                  </button>

                  <div className="flex items-center justify-between -mx-2">
                    <button
                      type="button"
                      onClick={() => {
                        manualReturnRef.current = true
                        setStep("email")
                        setCode("")
                        setError(null)
                      }}
                      className={TEXT_BTN}
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      Different email
                    </button>
                    <button
                      type="button"
                      onClick={resendCode}
                      disabled={cooldown > 0 || loading}
                      className={TEXT_BTN}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "passkey" && (
                <motion.div
                  key="passkey"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-7"
                >
                  <div className="space-y-2.5">
                    <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/50">
                      One more step
                    </p>
                    <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-white">
                      Add a passkey
                    </h1>
                    <p className="text-sm leading-relaxed text-white/55">
                      Sign in faster next time with Face ID, Touch ID, or your device unlock.
                    </p>
                  </div>

                  <div className="flex items-start gap-3.5 rounded-[4px] bg-zinc-800 p-4">
                    <div
                      className="shrink-0 w-9 h-9 rounded-[4px] flex items-center justify-center"
                      style={{ backgroundColor: "rgba(225,168,240,0.12)" }}
                    >
                      <Fingerprint className="w-4 h-4" style={{ color: LAVENDER }} />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="text-[14px] font-medium tracking-tight text-white">
                        Biometric authentication
                      </p>
                      <p className="text-xs leading-relaxed text-white/55">
                        Your passkey stays on this device. Hardware-backed and phishing-resistant.
                      </p>
                    </div>
                  </div>

                  {error && (
                    <p role="alert" className="text-sm leading-relaxed text-red-300/90">
                      {error}
                    </p>
                  )}

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={createPasskey}
                      disabled={loading}
                      style={loading ? undefined : { backgroundColor: LAVENDER }}
                      className={`${PRIMARY} ${loading ? "bg-zinc-800 text-white/40" : ""}`}
                    >
                      {loading ? <Spinner className="text-black" /> : "Create passkey"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("success")}
                      disabled={loading}
                      className="inline-flex w-full h-11 items-center justify-center rounded-[4px] text-sm font-medium tracking-tight text-white/55 outline-none transition-colors hover:text-white disabled:opacity-50 focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                    >
                      Skip for now
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
                    You're in
                  </p>
                  <p className="text-sm text-white/55 mt-1">Taking you to your dashboard…</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <p className="mt-6 text-center text-xs tracking-tight text-white/35 leading-relaxed">
            By continuing, you agree to Yuki's{" "}
            <Link href="/legal" className="text-white/60 hover:text-white">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/legal" className="text-white/60 hover:text-white">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
