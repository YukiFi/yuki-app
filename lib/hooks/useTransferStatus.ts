/**
 * useTransferStatus — selector hook over StatusContext.
 *
 * **This is a selector, not a fetcher.** It reads from the cached open-ops
 * state owned by StatusContext and derives a unified phase locally. It does
 * not poll, fetch, or subscribe to anything else. Adding network calls here
 * would re-introduce the multiple-source-of-truth problem the architecture
 * deliberately avoids.
 *
 * Phase derivation is a pure mapping from the row's `status` field to the
 * shared TransferPhase union. Terminal rows that have dropped out of
 * StatusContext's open-ops cache get last-known-phase semantics: the hook
 * captures the most recent phase it saw and continues returning it after
 * the row drops, so a stepper showing "Earning" doesn't flicker back to a
 * default once the row goes terminal-and-cleaned-up.
 */

"use client";

import { useEffect, useState } from "react";
import { useStatusContext } from "@/lib/context/StatusContext";
import type { VaultStatus } from "@/lib/yusd";
import type { Deposit, Withdrawal } from "@/lib/db-postgres";

// The unified phase enum, flat-by-design (see plan task 1 lock-in). Don't
// refactor to a discriminated union — exhaustiveness with `never` covers
// missing-case bugs at compile time, and consumers compare with a single
// `phase === 'depositing'` instead of two.
export type TransferPhase =
  // deposit phases
  | "paid"
  | "funded"
  | "depositing"
  | "earning"
  // withdrawal phases
  | "redeeming"
  | "transferring"
  | "settling"
  | "success"
  // P2P transfer phases (Phase 3)
  | "submitted"
  | "confirming"
  | "confirmed"
  // failure / retry
  | "failed"
  | "failed_offramp"
  | "retry";

export interface TransferStatus {
  phase: TransferPhase;
  txHash: string | null;
  blockNumber: number | null;
  vaultStatus: VaultStatus;
  /** Available when phase === "retry"; no-op otherwise. */
  retry: () => Promise<void>;
}

interface UseTransferStatusArgs {
  kind: "deposit" | "withdrawal" | "transfer";
  id: string;
}

/**
 * Map a deposits-row status to a phase. Exhaustive over the union.
 */
function depositPhase(status: Deposit["status"]): TransferPhase {
  switch (status) {
    case "intent":
      return "paid";
    case "pending":
      return "funded";
    case "depositing":
      return "depositing";
    case "confirmed":
      return "earning";
    case "retry":
      return "retry";
    case "failed":
      return "failed";
    default: {
      // Compile-time exhaustiveness check.
      const _exhaustive: never = status;
      void _exhaustive;
      return "failed";
    }
  }
}

/**
 * Map a withdrawals-row status to a phase. Exhaustive over the union.
 */
function withdrawalPhase(status: Withdrawal["status"]): TransferPhase {
  switch (status) {
    case "pending":
      return "redeeming"; // about to fire the redeem UserOp
    case "redeeming":
      return "redeeming";
    case "transferring":
      return "transferring";
    case "settling":
      return "settling";
    case "completed":
      return "success";
    case "failed":
      return "failed_offramp";
    default: {
      const _exhaustive: never = status;
      void _exhaustive;
      return "failed";
    }
  }
}

const INITIAL: TransferStatus = {
  phase: "paid",
  txHash: null,
  blockNumber: null,
  vaultStatus: "active",
  retry: async () => {},
};

export function useTransferStatus({
  kind,
  id,
}: UseTransferStatusArgs): TransferStatus {
  const ctx = useStatusContext();

  // Last-known status, persisted across openOps cache evictions. When a row
  // transitions to terminal and drops from /api/transfers/open, the stepper
  // still wants to show the success state until the consumer unmounts.
  const [lastKnown, setLastKnown] = useState<TransferStatus>(INITIAL);

  useEffect(() => {
    if (kind === "deposit") {
      const row = ctx.openOps.deposits.find((d) => d.id === id);
      if (row) {
        setLastKnown({
          phase: depositPhase(row.status),
          txHash: row.tx_hash,
          blockNumber: null, // deposits don't carry block numbers in our schema
          vaultStatus: ctx.vaultStatus,
          retry: () => ctx.retry(row.id),
        });
      }
      // If row not found: keep lastKnown as-is (the row went terminal and
      // dropped from cache). Consumer keeps seeing the last phase.
    } else if (kind === "withdrawal") {
      const row = ctx.openOps.withdrawals.find((w) => w.id === id);
      if (row) {
        setLastKnown({
          phase: withdrawalPhase(row.status),
          txHash: row.tx_hash,
          blockNumber: null,
          vaultStatus: ctx.vaultStatus,
          retry: async () => {}, // withdrawals don't have a retry path in 2a
        });
      }
    } else {
      // kind === "transfer" (P2P) — Phase 3 wires this; placeholder for
      // typed exercise of the union.
      setLastKnown((prev) => ({
        ...prev,
        vaultStatus: ctx.vaultStatus,
      }));
    }
  }, [kind, id, ctx.openOps, ctx.vaultStatus, ctx.retry]);

  return lastKnown;
}
