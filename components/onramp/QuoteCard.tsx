"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  CreditCard,
  Globe,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { OnrampQuote } from "@/lib/types/onramp";

const LAVENDER = "#e1a8f0";

// Per-provider perks shown on the card. Keep these short and verifiable —
// don't promise behavior the provider doesn't actually deliver.
const PROVIDER_PERKS: Record<string, { Icon: LucideIcon; label: string }[]> = {
  coinbase: [
    { Icon: Zap, label: "Sponsored Base fees" },
    { Icon: CreditCard, label: "Apple Pay supported" },
  ],
  moonpay: [
    { Icon: CreditCard, label: "Cards & Apple Pay" },
    { Icon: Globe, label: "170+ countries" },
  ],
  ramp: [{ Icon: Zap, label: "Fast bank transfers" }],
  transak: [{ Icon: Globe, label: "Wide country support" }],
};

interface QuoteCardProps {
  quote: OnrampQuote;
  isBest: boolean;
  bestQuote?: OnrampQuote;
  onSelect: () => void;
}

function providerInitial(name: string) {
  return name.charAt(0).toUpperCase() || "·";
}

function formatUSD(v: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function useExpiresIn(expiresAt?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "Expired";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r.toString().padStart(2, "0")}s`;
}

export function QuoteCard({
  quote,
  isBest,
  bestQuote,
  onSelect,
}: QuoteCardProps) {
  const expiresIn = useExpiresIn(quote.expiresAt);
  const perks = PROVIDER_PERKS[quote.provider] ?? [];
  const diffVsBest =
    !isBest && bestQuote ? quote.totalFees - bestQuote.totalFees : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-[6px] border bg-zinc-950/40 transition-colors ${
        isBest
          ? "border-[rgba(225,168,240,0.35)]"
          : "border-white/5 hover:border-white/10"
      }`}
    >
      {/* Best-rate badge */}
      {isBest && (
        <span
          className="absolute -top-2.5 left-4 inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-medium tracking-tight"
          style={{ backgroundColor: LAVENDER, color: "#000" }}
        >
          <Sparkles className="w-2.5 h-2.5" strokeWidth={2.5} />
          Best rate
        </span>
      )}

      <div className="px-4 sm:px-5 py-5">
        {/* Provider header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-[4px] bg-zinc-800 flex items-center justify-center text-[12px] font-semibold tracking-tight text-white/85"
              aria-hidden
            >
              {providerInitial(quote.providerName)}
            </div>
            <p className="text-[14px] font-medium tracking-tight text-white">
              {quote.providerName}
            </p>
          </div>
          {expiresIn && (
            <span
              className="inline-flex items-center gap-1 text-[11px] tabular-nums text-white/40"
              aria-label={`Quote expires in ${expiresIn}`}
            >
              <Clock className="w-3 h-3" />
              {expiresIn}
            </span>
          )}
        </div>

        {/* Receive amount */}
        <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/45 mb-1">
          You receive
        </p>
        <p className="text-3xl sm:text-4xl font-light tracking-tight tabular-nums text-white">
          {formatUSD(quote.cryptoAmount)}{" "}
          <span className="text-base sm:text-lg text-white/40 ml-0.5">
            {quote.cryptoCurrency}
          </span>
        </p>

        {/* Diff vs best */}
        {diffVsBest > 0 && (
          <p className="mt-1.5 text-[12px] text-white/45">
            <span className="text-red-300/80 tabular-nums">
              ${formatUSD(diffVsBest)}
            </span>{" "}
            more than {bestQuote!.providerName}
          </p>
        )}

        {/* Fees */}
        <div className="mt-5 rounded-[4px] border border-white/5 bg-zinc-900/40">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-[12px] text-white/55">Total fees</span>
            <span className="text-[12px] tabular-nums text-white/85">
              ${formatUSD(quote.totalFees)}
              <span className="text-white/40">
                {" "}
                · {quote.feePercentage.toFixed(2)}%
              </span>
            </span>
          </div>
          {quote.feeBreakdown.length > 0 && (
            <details className="group border-t border-white/5">
              <summary className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer text-[11px] text-white/40 hover:text-white/65 transition-colors list-none">
                <span>Breakdown</span>
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform group-open:rotate-180"
                  strokeWidth={2}
                />
              </summary>
              <div className="px-3 pb-3 space-y-1.5">
                {quote.feeBreakdown.map((fee, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <span className="text-white/40">{fee.name}</span>
                    <span className="tabular-nums text-white/55">
                      ${formatUSD(fee.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Perks */}
        {perks.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {perks.map(({ Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-[11px] text-white/45"
              >
                <Icon className="w-3 h-3" aria-hidden />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Action */}
        <button
          type="button"
          onClick={onSelect}
          style={isBest ? { backgroundColor: LAVENDER } : undefined}
          className={`mt-5 inline-flex w-full h-11 items-center justify-center gap-2 rounded-[4px] text-sm font-semibold tracking-tight outline-none transition-[box-shadow,filter,color,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
            isBest
              ? "text-black hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)]"
              : "bg-zinc-800 text-white hover:bg-zinc-700"
          }`}
        >
          Continue with {quote.providerName}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
