/**
 * Real-time Balance Hook
 * 
 * Fetches and monitors yUSD, USDC, and ETH balances for the connected wallet.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getYUSDBalance, getUSDCBalance, getETHBalance } from '@/lib/transactions/sendYUSD';

export interface BalanceState {
  yUSD: string;
  usdc: string;
  eth: string;
  total: string; // Total in USD terms
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseBalanceOptions {
  pollInterval?: number; // ms, default 30000 (30 seconds)
  enabled?: boolean;
}

export function useBalance(
  address: `0x${string}` | undefined,
  options: UseBalanceOptions = {}
) {
  const { pollInterval = 30000, enabled = true } = options;
  
  const [state, setState] = useState<BalanceState>({
    yUSD: '0',
    usdc: '0',
    eth: '0',
    total: '0',
    isLoading: true,
    error: null,
    lastUpdated: null,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const fetchBalances = useCallback(async () => {
    if (!address || !enabled) {
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return;
    }
    
    try {
      // Fetch all balances in parallel
      const [yUSDBalance, usdcBalance, ethBalance] = await Promise.all([
        getYUSDBalance(address),
        getUSDCBalance(address),
        getETHBalance(address),
      ]);
      
      // Calculate total (assuming yUSD and USDC are 1:1 with USD)
      const yUSDNum = parseFloat(yUSDBalance) || 0;
      const usdcNum = parseFloat(usdcBalance) || 0;
      const total = (yUSDNum + usdcNum).toFixed(2);
      
      setState({
        yUSD: yUSDBalance,
        usdc: usdcBalance,
        eth: ethBalance,
        total,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch balances',
      }));
    }
  }, [address, enabled]);
  
  // Initial fetch
  useEffect(() => {
    if (enabled && address) {
      fetchBalances();
    }
  }, [enabled, address, fetchBalances]);
  
  // Polling
  useEffect(() => {
    if (!enabled || !address || pollInterval <= 0) {
      return;
    }
    
    intervalRef.current = setInterval(fetchBalances, pollInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, address, pollInterval, fetchBalances]);
  
  const refetch = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    return fetchBalances();
  }, [fetchBalances]);
  
  return {
    ...state,
    refetch,
  };
}

/**
 * Format a balance for display with proper decimal places
 */
export function formatBalance(balance: string, decimals: number = 2): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0.00';
  
  // For very small amounts, show more decimals
  if (num > 0 && num < 0.01) {
    return num.toFixed(6);
  }
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format balance as currency
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

