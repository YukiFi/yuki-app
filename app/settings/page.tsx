"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLogout } from "@account-kit/react"
import { ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"

const LAVENDER = "#e1a8f0"

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

function Row({
  label,
  description,
  children,
  hover = false,
}: {
  label: string
  description?: string
  children?: React.ReactNode
  hover?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-4 px-3 sm:px-4 py-4 rounded-[4px] transition-colors ${
        hover ? "hover:bg-zinc-900" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium tracking-tight text-white">{label}</p>
        {description && (
          <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
    </div>
  )
}

function EditableRow({
  label,
  description,
  value,
  placeholder,
  field,
  walletAddress,
  onSaved,
  prefix,
  transform = (v: string) => v,
}: {
  label: string
  description?: string
  value: string
  placeholder: string
  field: "username" | "displayName"
  walletAddress: string | undefined
  onSaved: () => void
  prefix?: string
  transform?: (v: string) => string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = () => {
    const initial = field === "username" ? value.replace(/^@/, "") : value
    setDraft(initial)
    setError(null)
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    setError(null)
  }

  const save = async () => {
    if (!walletAddress) {
      setError("No wallet connected.")
      return
    }
    const trimmed = draft.trim()
    if (!trimmed) {
      setError("Can't be empty.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, [field]: trimmed }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || "Couldn't save changes.")
      }
      onSaved()
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save changes.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-start gap-4 px-3 sm:px-4 py-4 rounded-[4px]">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium tracking-tight text-white">{label}</p>
        {description && (
          <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{description}</p>
        )}
        {error && <p className="text-xs text-red-300/80 mt-2">{error}</p>}
      </div>

      {editing ? (
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-zinc-800 rounded-[4px] focus-within:shadow-[0_0_0_2px_#e1a8f0] transition-shadow">
            {prefix && (
              <span style={{ color: LAVENDER }} className="pl-2.5 pr-1 text-sm">
                {prefix}
              </span>
            )}
            <input
              type="text"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(transform(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") save()
                if (e.key === "Escape") cancel()
              }}
              placeholder={placeholder}
              disabled={saving}
              className={`h-9 ${prefix ? "pl-0 pr-2.5" : "px-2.5"} w-[160px] sm:w-[200px] bg-transparent text-[14px] text-white outline-none placeholder:text-white/30`}
            />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{ backgroundColor: LAVENDER }}
            className="h-9 px-3 rounded-[4px] text-xs font-semibold tracking-tight text-black outline-none transition-[box-shadow,filter,opacity] hover:brightness-105 hover:shadow-[0_0_20px_-4px_rgba(225,168,240,0.5)] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            {saving ? "…" : "Save"}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            className="h-9 px-3 rounded-[4px] bg-zinc-900 text-xs font-medium tracking-tight text-white/65 outline-none transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 shrink-0">
          <p className="text-[14px] text-white truncate max-w-[180px] sm:max-w-[240px]">
            {value || <span className="text-white/30">{placeholder}</span>}
          </p>
          <button
            type="button"
            onClick={start}
            className="text-xs tracking-tight text-white/55 outline-none transition-colors hover:text-white focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0] rounded-sm"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, walletAddress, refreshUser } = useAuth()
  const { logout } = useLogout()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const username = user?.username
    ? user.username.startsWith("@")
      ? user.username
      : `@${user.username}`
    : ""
  const displayName = user?.displayName || ""
  const email = user?.email || ""

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await logout()
    } finally {
      router.push("/")
    }
  }

  const tips = [
    "Never share your passkey or recovery phrase with anyone.",
    "Verify the recipient and amount before signing any transaction.",
    "Keep your device unlock and biometrics up to date.",
  ]

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-[800px] mx-auto">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-white mb-2.5">
            Settings
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-white/55 max-w-xl">
            Manage your profile, network, and security from one place.
          </p>
        </header>

        <div className="-mx-3 sm:-mx-4">
          {/* Profile */}
          <section>
            <GroupHeader label="Profile" />
            <EditableRow
              label="Username"
              description="Used to receive money and identify you publicly."
              value={username}
              placeholder="username"
              field="username"
              walletAddress={walletAddress}
              onSaved={refreshUser}
              prefix="@"
              transform={(v) => v.replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, "")}
            />
            <EditableRow
              label="Display name"
              description="Shown next to your username on your profile."
              value={displayName}
              placeholder="Your name"
              field="displayName"
              walletAddress={walletAddress}
              onSaved={refreshUser}
            />
            <Row
              label="Email"
              description="Managed by your sign-in provider."
            >
              <p className="text-[14px] text-white truncate max-w-[200px] sm:max-w-[260px]">
                {email || <span className="text-white/30">Not set</span>}
              </p>
            </Row>
          </section>

          {/* Network */}
          <section>
            <GroupHeader label="Network" />
            <Row
              label="Connected network"
              description="Your wallet operates on this chain."
            >
              <p className="text-[14px] text-white">Base Mainnet</p>
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: LAVENDER }}
                />
                <span className="text-xs tabular-nums text-white/55">Connected</span>
              </span>
            </Row>
          </section>

          {/* Security */}
          <section>
            <GroupHeader label="Security" />
            <Link
              href="/settings/security"
              className="block rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
            >
              <Row
                hover
                label="Smart wallet"
                description="Secured by passkey on this device."
              >
                <span className="text-[13px] text-white/55">Manage</span>
                <ChevronRight className="w-4 h-4 text-white/35" aria-hidden />
              </Row>
            </Link>
            <div className="px-3 sm:px-4 pt-2 pb-4">
              <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/35 mb-2">
                Tips
              </p>
              <ul className="space-y-1.5">
                {tips.map((t, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 text-xs leading-relaxed text-white/55"
                  >
                    <span aria-hidden className="text-white/30">·</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Account */}
          <section>
            <GroupHeader label="Account" />
            <Row
              label="Sign out"
              description="End your session on this device."
            >
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center justify-center h-9 px-4 rounded-[4px] bg-zinc-900 text-sm font-medium tracking-tight text-white outline-none transition-colors hover:bg-zinc-800 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </Row>
          </section>
        </div>
      </div>
    </div>
  )
}
