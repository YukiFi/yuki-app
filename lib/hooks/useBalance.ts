/**
 * Real-time balance hook — yUSD-fronted.
 *
 * Returns the user's "money" as a single yUSD-denominated balance plus the
 * yield-earned line and vault status. In stub mode the balance is the
 * smart wallet's USDC balance and earned is always "0.00" (no vault to
 * accrue against).
 *
 * Every consumer in the app reads from this hook, not from any USDC- or
 * vault-specific helper. The vault swap is a one-file change in `lib/yusd`.
 */

'use client';

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { getBalance, vaultStatus, type VaultStatus } from '@/lib/yusd';
import { DEMO_MODE, demoStore } from '@/lib/demo-fixtures';

export interface BalanceState {
  /** Human-readable USD balance, e.g. "1234.56". */
  balance: string;
  /** Yield earned vs cost basis, "0.00" in stub mode. */
  earned: string;
  /** Share count. Equals `balance` in stub mode. */
  shares: string;
  vaultStatus: VaultStatus;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseBalanceOptions {
  pollInterval?: number;
  enabled?: boolean;
}

const ZERO_STATE: Omit<BalanceState, 'lastUpdated' | 'error' | 'isLoading'> = {
  balance: '0',
  earned: '0.00',
  shares: '0',
  vaultStatus: 'active',
};

export function useBalance(
  address: `0x${string}` | undefined,
  options: UseBalanceOptions = {}
) {
  const { pollInterval = 30000, enabled = true } = options;

  // Demo state flows through the shared store so a fake send updates every
  // balance widget in the app simultaneously.
  const demoBalance = useSyncExternalStore(
    demoStore.subscribe,
    () => demoStore.getBalance(),
    () => demoStore.getBalance(),
  );

  const [state, setState] = useState<BalanceState>({
    ...ZERO_STATE,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!address || !enabled) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    if (DEMO_MODE) {
      // Demo state is sourced from useSyncExternalStore at the return site —
      // no-op here.
      return;
    }

    try {
      const [bal, status] = await Promise.all([
        getBalance(address),
        vaultStatus(),
      ]);
      // Cost basis isn't tracked yet in stub mode (no deposits write-path
      // wired); pass current balance as the basis so earned = 0. Phase 2
      // wires the deposits totals through here.
      setState({
        balance: bal.assets,
        earned: '0.00',
        shares: bal.shares,
        vaultStatus: status,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
      }));
    }
  }, [address, enabled]);

  useEffect(() => {
    if (enabled && address) {
      fetchBalances();
    }
  }, [enabled, address, fetchBalances]);

  useEffect(() => {
    if (!enabled || !address || pollInterval <= 0) return;
    intervalRef.current = setInterval(fetchBalances, pollInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, address, pollInterval, fetchBalances]);

  const refetch = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    return fetchBalances();
  }, [fetchBalances]);

  if (DEMO_MODE) {
    return {
      balance: demoBalance.total,
      earned: '0.00',
      shares: demoBalance.total,
      vaultStatus: 'active' as VaultStatus,
      isLoading: false,
      error: null,
      lastUpdated: new Date(0),
      refetch,
    };
  }

  return { ...state, refetch };
}

/**
 * Format a balance for display with proper decimal places.
 */
export function formatBalance(balance: string, decimals: number = 2): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0.00';
  if (num > 0 && num < 0.01) return num.toFixed(6);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a balance as USD currency.
 */
export function formatCurrency(balance: string): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
