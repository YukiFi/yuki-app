"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { useSignerStatus, useSmartAccountClient } from "@account-kit/react"
import { Check } from "lucide-react"

const LAVENDER = "#e1a8f0"

const RESERVED = new Set([
  "admin", "root", "support", "help", "yuki", "system", "wallet",
  "api", "www", "mail", "ftp", "localhost", "webmaster", "postmaster",
  "hostmaster", "info", "contact", "abuse", "security", "privacy",
])

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
  "inline-flex items-center justify-center gap-2 w-full h-11 rounded-[4px] text-sm font-semibold tracking-tight text-black outline-none transition-[box-shadow,filter,opacity] duration-150 enabled:hover:brightness-105 enabled:hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)] focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed"

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter()
  const { isConnected, isInitializing } = useSignerStatus()
  const { client } = useSmartAccountClient({})
  const walletAddress = client?.account?.address

  const [username, setUsername] = useState("")
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Send unauth users to /login
  useEffect(() => {
    if (!isInitializing && !isConnected) {
      router.replace("/login")
    }
  }, [isInitializing, isConnected, router])

  // Debounced username availability check
  useEffect(() => {
    if (!username || username.length < 3) {
      setAvailable(null)
      setChecking(false)
      setError(null)
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Letters, numbers, and underscores only")
      setAvailable(null)
      setChecking(false)
      return
    }

    if (RESERVED.has(username.toLowerCase())) {
      setError("That username is reserved")
      setAvailable(false)
      setChecking(false)
      return
    }

    setError(null)
    setChecking(true)
    setAvailable(null)

    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/user/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: username.toLowerCase(), type: "username" }),
        })
        if (!res.ok) {
          setAvailable(false)
          setError("Couldn't check that username")
          return
        }
        const data = (await res.json()) as { exists?: boolean }
        const ok = !data.exists
        setAvailable(ok)
        if (!ok) setError("That username is taken")
      } catch {
        setAvailable(false)
        setError("Couldn't check that username")
      } finally {
        setChecking(false)
      }
    }, 400)

    return () => clearTimeout(t)
  }, [username])

  const canSubmit = !!available && username.length >= 3 && !!walletAddress && !saving

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, walletAddress }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error || "Couldn't save your username")
      }

      try {
        if (walletAddress) {
          sessionStorage.setItem(`onboarding_complete_${walletAddress}`, "true")
        }
      } catch {
        // sessionStorage unavailable; OnboardingGuard will recheck
      }

      setSuccess(true)
      setTimeout(() => {
        router.replace("/")
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your username")
      setSaving(false)
    }
  }

  if ((hasMounted && isInitializing) || !isConnected) {
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
              {success ? (
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
                    Welcome, <span style={{ color: LAVENDER }}>@{username}</span>
                  </p>
                  <p className="text-sm text-white/55 mt-1">Setting up your dashboard…</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-7"
                >
                  <div className="space-y-2.5">
                    <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/50">
                      One last thing
                    </p>
                    <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-white">
                      Pick a username
                    </h1>
                    <p className="text-sm leading-relaxed text-white/55">
                      How others find and pay you on Yuki. Letters, numbers, and underscores.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="username"
                      className="block text-[11px] font-medium uppercase tracking-[0.06em] text-white/50"
                    >
                      Username
                    </label>
                    <div
                      className={`flex items-center bg-zinc-800 rounded-[4px] transition-shadow ${
                        available === true ? "shadow-[0_0_0_1px_rgba(225,168,240,0.45)]" : ""
                      } focus-within:shadow-[0_0_0_2px_#e1a8f0]`}
                    >
                      <span style={{ color: LAVENDER }} className="pl-3.5 pr-1 text-base">
                        @
                      </span>
                      <input
                        id="username"
                        type="text"
                        autoComplete="username"
                        autoFocus
                        required
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
                        }
                        placeholder="username"
                        maxLength={15}
                        disabled={saving}
                        className="flex-1 h-11 bg-transparent text-white text-[15px] outline-none placeholder:text-white/30 disabled:opacity-60"
                      />
                      <div className="pr-3.5 w-7 flex items-center justify-end">
                        {checking && <Spinner className="text-white/40" />}
                        {!checking && available === true && (
                          <Check
                            className="w-4 h-4"
                            style={{ color: LAVENDER }}
                            strokeWidth={2.5}
                            aria-hidden
                          />
                        )}
                      </div>
                    </div>

                    <p
                      role={error ? "alert" : undefined}
                      className={`text-xs leading-relaxed min-h-[1rem] ${
                        error
                          ? "text-red-300/85"
                          : available === true
                          ? "text-white/55"
                          : "text-white/30"
                      }`}
                    >
                      {error
                        ? error
                        : available === true
                        ? `@${username} is available`
                        : checking
                        ? "Checking…"
                        : username && username.length < 3
                        ? "At least 3 characters"
                        : " "}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    style={canSubmit ? { backgroundColor: LAVENDER } : undefined}
                    className={`${PRIMARY} ${canSubmit ? "" : "bg-zinc-800 text-white/40"}`}
                  >
                    {saving ? <Spinner className="text-black" /> : "Continue"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </section>

          <p className="mt-6 text-center text-xs tracking-tight text-white/35 leading-relaxed">
            You can change your username once every 30 days.
          </p>
        </div>
      </main>
    </div>
  )
}
