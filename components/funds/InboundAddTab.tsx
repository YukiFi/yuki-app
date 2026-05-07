"use client";

/**
 * Three-path inbound funding tab for /funds Add.
 *
 * Renders only when NEXT_PUBLIC_INBOUND_V2 is on. Replaces the legacy
 * amount-input + OnrampComparison body with three entry tiles:
 *
 *   1. Add money via card  — fiat onramp via Coinbase popup
 *   2. Deposit crypto      — AddressDisplay for sends from another wallet
 *   3. Request from friend — placeholder until Phase 3 ships /r/[id]
 *
 * Once a deposit is initiated (intent created), this component swaps to
 * the Stepper view and remains there until the user dismisses with Done.
 * The Stepper subscribes to useTransferStatus, which keeps the last-known
 * phase even after the row drops from the openOps cache (terminal rows
 * leave the cache to keep polls cheap).
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  CreditCard,
  Hash,
  Users,
} from "lucide-react";
import Link from "next/link";
import { AddressDisplay } from "@/components/AddressDisplay";
import { Stepper } from "@/components/Stepper";
import { useStatusContext } from "@/lib/context/StatusContext";

const LAVENDER = "#e1a8f0";
const QUICK_PICKS = [25, 50, 100, 250];

function formatUSD(v: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface InboundAddTabProps {
  walletAddress: `0x${string}` | undefined;
}

type Path = "choose" | "fiat" | "crypto";

export function InboundAddTab({ walletAddress }: InboundAddTabProps) {
  const [path, setPath] = useState<Path>("choose");
  const [activeDepositId, setActiveDepositId] = useState<string | null>(null);
  const [activeAmount, setActiveAmount] = useState<number>(0);

  // Active-deposit view takes precedence over path selection — once a
  // deposit is initiated, the user wants progress, not the picker.
  if (activeDepositId) {
    return (
      <ActiveDepositView
        depositId={activeDepositId}
        amount={activeAmount}
        onDone={() => {
          setActiveDepositId(null);
          setActiveAmount(0);
          setPath("choose");
        }}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {path === "choose" && (
        <PathPicker key="choose" onSelect={setPath} />
      )}
      {path === "fiat" && (
        <FiatPath
          key="fiat"
          walletAddress={walletAddress}
          onBack={() => setPath("choose")}
          onIntentCreated={(id, amount) => {
            setActiveDepositId(id);
            setActiveAmount(amount);
          }}
        />
      )}
      {path === "crypto" && (
        <CryptoPath
          key="crypto"
          walletAddress={walletAddress}
          onBack={() => setPath("choose")}
        />
      )}
    </AnimatePresence>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Path picker (three tiles)
// ────────────────────────────────────────────────────────────────────────────

function PathPicker({ onSelect }: { onSelect: (p: Path) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-3"
    >
      <PathTile
        primary
        Icon={CreditCard}
        title="Add money"
        subtitle="Buy yUSD with a card or bank account"
        onClick={() => onSelect("fiat")}
      />
      <PathTile
        Icon={Hash}
        title="Deposit crypto"
        subtitle="Send USDC from another wallet"
        onClick={() => onSelect("crypto")}
      />
      <PathTile
        Icon={Users}
        title="Request from a friend"
        subtitle="Coming soon"
        disabled
        onClick={() => {}}
      />
    </motion.div>
  );
}

function PathTile({
  primary = false,
  disabled = false,
  Icon,
  title,
  subtitle,
  onClick,
}: {
  primary?: boolean;
  disabled?: boolean;
  Icon: typeof CreditCard;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-4 w-full text-left rounded-[6px] border bg-zinc-900 px-5 py-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
        disabled
          ? "border-white/5 opacity-50 cursor-not-allowed"
          : primary
            ? "border-[rgba(225,168,240,0.25)] hover:border-[rgba(225,168,240,0.5)] hover:bg-zinc-900/80"
            : "border-white/5 hover:border-white/10 hover:bg-zinc-900/80"
      }`}
    >
      <div
        className={`shrink-0 w-10 h-10 rounded-[6px] flex items-center justify-center ${
          primary ? "bg-[rgba(225,168,240,0.12)]" : "bg-zinc-800"
        }`}
      >
        <Icon
          className="w-5 h-5"
          style={primary ? { color: LAVENDER } : { color: "rgba(255,255,255,0.7)" }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium tracking-tight text-white">
          {title}
        </p>
        <p className="text-[12px] text-white/50 mt-0.5">{subtitle}</p>
      </div>
      {!disabled && (
        <ArrowRight
          aria-hidden
          className="w-4 h-4 text-white/30 transition-colors group-hover:text-white/65"
        />
      )}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Fiat path
// ────────────────────────────────────────────────────────────────────────────

function FiatPath({
  walletAddress,
  onBack,
  onIntentCreated,
}: {
  walletAddress: `0x${string}` | undefined;
  onBack: () => void;
  onIntentCreated: (depositId: string, amount: number) => void;
}) {
  const ctx = useStatusContext();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numeric = parseFloat(amount) || 0;
  const canContinue = numeric > 0 && !!walletAddress && !submitting;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(val);
  };

  const handleAddViaCoinbase = async () => {
    if (!walletAddress || numeric <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/deposits/intent", {
        method: "POST",
        headers: {
          "x-wallet-address": walletAddress,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fiatAmountUsd: numeric }),
      });
      if (!res.ok) {
        throw new Error("Couldn't create deposit intent");
      }
      const { id, intentId } = (await res.json()) as {
        id: string;
        intentId: string;
      };

      // Open the Coinbase popup with the intent id as partnerUserRef. The
      // popup is best-effort; if the user closes it without completing,
      // the intent row sits as 'intent' until the indexer claims it on
      // arrival (or it ages out of view if no payment ever lands).
      const params = new URLSearchParams({
        appId: process.env.NEXT_PUBLIC_COINBASE_ONRAMP_CLIENT_KEY || "",
        addresses: JSON.stringify({ [walletAddress]: ["base"] }),
        assets: JSON.stringify(["USDC"]),
        defaultAsset: "USDC",
        defaultNetwork: "base",
        defaultPaymentMethod: "CARD",
        presetFiatAmount: numeric.toString(),
        partnerUserRef: intentId,
      });
      const url = `https://pay.coinbase.com/buy/select-asset?${params.toString()}`;
      const width = 500;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      const popup = window.open(
        url,
        "coinbase-onramp",
        `width=${width},height=${height},left=${left},top=${top}`,
      );
      if (!popup) {
        setError("Please allow popups for this site to continue.");
        setSubmitting(false);
        return;
      }

      // Tell StatusContext to refresh so the new intent row shows up in
      // openOps immediately (before the next 5s poll tick).
      await ctx.refresh();
      onIntentCreated(id, numeric);
    } catch (err) {
      console.error("[FiatPath] intent error", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <BackLink onClick={onBack} />

      <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/35 mb-3">
        Amount to add
      </p>
      <div className="flex items-baseline mb-4">
        <span style={{ color: LAVENDER }} className="text-5xl sm:text-6xl font-light">
          $
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={handleAmountChange}
          placeholder="0"
          autoFocus
          className="bg-transparent text-white text-5xl sm:text-6xl font-light w-full outline-none placeholder:text-white/20 tabular-nums"
        />
      </div>

      <div className="grid grid-cols-4 gap-2 mb-7">
        {QUICK_PICKS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(String(v))}
            className="h-9 rounded-[4px] bg-zinc-900 text-sm font-medium tracking-tight text-white/70 outline-none transition-colors hover:bg-zinc-800 hover:text-white tabular-nums focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
          >
            ${v}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-300/80 mb-4">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleAddViaCoinbase}
        disabled={!canContinue}
        style={canContinue ? { backgroundColor: LAVENDER } : undefined}
        className={`inline-flex w-full h-11 items-center justify-center gap-2 rounded-[4px] text-sm font-semibold tracking-tight outline-none transition-[box-shadow,filter,opacity,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
          canContinue
            ? "text-black hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)]"
            : "bg-zinc-800 text-white/40 cursor-not-allowed"
        }`}
      >
        {submitting ? (
          <Spinner />
        ) : (
          <>
            Add via Coinbase
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="mt-3 text-[11px] text-white/30 text-center">
        Card, Apple Pay, or bank transfer. Funds appear as yUSD in your balance.
      </p>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Crypto path
// ────────────────────────────────────────────────────────────────────────────

function CryptoPath({
  walletAddress,
  onBack,
}: {
  walletAddress: `0x${string}` | undefined;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <BackLink onClick={onBack} />
      <AddressDisplay address={walletAddress} />
      <p className="mt-4 text-[11px] text-white/40 leading-relaxed text-center">
        Send USDC to your address on Base. Your balance updates within seconds
        of the transfer landing on chain.
      </p>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Active-deposit view (Stepper + dismiss)
// ────────────────────────────────────────────────────────────────────────────

function ActiveDepositView({
  depositId,
  amount,
  onDone,
}: {
  depositId: string;
  amount: number;
  onDone: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/45 mb-3">
        Adding
      </p>
      <p className="text-4xl sm:text-5xl font-light tracking-tight tabular-nums text-white mb-7">
        <span style={{ color: LAVENDER }}>$</span>
        {formatUSD(amount)}
      </p>

      <Stepper kind="deposit" id={depositId} className="mb-5" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDone}
          className="inline-flex flex-1 h-11 items-center justify-center rounded-[4px] bg-zinc-800 text-sm font-medium tracking-tight text-white outline-none transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
        >
          Done
        </button>
        <Link
          href="/"
          className="inline-flex flex-1 h-11 items-center justify-center rounded-[4px] bg-zinc-900 border border-white/10 text-sm font-medium tracking-tight text-white outline-none transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
        >
          View dashboard
        </Link>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tiny shared bits
// ────────────────────────────────────────────────────────────────────────────

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs text-white/45 mb-6 outline-none rounded-sm transition-colors hover:text-white focus-visible:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
    >
      <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
      Back
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
    />
  );
}

// Re-exports for tree-shaking; internal-use icons. (Keep here so the
// component file is fully self-contained for review.)
void Check;
void Clock;
