/**
 * StatusContext — single source of truth for inbound/outbound transfer state.
 *
 * Mounted at the layout level (sub-phase 2a, commit 6). Owns the *only* poll
 * loop hitting `/api/transfers/open`, plus a parallel `vaultStatus` poll. All
 * status surfaces — useTransferStatus selectors, ArrivalListener, StatusBanner
 * (sub-phase 2c) — read from this cache. **No consumer should fetch.**
 *
 * The architectural failure mode this prevents: each stepper firing its own
 * poll loop on mount → N+1 queries, multiple sources of truth, divergent
 * stale states. The hook can't drift into per-mount fetching because it has
 * no fetch primitive in scope; it only reads context.
 *
 * Receipt polling for UserOp hashes is stubbed in 2a (returns null). Lights
 * up at vault cutover when buildDeposit returns a non-empty UO batch.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSmartAccountClient } from "@account-kit/react";
import { vaultStatus as fetchVaultStatus, type VaultStatus } from "@/lib/yusd";
import type { Deposit, Withdrawal } from "@/lib/db-postgres";
import { DEMO_MODE } from "@/lib/demo-fixtures";

// Cadences (ms). Tunable; chosen so an active deposit feels live without
// hammering the bundler endpoint.
const OPEN_OPS_POLL_MS = 5_000;
const VAULT_STATUS_POLL_MS = 60_000;

interface OpenOps {
  deposits: Deposit[];
  withdrawals: Withdrawal[];
}

interface StatusContextValue {
  openOps: OpenOps;
  vaultStatus: VaultStatus;
  isLoading: boolean;
  /** Force-refresh the open-ops cache. ArrivalListener calls this on chain arrival. */
  refresh: () => Promise<void>;
  /** Retry a deposit row stuck in `retry` status. Stub for 2a; full logic in 2c. */
  retry: (id: string) => Promise<void>;
}

const EMPTY: OpenOps = { deposits: [], withdrawals: [] };

const StatusContext = createContext<StatusContextValue | null>(null);

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const { client } = useSmartAccountClient({});
  const walletAddress = client?.account?.address as `0x${string}` | undefined;

  const [openOps, setOpenOps] = useState<OpenOps>(EMPTY);
  const [vaultStat, setVaultStat] = useState<VaultStatus>("active");
  const [isLoading, setIsLoading] = useState(false);

  // Track whether any open row exists, to gate the polling cadence: idle when
  // nothing's in flight, active when something is.
  const hasOpenRowsRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!walletAddress || DEMO_MODE) return;
    try {
      const res = await fetch("/api/transfers/open", {
        headers: { "x-wallet-address": walletAddress },
      });
      if (!res.ok) return;
      const data = (await res.json()) as OpenOps;
      setOpenOps(data);
      hasOpenRowsRef.current =
        data.deposits.length > 0 || data.withdrawals.length > 0;
    } catch {
      // network blip — try again on next tick
    }
  }, [walletAddress]);

  const retry = useCallback(async (_id: string) => {
    // 2a stub: real implementation lands in sub-phase 2c with the
    // POST /api/deposits/[id]/retry endpoint and the retry-deposit UserOp.
    // For now, surface a no-op so consumers (StatusBanner) compile.
    console.warn("[StatusContext] retry not implemented in sub-phase 2a");
  }, []);

  // Initial fetch + open-ops polling. Only polls while at least one row is
  // open, so an idle dashboard doesn't burn requests.
  useEffect(() => {
    if (!walletAddress || DEMO_MODE) {
      setOpenOps(EMPTY);
      return;
    }
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));

    let interval: NodeJS.Timeout | null = null;
    const tick = () => {
      // Adaptive cadence — only poll when we know something's open. If a new
      // row appears mid-idle (e.g., another tab), ArrivalListener will call
      // refresh() which restarts the loop.
      if (hasOpenRowsRef.current) {
        void refresh();
      }
    };
    interval = setInterval(tick, OPEN_OPS_POLL_MS);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [walletAddress, refresh]);

  // Vault status — polled independently, slow cadence. In stub mode this
  // always returns 'active' so the cost is near-zero.
  useEffect(() => {
    if (DEMO_MODE) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const s = await fetchVaultStatus();
        if (!cancelled) setVaultStat(s);
      } catch {
        // Treat fetch errors as 'unknown' so StatusBanner can surface
        // ambiguity rather than implying everything's fine.
        if (!cancelled) setVaultStat("unknown");
      }
    };
    void tick();
    const interval = setInterval(tick, VAULT_STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const value: StatusContextValue = {
    openOps,
    vaultStatus: vaultStat,
    isLoading,
    refresh,
    retry,
  };

  return (
    <StatusContext.Provider value={value}>{children}</StatusContext.Provider>
  );
}

/**
 * Read access to the StatusContext. Returns a default empty state if no
 * provider is mounted (e.g., on full-bleed pages like /tx/[hash] that
 * intentionally skip the layout chrome). Consumers should treat this as
 * "I'm in a context where transfer status doesn't apply" and render
 * accordingly — not as an error.
 */
export function useStatusContext(): StatusContextValue {
  const ctx = useContext(StatusContext);
  if (!ctx) {
    return {
      openOps: EMPTY,
      vaultStatus: "unknown",
      isLoading: false,
      refresh: async () => {},
      retry: async () => {},
    };
  }
  return ctx;
}
