"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  Fingerprint,
  Globe2,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { useSmartAccountClient } from "@account-kit/react"

const LAVENDER = "#e1a8f0"

type Feature = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  accent?: boolean
}

const FEATURES: Feature[] = [
  {
    id: "passkey",
    title: "Passkey authentication",
    description:
      "Your wallet is protected by biometric authentication — Face ID, Touch ID, or your device unlock. Hardware-backed and resistant to phishing.",
    icon: Fingerprint,
    accent: true,
  },
  {
    id: "smart-wallet",
    title: "Smart contract wallet",
    description:
      "Your funds live in an on-chain smart contract wallet (ERC-4337). Non-custodial: Yuki never holds your money on your behalf.",
    icon: ShieldCheck,
  },
  {
    id: "gas",
    title: "Sponsored gas fees",
    description:
      "Yuki pays the network fee for every transaction. You don't need ETH to send, receive, or earn — just your balance.",
    icon: Zap,
  },
  {
    id: "base",
    title: "Base network",
    description:
      "Built on Base, an Ethereum Layer 2 network. Transactions inherit Ethereum's consensus and security guarantees.",
    icon: Globe2,
  },
]

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

function FeatureRow({ feature }: { feature: Feature }) {
  const Icon = feature.icon
  return (
    <div className="flex items-start gap-4 px-3 sm:px-4 py-4 rounded-[4px]">
      <div className="shrink-0 w-9 h-9 rounded-[4px] bg-zinc-900 flex items-center justify-center">
        <Icon
          className="w-4 h-4"
          style={
            feature.accent
              ? { color: LAVENDER }
              : { color: "rgba(255,255,255,0.75)" }
          }
          aria-hidden
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium tracking-tight text-white">
          {feature.title}
        </p>
        <p className="text-xs leading-relaxed text-white/55 mt-1 max-w-[60ch]">
          {feature.description}
        </p>
      </div>
    </div>
  )
}

function WalletAddressRow({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)

  const truncated = `${address.slice(0, 8)}…${address.slice(-6)}`
  const copyHref = `https://basescan.org/address/${address}`

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // navigator.clipboard unavailable — silently noop
    }
  }

  return (
    <div className="flex items-center gap-3 px-3 sm:px-4 py-4 rounded-[4px]">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium tracking-tight text-white">
          Wallet address
        </p>
        <p className="text-xs text-white/55 mt-1 font-mono tabular-nums truncate">
          <span className="hidden sm:inline">{address}</span>
          <span className="sm:hidden">{truncated}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? "Copied" : "Copy wallet address"}
        title={copied ? "Copied" : "Copy"}
        className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-white/60 outline-none transition-colors hover:bg-zinc-900 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
      >
        {copied ? (
          <Check className="w-4 h-4" style={{ color: LAVENDER }} aria-hidden />
        ) : (
          <Copy className="w-4 h-4" aria-hidden />
        )}
      </button>
      <a
        href={copyHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View on Basescan"
        title="View on Basescan"
        className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-white/60 outline-none transition-colors hover:bg-zinc-900 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
      >
        <ArrowUpRight className="w-4 h-4" aria-hidden />
      </a>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const { client } = useSmartAccountClient({})
  const walletAddress = client?.account?.address as string | undefined

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-[800px] mx-auto">
        {/* Back link */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-white/45 mb-8 rounded-sm outline-none transition-colors hover:text-white focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
          Back to Settings
        </Link>

        {/* Header */}
        <header className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-white mb-2.5">
            Security
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-white/55 max-w-xl">
            Your wallet is secured by a passkey on your device. Yuki never
            holds your funds.
          </p>
        </header>

        <div className="-mx-3 sm:-mx-4">
          {/* Architecture */}
          <section>
            <GroupHeader label="How it works" />
            {FEATURES.map((f) => (
              <FeatureRow key={f.id} feature={f} />
            ))}
          </section>

          {/* Wallet */}
          <section>
            <GroupHeader label="Wallet" />
            {walletAddress ? (
              <WalletAddressRow address={walletAddress} />
            ) : (
              <div className="flex items-center gap-3 px-3 sm:px-4 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium tracking-tight text-white">
                    Wallet address
                  </p>
                  <p className="text-xs text-white/45 mt-1">
                    Connecting…
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
