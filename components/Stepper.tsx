"use client";

/**
 * Shared transfer stepper. Consumes useTransferStatus and renders the row
 * sequence appropriate for the transfer kind.
 *
 * Visual style mirrors the SendModal stepper from the earlier UX polish —
 * three-row stack with pending / active / done states, lavender accent on
 * the active row, retry/failed branches surface inline.
 *
 * Phase mapping per kind:
 *   deposit     — paid → funded → depositing → earning  (+ retry, failed)
 *   withdrawal  — redeeming → transferring → settling → success  (+ failed_offramp)
 *   transfer    — submitted → confirming → confirmed  (+ failed)  [Phase 3]
 */

import { motion } from "framer-motion";
import { AlertTriangle, Check, Clock, RotateCw } from "lucide-react";
import {
  useTransferStatus,
  type TransferPhase,
} from "@/lib/hooks/useTransferStatus";

const LAVENDER = "#e1a8f0";

type Kind = "deposit" | "withdrawal" | "transfer";

interface RowSpec {
  label: string;
  hint?: string;
  /** The set of phases for which this row counts as "done". */
  doneAt: TransferPhase[];
  /** The phase at which this row is the active one. */
  activeAt: TransferPhase;
}

// Row sequences per kind. Sub-phase 2a exercises the deposit sequence; the
// withdrawal and transfer sequences are stubbed here so the type system
// covers them — they'll be reached in 2b and Phase 3 respectively.
const SEQUENCES: Record<Kind, RowSpec[]> = {
  deposit: [
    {
      label: "Authorizing payment",
      hint: "Card charge in progress",
      doneAt: ["funded", "depositing", "earning"],
      activeAt: "paid",
    },
    {
      label: "Funded",
      hint: "Funds arrived in your wallet",
      doneAt: ["depositing", "earning"],
      activeAt: "funded",
    },
    {
      label: "Depositing into yUSD",
      hint: "Auto-swap in progress",
      doneAt: ["earning"],
      activeAt: "depositing",
    },
    {
      label: "Earning",
      hint: "Funds are now in your yUSD balance",
      doneAt: [],
      activeAt: "earning",
    },
  ],
  withdrawal: [
    {
      label: "Redeeming yUSD",
      doneAt: ["transferring", "settling", "success"],
      activeAt: "redeeming",
    },
    {
      label: "Transferring to bank",
      doneAt: ["settling", "success"],
      activeAt: "transferring",
    },
    {
      label: "Settling at your bank",
      doneAt: ["success"],
      activeAt: "settling",
    },
    {
      label: "Done",
      doneAt: [],
      activeAt: "success",
    },
  ],
  transfer: [
    {
      label: "Submitting",
      doneAt: ["confirming", "confirmed"],
      activeAt: "submitted",
    },
    {
      label: "Confirming",
      doneAt: ["confirmed"],
      activeAt: "confirming",
    },
    {
      label: "Confirmed",
      doneAt: [],
      activeAt: "confirmed",
    },
  ],
};

function rowState(
  spec: RowSpec,
  phase: TransferPhase,
): "pending" | "active" | "done" {
  if (spec.doneAt.includes(phase)) return "done";
  if (spec.activeAt === phase) return "active";
  return "pending";
}

function StepRow({
  label,
  hint,
  state,
}: {
  label: string;
  hint?: string;
  state: "pending" | "active" | "done";
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div
        aria-hidden
        className="relative w-[18px] h-[18px] flex items-center justify-center shrink-0 mt-[2px]"
      >
        {state === "pending" && (
          <span className="block w-3.5 h-3.5 rounded-full border border-white/15" />
        )}
        {state === "active" && (
          <span
            className="block w-3.5 h-3.5 rounded-full border-2 animate-spin"
            style={{
              borderColor: "rgba(225,168,240,0.25)",
              borderTopColor: LAVENDER,
            }}
          />
        )}
        {state === "done" && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex items-center justify-center w-[18px] h-[18px] rounded-full"
            style={{ backgroundColor: "rgba(225,168,240,0.18)" }}
          >
            <Check className="w-2.5 h-2.5" style={{ color: LAVENDER }} strokeWidth={3.5} />
          </motion.span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-[13px] tracking-tight transition-colors duration-200 ${
            state === "pending"
              ? "text-white/35"
              : state === "active"
                ? "text-white"
                : "text-white/65"
          }`}
        >
          {label}
        </p>
        {hint && state === "active" && (
          <p className="text-[11px] text-white/40 mt-0.5">{hint}</p>
        )}
      </div>
    </div>
  );
}

interface StepperProps {
  kind: Kind;
  id: string;
  /** Optional className for the outer container. */
  className?: string;
}

export function Stepper({ kind, id, className = "" }: StepperProps) {
  const { phase, retry, vaultStatus } = useTransferStatus({ kind, id });

  // Failure / retry branches render as a single inline notice instead of
  // the row sequence — the row UI assumes forward progress, and a stuck
  // state is more clearly communicated as "something needs attention."
  if (phase === "retry") {
    return (
      <div
        className={`rounded-[6px] border border-[rgba(225,168,240,0.25)] bg-[rgba(225,168,240,0.06)] px-4 py-3 ${className}`}
      >
        <div className="flex items-start gap-3">
          <Clock
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: LAVENDER }}
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium tracking-tight text-white">
              Funds received, deposit retrying
            </p>
            <p className="mt-0.5 text-[11px] text-white/45">
              {vaultStatus === "paused"
                ? "Earning is paused. Your funds are safe."
                : vaultStatus === "capped"
                  ? "Vault is at capacity. Your funds are safe."
                  : "Trying again automatically."}
            </p>
            <button
              type="button"
              onClick={() => void retry()}
              className="mt-2.5 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[4px] bg-zinc-800 text-[12px] font-medium tracking-tight text-white outline-none transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
            >
              <RotateCw className="w-3 h-3" />
              Retry now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "failed" || phase === "failed_offramp") {
    return (
      <div
        className={`rounded-[6px] border border-red-500/15 bg-red-500/[0.04] px-4 py-3 ${className}`}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="w-4 h-4 mt-0.5 shrink-0 text-red-300/90"
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium tracking-tight text-red-200">
              {phase === "failed_offramp"
                ? "Bank settlement failed"
                : "Transaction failed"}
            </p>
            <p className="mt-0.5 text-[11px] text-red-200/55">
              {phase === "failed_offramp"
                ? "Coinbase couldn't deliver to your bank. Check your account or try a different payout method."
                : "Something went wrong. Your funds are safe."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sequence = SEQUENCES[kind];

  return (
    <div
      className={`rounded-[6px] border border-white/5 bg-zinc-950/40 px-4 py-2 ${className}`}
    >
      {sequence.map((row) => (
        <StepRow
          key={row.label}
          label={row.label}
          hint={row.hint}
          state={rowState(row, phase)}
        />
      ))}
    </div>
  );
}
