"use client";

/**
 * Layout-level listener for inbound USDC arrivals to the smart wallet.
 *
 * Subscribes to `useDeposits` (chain-event watcher). On each new arrival:
 *   1. Records the arrival to the deposits table via /api/deposits/confirm.
 *      Idempotent: tx_hash UNIQUE in DB, so duplicate fires are absorbed.
 *   2. Fires `yusd.buildDeposit()` as a UserOp via useSendUserOperation.
 *      In stub mode buildDeposit returns `{ uo: [] }` — we short-circuit
 *      to terminal "confirmed" without sending a UserOp at all (the
 *      "Earning" transition happens immediately, since there's no swap to
 *      wait for).
 *   3. Marks the row terminal (`confirmed` on success, `retry` on UserOp
 *      error / vault paused).
 *   4. Calls statusContext.refresh() so every status surface in the app —
 *      stepper, banner, dashboard balance — picks up the new state.
 *
 * Mounted in LayoutContent (sub-phase 2a, commit 6) gated on
 * NEXT_PUBLIC_INBOUND_V2 + non-demo + connected-wallet. Renders nothing.
 *
 * Backstop limitation: useDeposits' `newDeposit` is a transient signal; if
 * the user closes the tab between arrival-detection and this handler
 * completing, the deposit row may end up stuck in `pending`. The backstop
 * for that case is the fetchHistory pull on next mount (lib/hooks/
 * useDeposits.ts:42-65) plus a future Coinbase webhook for Paid-tick
 * precision. Out of 2a scope; documented at the architecture level.
 */

import { useEffect, useRef } from "react";
import {
  useSendUserOperation,
  useSmartAccountClient,
} from "@account-kit/react";
import { formatUnits } from "viem";
import { useDeposits } from "@/lib/hooks/useDeposits";
import { useStatusContext } from "@/lib/context/StatusContext";
import { buildDeposit, YUSD_DECIMALS } from "@/lib/yusd";
import { DEMO_MODE } from "@/lib/demo-fixtures";
import type { Deposit } from "@/lib/db-postgres";

interface ArrivalListenerProps {
  /**
   * Gate the listener. The owner of LayoutContent passes the inbound-v2
   * flag here so the subscription only mounts when the feature is on.
   */
  enabled: boolean;
}

export function ArrivalListener({ enabled }: ArrivalListenerProps) {
  const { client } = useSmartAccountClient({});
  const walletAddress = client?.account?.address as `0x${string}` | undefined;

  const { sendUserOperationAsync } = useSendUserOperation({ client });
  const statusContext = useStatusContext();

  // Three-way gate: feature flag, no demo (demo store handles its own
  // simulated arrivals), connected wallet. useDeposits short-circuits
  // cleanly when `enabled` is false.
  const watchEnabled = enabled && !DEMO_MODE && !!walletAddress;
  const { newDeposit } = useDeposits(walletAddress, {
    enabled: watchEnabled,
    // Skip historical fetch — ArrivalListener only cares about live
    // arrivals (newDeposit signal). Avoids hitting Alchemy free tier's
    // 10-block eth_getLogs cap on a 10k-block historical pull.
    historyBlockCount: 0n,
  });

  // De-dupe: useDeposits clears `newDeposit` after 10s, but a remount could
  // re-trigger handling for the same hash. Track which hashes we've already
  // processed in this session.
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!newDeposit || !walletAddress) return;
    if (processedRef.current.has(newDeposit.txHash)) return;
    processedRef.current.add(newDeposit.txHash);

    let cancelled = false;
    (async () => {
      try {
        const amountWei = newDeposit.amountRaw.toString();
        const amountAssets = formatUnits(
          newDeposit.amountRaw,
          YUSD_DECIMALS,
        );

        // 1. Record the arrival. Server is idempotent on tx_hash.
        const recordRes = await fetch("/api/deposits/confirm", {
          method: "POST",
          headers: {
            "x-wallet-address": walletAddress,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            txHash: newDeposit.txHash,
            amountWei,
          }),
        });
        if (!recordRes.ok || cancelled) {
          await statusContext.refresh();
          return;
        }
        const { deposit } = (await recordRes.json()) as {
          deposit: Deposit | null;
        };
        if (!deposit) {
          await statusContext.refresh();
          return;
        }

        // ─── Durable idempotency guard ──────────────────────────────────
        // Session-scoped processedRef catches double-fire within one tab,
        // but not hard-refresh-mid-arrival or cross-tab races. The DB row's
        // deposit_op_hash is the durable marker: if it's already set, a
        // previous handler (this tab or another) has already fired the
        // deposit UserOp. Skip re-firing — receipt-tracking will pick up
        // from there.
        //
        // KNOWN LIMITATION (vault cutover concern, not 2a's): mid-flight
        // races where the first call has POSTed confirm but not yet
        // updated deposit_op_hash. In that window, this guard sees NULL
        // and a second tab could double-fire. Stub mode is unexposed
        // (uo is empty, no UserOp). Vault cutover should add a server-
        // side lock — atomic UPDATE deposit_op_hash = 'lock:<uuid>'
        // WHERE deposit_op_hash IS NULL, with TTL — before this client
        // fires sendUserOperationAsync. Out of 2a scope.
        if (deposit.deposit_op_hash) {
          await statusContext.refresh();
          return;
        }
        // ────────────────────────────────────────────────────────────────

        // 2. Fire auto-deposit UserOp (or skip in stub mode).
        const { uo } = buildDeposit(amountAssets);
        let depositOpHash: string | undefined;
        let terminal: "confirmed" | "retry" = "confirmed";

        if (uo.length === 0) {
          // Stub mode: no UserOp to send. The wallet already holds USDC,
          // which we treat as yUSD. Transition straight to terminal
          // 'confirmed' — that's the "Earning" stepper state.
        } else {
          try {
            // Vault mode: send the approve+deposit batch. waitForTxn left
            // off at this layer — the receipt-tracking lifecycle is
            // bookkept by StatusContext's receipt cache (stub for 2a;
            // wired at vault cutover).
            const result = await sendUserOperationAsync({ uo });
            depositOpHash = result.hash;
          } catch (err) {
            console.error("[ArrivalListener] deposit UserOp failed", err);
            terminal = "retry";
          }
        }

        if (cancelled) return;

        // 3. Mark row terminal + persist op hash.
        await fetch("/api/deposits/confirm", {
          method: "POST",
          headers: {
            "x-wallet-address": walletAddress,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            txHash: newDeposit.txHash,
            depositOpHash,
            terminal,
          }),
        });

        // 4. Tell every status surface to re-read from /api/transfers/open.
        await statusContext.refresh();
      } catch (err) {
        console.error("[ArrivalListener] handler error", err);
        await statusContext.refresh();
      }
    })();

    return () => {
      cancelled = true;
    };
    // newDeposit identity is what we care about; the rest are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newDeposit?.txHash]);

  return null;
}
