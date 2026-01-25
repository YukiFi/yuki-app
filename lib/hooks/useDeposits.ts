/**
 * Deposits Hook
 * 
 * React hook for monitoring incoming deposits to a wallet.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  watchAllDeposits, 
  getHistoricalDeposits,
  type DepositEvent 
} from '@/lib/indexer/depositWatcher';

export interface UseDepositsOptions {
  enabled?: boolean;
  historyBlockCount?: bigint; // How many blocks back to fetch history (default: 10000)
}

export interface UseDepositsReturn {
  deposits: DepositEvent[];
  isLoading: boolean;
  error: string | null;
  newDeposit: DepositEvent | null; // Most recent deposit (for notifications)
  refetch: () => Promise<void>;
}

export function useDeposits(
  address: `0x${string}` | undefined,
  options: UseDepositsOptions = {}
): UseDepositsReturn {
  const { enabled = true, historyBlockCount = 10000n } = options;
  
  const [deposits, setDeposits] = useState<DepositEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDeposit, setNewDeposit] = useState<DepositEvent | null>(null);
  
  const unwatchRef = useRef<(() => void) | null>(null);
  
  // Fetch historical deposits
  const fetchHistory = useCallback(async () => {
    if (!address || !enabled) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { getCurrentBlockNumber } = await import('@/lib/indexer/depositWatcher');
      const currentBlock = await getCurrentBlockNumber();
      const fromBlock = currentBlock > historyBlockCount ? currentBlock - historyBlockCount : 0n;
      
      const history = await getHistoricalDeposits(address, fromBlock);
      setDeposits(history);
    } catch (err) {
      console.error('Failed to fetch deposit history:', err);
      setError('Failed to load deposit history');
    } finally {
      setIsLoading(false);
    }
  }, [address, enabled, historyBlockCount]);
  
  // Set up real-time watcher
  useEffect(() => {
    if (!address || !enabled) {
      return;
    }
    
    // Clean up previous watcher
    if (unwatchRef.current) {
      unwatchRef.current();
    }
    
    // Start watching for new deposits
    const unwatch = watchAllDeposits(address, (deposit) => {
      console.log('[Deposits] New deposit received:', deposit);
      
      // Add to deposits list
      setDeposits(prev => {
        // Check if already exists
        if (prev.some(d => d.txHash === deposit.txHash)) {
          return prev;
        }
        return [deposit, ...prev];
      });
      
      // Set as new deposit for notifications
      setNewDeposit(deposit);
      
      // Clear new deposit after 10 seconds
      setTimeout(() => {
        setNewDeposit(prev => prev?.txHash === deposit.txHash ? null : prev);
      }, 10000);
    });
    
    unwatchRef.current = unwatch;
    
    return () => {
      if (unwatchRef.current) {
        unwatchRef.current();
        unwatchRef.current = null;
      }
    };
  }, [address, enabled]);
  
  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);
  
  return {
    deposits,
    isLoading,
    error,
    newDeposit,
    refetch: fetchHistory,
  };
}

/**
 * Format deposit for display
 */
export function formatDeposit(deposit: DepositEvent): string {
  const amount = parseFloat(deposit.amount);
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${deposit.tokenSymbol}`;
}

