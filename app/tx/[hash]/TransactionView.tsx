"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Link as LinkIcon,
  Share2,
} from "lucide-react";
import type { TxDetail, TxParty } from "@/lib/transactions/getTransaction";

const LAVENDER = "#e1a8f0";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatUSD(v: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function shortHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function shortAddress(a: string) {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function partyLabel(p: TxParty) {
  if (p.username) return `@${p.username}`;
  if (p.displayName) return p.displayName;
  return shortAddress(p.address);
}

function partySubLabel(p: TxParty) {
  if (p.username && p.displayName) return p.displayName;
  if (p.username || p.displayName) return shortAddress(p.address);
  return null;
}

function partyInitial(p: TxParty) {
  const source = p.displayName || p.username || p.address;
  if (!source) return "·";
  return source.replace(/^@/, "").charAt(0).toUpperCase() || "·";
}

function formatDate(d: Date) {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Pieces
// ────────────────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: TxDetail["status"] }) {
  if (status === "success") {
    return (
      <span
        className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium tracking-tight"
        style={{
          backgroundColor: "rgba(225,168,240,0.12)",
          color: LAVENDER,
        }}
      >
        <Check className="w-3 h-3" strokeWidth={3} />
        Confirmed
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium tracking-tight bg-zinc-800 text-white/70">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium tracking-tight bg-red-500/10 text-red-300">
      <AlertTriangle className="w-3 h-3" />
      Failed
    </span>
  );
}

function PartyCard({ party }: { party: TxParty }) {
  const sub = partySubLabel(party);
  const profileHref = party.username ? `/${party.username}` : null;
  const inner = (
    <div className="flex flex-col items-center text-center min-w-0 px-2">
      {party.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={party.avatarUrl}
          alt=""
          className="w-12 h-12 rounded-[6px] object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-[6px] bg-zinc-800 text-white/85 flex items-center justify-center text-base font-semibold tracking-tight">
          {partyInitial(party)}
        </div>
      )}
      <p className="mt-3 text-[14px] font-medium tracking-tight text-white truncate max-w-[160px]">
        {partyLabel(party)}
      </p>
      {sub && (
        <p className="mt-0.5 text-[11px] text-white/45 tabular-nums truncate max-w-[160px]">
          {sub}
        </p>
      )}
    </div>
  );

  return profileHref ? (
    <Link
      href={profileHref}
      className="block rounded-[6px] outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
    >
      {inner}
    </Link>
  ) : (
    inner
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <p className="text-[13px] text-white/55">{label}</p>
      <div className="text-[13px] text-white text-right">{value}</div>
    </div>
  );
}

function CopyButton({
  value,
  label,
  className = "",
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — silently no-op
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[4px] bg-zinc-800 text-[12px] font-medium tracking-tight text-white/80 outline-none transition-colors hover:bg-zinc-700 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0] ${className}`}
    >
      <span className="tabular-nums">{shortHash(value)}</span>
      {copied ? (
        <Check className="w-3 h-3" style={{ color: LAVENDER }} strokeWidth={3} />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// View
// ────────────────────────────────────────────────────────────────────────────

export function TransactionView({ tx }: { tx: TxDetail }) {
  const [linkCopied, setLinkCopied] = useState(false);

  const explorerHref = tx.isDemo
    ? null
    : `https://basescan.org/tx/${tx.hash}`;

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      // no-op
    }
  };

  const nativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) {
      copyShareLink();
      return;
    }
    try {
      await navigator.share({
        title: `${partyLabel(tx.from)} → ${partyLabel(tx.to)}`,
        text: `$${formatUSD(tx.amount)} ${tx.tokenSymbol} on ${tx.network}`,
        url: window.location.href,
      });
    } catch {
      // user dismissed — no error UX needed
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="px-5 sm:px-8 pt-6 pb-2">
        <div className="max-w-[560px] mx-auto flex items-center justify-between">
          <Link
            href="/activity"
            className="inline-flex items-center gap-1.5 h-8 px-2 -ml-2 rounded-[4px] text-[13px] text-white/55 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to activity
          </Link>
          <Link
            href="/"
            aria-label="Yuki home"
            className="inline-flex items-center rounded-[4px] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
          >
            <Image
              src="/images/applet.svg"
              alt="Yuki"
              width={24}
              height={24}
              priority
            />
          </Link>
        </div>
      </header>

      <main className="px-5 sm:px-8 pt-4 pb-16">
        <div className="max-w-[560px] mx-auto">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-zinc-900 rounded-md p-7 sm:p-9 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center justify-between mb-7">
              <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/50">
                Transfer receipt
              </p>
              <StatusPill status={tx.status} />
            </div>

            <div className="text-center mb-8">
              <p className="text-5xl sm:text-6xl font-light tracking-tight tabular-nums text-white">
                <span style={{ color: LAVENDER }}>$</span>
                {formatUSD(tx.amount)}
              </p>
              <p className="mt-2 text-[12px] uppercase tracking-[0.08em] text-white/45">
                {tx.tokenSymbol}
              </p>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-8">
              <PartyCard party={tx.from} />
              <div
                aria-hidden
                className="flex items-center justify-center w-9 h-9 rounded-full"
                style={{ backgroundColor: "rgba(225,168,240,0.12)" }}
              >
                <ArrowRight
                  className="w-4 h-4"
                  style={{ color: LAVENDER }}
                  strokeWidth={2.5}
                />
              </div>
              <PartyCard party={tx.to} />
            </div>

            <div className="rounded-[6px] border border-white/5 bg-zinc-950/40 divide-y divide-white/5 mb-6">
              {tx.timestamp && (
                <DetailRow label="Date" value={formatDate(tx.timestamp)} />
              )}
              <DetailRow label="Network" value={tx.network} />
              <DetailRow label="Network fee" value="Sponsored" />
              {tx.blockNumber !== null && (
                <DetailRow
                  label="Block"
                  value={
                    <span className="tabular-nums">
                      #{tx.blockNumber.toLocaleString()}
                    </span>
                  }
                />
              )}
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <p className="text-[13px] text-white/55">Transaction</p>
                <div className="flex items-center gap-1.5">
                  <CopyButton value={tx.hash} label="Copy transaction hash" />
                  {explorerHref && (
                    <a
                      href={explorerHref}
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
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={nativeShare}
                style={{ backgroundColor: LAVENDER }}
                className="inline-flex flex-1 h-11 items-center justify-center gap-2 rounded-[4px] text-sm font-semibold tracking-tight text-black outline-none transition-[box-shadow,filter] duration-150 hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.5)] focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                type="button"
                onClick={copyShareLink}
                aria-label="Copy share link"
                className="inline-flex h-11 items-center justify-center gap-2 px-4 rounded-[4px] bg-zinc-800 text-sm font-medium tracking-tight text-white outline-none transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              >
                {linkCopied ? (
                  <>
                    <Check
                      className="w-4 h-4"
                      style={{ color: LAVENDER }}
                      strokeWidth={3}
                    />
                    Copied
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    Copy link
                  </>
                )}
              </button>
            </div>
          </motion.section>

          <p className="mt-6 text-center text-[11px] tracking-tight text-white/30">
            {tx.isDemo
              ? "Demo transaction · not on chain"
              : "Funds settled on Base · sponsored by Yuki"}
          </p>
        </div>
      </main>
    </div>
  );
}
