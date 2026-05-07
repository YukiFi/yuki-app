"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import {
  Plus,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  X,
} from "lucide-react"
import { useSmartAccountClient } from "@account-kit/react"
import { useTransactionHistory } from "@/lib/hooks/useTransactionHistory"

const LAVENDER = "#e1a8f0"

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

type Contact = {
  id: string
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  walletAddress: string | null
  nickname: string | null
}

type Recent = { handle: string; username?: string }

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function withAtSign(u: string | null | undefined) {
  if (!u) return ""
  return u.startsWith("@") ? u : `@${u}`
}

function profileHrefFor(username: string | null | undefined) {
  if (!username) return undefined
  return `/${username.replace(/^@/, "")}`
}

function getInitial(displayName: string | null, username: string | null) {
  const source = (displayName || username || "").replace(/^@/, "")
  return source.charAt(0).toUpperCase() || "·"
}

// ────────────────────────────────────────────────────────────────────────────
// Avatar
// ────────────────────────────────────────────────────────────────────────────

function Avatar({
  url,
  fallback,
  size = 36,
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
      className="rounded-[4px] bg-zinc-800 text-white/85 flex items-center justify-center shrink-0 text-[13px] font-semibold tracking-tight"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {fallback}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Group header
// ────────────────────────────────────────────────────────────────────────────

function GroupHeader({
  label,
  trailing,
}: {
  label: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between px-3 sm:px-4 pt-7 pb-3">
      <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/35">
        {label}
      </p>
      {trailing}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Contact row
// ────────────────────────────────────────────────────────────────────────────

function ContactRow({
  contact,
  onRemove,
}: {
  contact: Contact
  onRemove: (c: Contact) => void
}) {
  const profileUrl = profileHrefFor(contact.username)
  const primary = contact.nickname || contact.displayName || contact.username
  const secondary = contact.username
    ? withAtSign(contact.username)
    : contact.walletAddress
      ? `${contact.walletAddress.slice(0, 6)}…${contact.walletAddress.slice(-4)}`
      : null
  const tertiary =
    contact.nickname && contact.displayName && contact.nickname !== contact.displayName
      ? contact.displayName
      : null

  return (
    <div className="group relative flex items-center gap-3.5 px-3 sm:px-4 py-3 rounded-[4px] transition-colors hover:bg-zinc-900">
      {profileUrl && (
        <Link
          href={profileUrl}
          aria-label={`Open ${primary}'s profile`}
          className="absolute inset-0 z-0 rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
        />
      )}
      <Avatar
        url={contact.avatarUrl}
        fallback={getInitial(contact.displayName, contact.username)}
      />
      <div className="flex-1 min-w-0 relative pointer-events-none">
        <p className="text-[14px] font-medium tracking-tight text-white truncate">
          {primary}
        </p>
        <p className="text-xs text-white/45 truncate">
          {secondary}
          {tertiary && <span className="text-white/30"> · {tertiary}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onRemove(contact)
        }}
        aria-label={`Remove ${primary}`}
        className="relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-white/35 outline-none transition-[opacity,color,background-color] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:text-white hover:bg-zinc-800 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
      >
        <Trash2 className="w-4 h-4" aria-hidden />
      </button>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Recent suggestion row
// ────────────────────────────────────────────────────────────────────────────

function RecentRow({
  recent,
  onAdd,
}: {
  recent: Recent
  onAdd: (handle: string) => void
}) {
  const display = recent.username ? withAtSign(recent.username) : recent.handle
  const fallback = (recent.username || recent.handle).replace(/^@/, "").charAt(0).toUpperCase() || "·"
  return (
    <div className="group flex items-center gap-3.5 px-3 sm:px-4 py-3 rounded-[4px] transition-colors hover:bg-zinc-900">
      <Avatar url={null} fallback={fallback} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium tracking-tight text-white truncate">
          {display}
        </p>
        <p className="text-xs text-white/40 truncate">Recently transacted</p>
      </div>
      <button
        type="button"
        onClick={() => recent.username && onAdd(recent.username)}
        disabled={!recent.username}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] bg-zinc-800 text-xs font-medium tracking-tight text-white/80 outline-none transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden />
        Add
      </button>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Add Contact modal
// ────────────────────────────────────────────────────────────────────────────

function AddContactModal({
  open,
  onClose,
  walletAddress,
  prefillUsername,
  onAdded,
}: {
  open: boolean
  onClose: () => void
  walletAddress: string | undefined
  prefillUsername: string | null
  onAdded: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [username, setUsername] = useState("")
  const [nickname, setNickname] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setUsername(prefillUsername || "")
      setNickname("")
      setError(null)
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open, prefillUsername])

  const close = () => {
    onClose()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletAddress) {
      setError("No wallet connected.")
      return
    }
    const cleaned = username.replace(/^@/, "").trim()
    if (!cleaned) {
      setError("Enter a username.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": walletAddress,
        },
        body: JSON.stringify({
          username: cleaned,
          nickname: nickname.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || "Couldn't add contact.")
      }
      onAdded()
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add contact.")
    } finally {
      setSubmitting(false)
    }
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
          onClick={close}
        >
          <div className="absolute inset-0 bg-black/70" />
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="relative w-full sm:max-w-[420px] bg-zinc-900 rounded-md p-7 sm:p-8 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/50">
                Add contact
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

            <div className="space-y-2 mb-5">
              <label
                htmlFor="add-username"
                className="block text-[11px] font-medium uppercase tracking-[0.06em] text-white/50"
              >
                Username
              </label>
              <div className="flex items-center bg-zinc-800 rounded-[4px] focus-within:shadow-[0_0_0_2px_#e1a8f0] transition-shadow">
                <span style={{ color: LAVENDER }} className="pl-3 pr-1 text-base">
                  @
                </span>
                <input
                  id="add-username"
                  ref={inputRef}
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value
                        .replace(/^@/, "")
                        .replace(/[^a-zA-Z0-9_]/g, ""),
                    )
                  }
                  placeholder="username"
                  disabled={submitting}
                  className="flex-1 h-11 pr-3 bg-transparent text-white text-[15px] outline-none placeholder:text-white/30 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <label
                htmlFor="add-nickname"
                className="block text-[11px] font-medium uppercase tracking-[0.06em] text-white/50"
              >
                Nickname{" "}
                <span className="text-white/30 normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <input
                id="add-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Mom, Best Friend"
                disabled={submitting}
                className="w-full h-11 px-3 bg-zinc-800 rounded-[4px] text-[15px] text-white outline-none placeholder:text-white/30 transition-shadow focus:shadow-[0_0_0_2px_#e1a8f0] disabled:opacity-60"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-300/80 mb-4">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !username.trim()}
              style={
                submitting || !username.trim()
                  ? undefined
                  : { backgroundColor: LAVENDER }
              }
              className={`inline-flex w-full h-11 items-center justify-center rounded-[4px] text-sm font-semibold tracking-tight outline-none transition-[box-shadow,filter,opacity,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
                submitting || !username.trim()
                  ? "bg-zinc-800 text-white/40 cursor-not-allowed"
                  : "text-black hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)]"
              }`}
            >
              {submitting ? "Adding…" : "Add contact"}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const { client } = useSmartAccountClient({})
  const walletAddress = client?.account?.address as `0x${string}` | undefined

  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [prefill, setPrefill] = useState<string | null>(null)

  const { transactions } = useTransactionHistory(walletAddress, {
    enabled: !!walletAddress,
    limit: 50,
  })

  const loadContacts = useCallback(async () => {
    if (!walletAddress) {
      setContacts([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/contacts", {
        headers: { "x-wallet-address": walletAddress },
      })
      if (res.ok) {
        const data = (await res.json()) as { contacts?: Contact[] }
        setContacts(data.contacts || [])
        setLoadError(null)
      } else {
        setLoadError("Couldn't load contacts right now.")
      }
    } catch {
      setLoadError("Couldn't load contacts right now.")
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  const handleRemove = useCallback(
    async (contact: Contact) => {
      if (!walletAddress) return
      const label = contact.nickname || contact.displayName || contact.username
      if (typeof window !== "undefined" && !window.confirm(`Remove ${label}?`)) return

      // Optimistic remove
      setContacts((prev) => prev.filter((c) => c.id !== contact.id))
      try {
        const res = await fetch(
          `/api/contacts?userId=${encodeURIComponent(contact.userId)}`,
          {
            method: "DELETE",
            headers: { "x-wallet-address": walletAddress },
          },
        )
        if (!res.ok) await loadContacts()
      } catch {
        await loadContacts()
      }
    },
    [walletAddress, loadContacts],
  )

  // Recently transacted suggestions (de-duped, excluding already-saved usernames)
  const recents = useMemo<Recent[]>(() => {
    const savedHandles = new Set(
      contacts
        .map((c) => c.username?.replace(/^@/, "").toLowerCase())
        .filter(Boolean) as string[],
    )
    const seen = new Set<string>()
    const out: Recent[] = []
    for (const tx of transactions) {
      if (!tx.counterparty) continue
      if (tx.type !== "sent" && tx.type !== "received") continue
      const handle = tx.counterparty
      const key = handle.toLowerCase()
      if (seen.has(key)) continue
      const usernameRaw = handle.startsWith("@") ? handle.slice(1) : undefined
      if (usernameRaw && savedHandles.has(usernameRaw.toLowerCase())) continue
      seen.add(key)
      out.push({ handle, username: usernameRaw })
      if (out.length >= 6) break
    }
    return out
  }, [transactions, contacts])

  const openAddBlank = () => {
    setPrefill(null)
    setAddOpen(true)
  }
  const openAddPrefilled = (username: string) => {
    setPrefill(username)
    setAddOpen(true)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Body renderer
  // ──────────────────────────────────────────────────────────────────────────

  const renderBody = () => {
    if (loading && contacts.length === 0) {
      return (
        <div>
          <GroupHeader label="Saved" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 px-3 sm:px-4 py-3"
            >
              <div className="w-9 h-9 rounded-[4px] bg-zinc-900" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 rounded-[2px] bg-zinc-900" />
                <div className="h-3 w-1/4 rounded-[2px] bg-zinc-900/70" />
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (loadError && contacts.length === 0) {
      return (
        <div className="px-3 sm:px-4 py-12 text-center">
          <p className="text-sm text-white/65">{loadError}</p>
          <button
            type="button"
            onClick={loadContacts}
            className="mt-3 text-xs text-white/55 underline-offset-4 hover:underline hover:text-white outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
          >
            Try again
          </button>
        </div>
      )
    }

    if (contacts.length === 0 && recents.length === 0) {
      return (
        <div className="flex flex-col items-center text-center py-16 sm:py-24">
          <div className="w-12 h-12 rounded-[4px] bg-zinc-900 flex items-center justify-center mb-5">
            <UsersIcon className="w-5 h-5 text-white/45" aria-hidden />
          </div>
          <p className="text-base font-medium tracking-tight text-white">
            No contacts yet
          </p>
          <p className="text-sm text-white/50 mt-1.5 max-w-xs leading-relaxed">
            Add the people you send to and request from for one-tap access.
          </p>
          <button
            type="button"
            onClick={openAddBlank}
            style={{ backgroundColor: LAVENDER }}
            className="mt-5 inline-flex items-center gap-2 h-9 px-4 rounded-[4px] text-sm font-semibold tracking-tight text-black outline-none transition-[box-shadow,filter] hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)] focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <UserPlus className="w-4 h-4" />
            Add contact
          </button>
        </div>
      )
    }

    return (
      <>
        {contacts.length > 0 && (
          <section>
            <GroupHeader
              label={`Saved · ${contacts.length}`}
            />
            {contacts.map((c) => (
              <ContactRow key={c.id} contact={c} onRemove={handleRemove} />
            ))}
          </section>
        )}

        {recents.length > 0 && (
          <section>
            <GroupHeader label="Recently transacted" />
            {recents.map((r, i) => (
              <RecentRow key={`${r.handle}-${i}`} recent={r} onAdd={openAddPrefilled} />
            ))}
          </section>
        )}
      </>
    )
  }

  return (
    <>
      <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
        <div className="w-full max-w-[800px] mx-auto">
          <header className="mb-8 sm:mb-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-white mb-2.5">
                Contacts
              </h1>
              <p className="text-sm sm:text-base leading-relaxed text-white/55 max-w-xl">
                The people you send to and request from.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddBlank}
              style={{ backgroundColor: LAVENDER }}
              className="shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-[4px] text-sm font-semibold tracking-tight text-black outline-none transition-[box-shadow,filter] hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)] focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </header>

          <div className="-mx-3 sm:-mx-4">{renderBody()}</div>
        </div>
      </div>

      <AddContactModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        walletAddress={walletAddress}
        prefillUsername={prefill}
        onAdded={loadContacts}
      />
    </>
  )
}
