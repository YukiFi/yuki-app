"use client";

/**
 * Smart-wallet address card with QR + chain selector + token-whitelist warning.
 *
 * Used on the /funds Deposit-crypto card (sub-phase 2a, commit 6). Shows the
 * user's smart-wallet address (same across EVM chains via counterfactual
 * deployment) with a QR code and a chain selector — Base only at launch,
 * but architected so adding chains later is a one-entry change in
 * `lib/yusd/chains.ts`, not a code rewrite.
 *
 * The component is structured so an ENS-style name (e.g. `haruxe.yuki.eth`)
 * can be slotted in later without changing callers — pass `displayName` as
 * a prop and the card prefers it over the hex address. Today no caller sets
 * it; future ENS integration can resolve and supply.
 */

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { AlertTriangle, Check, ChevronDown, Copy } from "lucide-react";
import {
  SUPPORTED_CHAINS,
  type SupportedChain,
} from "@/lib/yusd/chains";

const LAVENDER = "#e1a8f0";

interface AddressDisplayProps {
  /** The smart-wallet address. Required; without it, render nothing. */
  address: `0x${string}` | undefined;
  /**
   * Optional display name (ENS-style) preferred over the hex address.
   * Future ENS integration plugs in here without changing the structure.
   */
  displayName?: string;
  /**
   * Default chain shown in the selector. Defaults to the first active chain
   * in SUPPORTED_CHAINS.
   */
  defaultChainId?: SupportedChain["id"];
  /** Optional className for the outer container. */
  className?: string;
}

function shortAddress(a: string) {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function AddressDisplay({
  address,
  displayName,
  defaultChainId,
  className = "",
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [chainOpen, setChainOpen] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<
    SupportedChain["id"]
  >(defaultChainId ?? SUPPORTED_CHAINS[0]?.id);

  const selectedChain = SUPPORTED_CHAINS.find(
    (c) => c.id === selectedChainId,
  );
  const activeChains = SUPPORTED_CHAINS.filter((c) => c.isActive);
  const showSelector = SUPPORTED_CHAINS.length > 1;

  if (!address) {
    return (
      <div
        className={`rounded-[6px] border border-white/5 bg-zinc-950/40 px-4 py-6 text-center ${className}`}
      >
        <p className="text-sm text-white/45">
          Connect your wallet to see your deposit address.
        </p>
      </div>
    );
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div
      className={`rounded-[6px] border border-white/5 bg-zinc-950/40 px-5 py-5 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/45">
          Deposit address
        </p>
        {/* Chain selector — single non-interactive label when only one
            chain is supported, dropdown when more are added. */}
        {showSelector ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setChainOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[4px] bg-zinc-800 text-[12px] font-medium tracking-tight text-white outline-none transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
            >
              {selectedChain?.name ?? "—"}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${chainOpen ? "rotate-180" : ""}`}
              />
            </button>
            {chainOpen && (
              <div className="absolute right-0 top-9 z-10 min-w-[140px] rounded-[6px] border border-white/10 bg-zinc-900 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.7)] py-1">
                {activeChains.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedChainId(c.id);
                      setChainOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[12px] tracking-tight text-white/85 outline-none transition-colors hover:bg-zinc-800 focus-visible:bg-zinc-800"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center h-7 px-2.5 rounded-[4px] bg-zinc-800 text-[12px] font-medium tracking-tight text-white/85">
            {selectedChain?.name ?? "—"}
          </span>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mb-4 w-fit p-3 rounded-[6px] bg-white"
      >
        <QRCodeSVG
          value={address}
          size={140}
          level="M"
          fgColor="#000000"
          bgColor="#ffffff"
        />
      </motion.div>

      <div className="flex items-center gap-2 justify-center mb-4">
        <code className="text-[13px] tabular-nums text-white/85 font-mono">
          {displayName ?? shortAddress(address)}
        </code>
        <button
          type="button"
          onClick={copyAddress}
          aria-label="Copy address"
          className="inline-flex items-center gap-1 h-7 px-2 rounded-[4px] bg-zinc-800 text-[11px] font-medium tracking-tight text-white/80 outline-none transition-colors hover:bg-zinc-700 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
        >
          {copied ? (
            <>
              <Check
                className="w-3 h-3"
                style={{ color: LAVENDER }}
                strokeWidth={3}
              />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-[4px] bg-zinc-900/50 px-3 py-2.5">
        <AlertTriangle
          className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-300/80"
          aria-hidden
        />
        <p className="text-[11px] leading-relaxed text-white/55">
          Only USDC on{" "}
          <span className="text-white/85">{selectedChain?.name}</span> is
          currently supported. Sending other tokens or using other chains
          may result in lost funds.
        </p>
      </div>
    </div>
  );
}
