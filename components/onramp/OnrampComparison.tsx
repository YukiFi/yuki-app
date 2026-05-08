"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, RotateCw, Sparkles } from "lucide-react";
import type { OnrampQuote, OnrampQuoteResponse } from "@/lib/types/onramp";
import { QuoteCard } from "./QuoteCard";

const LAVENDER = "#e1a8f0";

interface OnrampComparisonProps {
  amount: number;
  onSelectProvider: (provider: string, quote: OnrampQuote) => void;
}

function formatUSD(v: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function timeAgo(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}

function SkeletonCard() {
  return (
    <div className="rounded-[6px] border border-white/5 bg-zinc-950/40 px-4 sm:px-5 py-5 animate-pulse">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-7 h-7 rounded-[4px] bg-zinc-800" />
        <div className="h-3.5 w-20 rounded-[2px] bg-zinc-800" />
      </div>
      <div className="h-3 w-16 rounded-[2px] bg-zinc-800/70 mb-2" />
      <div className="h-9 w-40 rounded-[2px] bg-zinc-800 mb-5" />
      <div className="h-9 w-full rounded-[4px] bg-zinc-800/70 mb-4" />
      <div className="h-11 w-full rounded-[4px] bg-zinc-800" />
    </div>
  );
}

function SavingsBanner({
  savings,
  bestProviderName,
}: {
  savings: number;
  bestProviderName: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2.5 rounded-[4px] border border-[rgba(225,168,240,0.18)] bg-[rgba(225,168,240,0.06)] px-3.5 py-2.5"
    >
      <Sparkles
        className="w-3.5 h-3.5 shrink-0"
        style={{ color: LAVENDER }}
        aria-hidden
      />
      <p className="text-[12px] tracking-tight text-white/85">
        Save{" "}
        <span className="tabular-nums font-medium" style={{ color: LAVENDER }}>
          ${formatUSD(savings)}
        </span>{" "}
        by going with{" "}
        <span className="text-white">{bestProviderName}</span>
      </p>
    </motion.div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-[6px] border border-red-500/15 bg-red-500/[0.04] px-4 py-4">
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="w-4 h-4 mt-0.5 shrink-0 text-red-300/90"
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium tracking-tight text-red-200">
            Couldn&apos;t fetch live quotes
          </p>
          <p className="mt-0.5 text-[12px] text-red-200/55 truncate">
            {message}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2.5 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[4px] bg-zinc-900 text-[12px] font-medium tracking-tight text-white outline-none transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
          >
            <RotateCw className="w-3 h-3" />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export function OnrampComparison({
  amount,
  onSelectProvider,
}: OnrampComparisonProps) {
  const [quotes, setQuotes] = useState<OnrampQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchQuotes = async (mode: "initial" | "refresh" = "initial") => {
    if (amount <= 0) {
      setQuotes([]);
      return;
    }
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/onramp/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fiatAmount: amount,
          fiatCurrency: "USD",
          cryptoCurrency: "USDC",
          paymentMethod: "card",
        }),
      });
      if (!response.ok) throw new Error("Failed to fetch quotes");
      const data: OnrampQuoteResponse = await response.json();
      // Sort by best receive amount (highest first), filter out failures.
      const successful = data.quotes
        .filter((q) => q.success && q.cryptoAmount > 0)
        .sort((a, b) => b.cryptoAmount - a.cryptoAmount);
      setQuotes(successful);
      setLastFetch(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch quotes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refetch on amount change. Debounce so we don't spam the API while the
  // user is still typing. Skip during initial mount when amount is 0.
  useEffect(() => {
    if (amount <= 0) {
      setQuotes([]);
      return;
    }
    const id = setTimeout(() => fetchQuotes("initial"), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  // Auto-refresh every 60s while quotes are visible.
  useEffect(() => {
    if (amount <= 0 || quotes.length === 0) return;
    const id = setInterval(() => fetchQuotes("refresh"), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, quotes.length]);

  // Initial loading
  if (loading && quotes.length === 0) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Error (no cached quotes to fall back on)
  if (error && quotes.length === 0) {
    return <ErrorState message={error} onRetry={() => fetchQuotes()} />;
  }

  // No quotes available
  if (quotes.length === 0) {
    return (
      <div className="rounded-[6px] border border-white/5 bg-zinc-950/40 px-4 py-6 text-center">
        <p className="text-sm text-white/55">No providers available right now.</p>
        <button
          type="button"
          onClick={() => fetchQuotes()}
          className="mt-2 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[4px] bg-zinc-900 text-[12px] font-medium tracking-tight text-white outline-none transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
        >
          <RotateCw className="w-3 h-3" />
          Refresh
        </button>
      </div>
    );
  }

  const bestQuote = quotes[0];
  const worstQuote = quotes[quotes.length - 1];
  const savings =
    bestQuote && worstQuote ? worstQuote.totalFees - bestQuote.totalFees : 0;

  return (
    <div className="space-y-3">
      {savings > 0 && quotes.length > 1 && (
        <SavingsBanner
          savings={savings}
          bestProviderName={bestQuote.providerName}
        />
      )}

      <AnimatePresence mode="popLayout" initial={false}>
        {quotes.map((quote, index) => (
          <QuoteCard
            key={quote.provider}
            quote={quote}
            isBest={index === 0}
            bestQuote={bestQuote}
            onSelect={() => onSelectProvider(quote.provider, quote)}
          />
        ))}
      </AnimatePresence>

      {/* Soft inline error for refresh failures when we still have stale quotes */}
      {error && quotes.length > 0 && (
        <p className="text-[11px] text-red-300/70 px-1">
          Refresh failed · showing last known quotes
        </p>
      )}

      {lastFetch > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/30">
            Updated {timeAgo(lastFetch)}
          </p>
          <button
            type="button"
            onClick={() => fetchQuotes("refresh")}
            disabled={refreshing}
            aria-label="Refresh quotes"
            className="inline-flex items-center gap-1.5 h-6 px-2 -mr-2 rounded-[4px] text-[11px] font-medium tracking-tight text-white/45 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0] disabled:opacity-50"
          >
            <RotateCw
              className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
