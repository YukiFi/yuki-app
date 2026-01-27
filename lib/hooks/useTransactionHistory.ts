/**
 * Transaction History Hook
 * 
 * Fetches transaction history using Alchemy's Transfers API.
 * Much more efficient than scanning blockchain logs manually.
 * 
 * @see https://www.alchemy.com/docs/reference/transfers-api-quickstart
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatUnits } from 'viem';

export type TransactionType = 'sent' | 'received' | 'deposit' | 'withdrawal' | 'yield';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  counterparty?: string;
  amount: number;
  timestamp: Date;
  status: 'completed' | 'pending';
  txHash?: string;
  tokenSymbol?: string;
}

export interface TransactionHistoryState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseTransactionHistoryOptions {
  enabled?: boolean;
  limit?: number;
}

// Alchemy Transfers API response types
interface AlchemyTransfer {
  blockNum: string;
  uniqueId: string;
  hash: string;
  from: string;
  to: string;
  value: number | null;
  erc721TokenId: string | null;
  erc1155Metadata: unknown | null;
  tokenId: string | null;
  asset: string | null;
  category: 'external' | 'internal' | 'erc20' | 'erc721' | 'erc1155' | 'specialnft';
  rawContract: {
    value: string | null;
    address: string | null;
    decimal: string | null;
  };
  metadata: {
    blockTimestamp: string;
  };
}

interface AlchemyTransfersResponse {
  jsonrpc: string;
  id: number;
  result: {
    transfers: AlchemyTransfer[];
    pageKey?: string;
  };
}

/**
 * Fetch transfers from Alchemy Transfers API
 */
async function fetchAlchemyTransfers(
  address: string,
  direction: 'from' | 'to',
  maxCount: number = 100
): Promise<AlchemyTransfer[]> {
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error('Alchemy API key not configured');
  }

  const rpcUrl = `https://base-mainnet.g.alchemy.com/v2/${apiKey}`;
  
  const params: Record<string, unknown> = {
    [direction === 'from' ? 'fromAddress' : 'toAddress']: address,
    category: ['external', 'erc20'],
    order: 'desc',
    withMetadata: true,
    maxCount,
  };

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getAssetTransfers',
      params: [params],
    }),
  });

  if (!response.ok) {
    throw new Error(`Alchemy API error: ${response.status}`);
  }

  const data: AlchemyTransfersResponse = await response.json();
  
  if (!data.result?.transfers) {
    return [];
  }

  return data.result.transfers;
}

/**
 * Convert Alchemy transfer to our Transaction format
 */
function transferToTransaction(
  transfer: AlchemyTransfer,
  userAddress: string,
  direction: 'sent' | 'received'
): Transaction {
  const counterparty = direction === 'sent' ? transfer.to : transfer.from;
  const shortAddress = `${counterparty.slice(0, 6)}...${counterparty.slice(-4)}`;
  
  // Calculate amount
  let amount = 0;
  if (transfer.value !== null) {
    amount = transfer.value;
  } else if (transfer.rawContract.value && transfer.rawContract.decimal) {
    amount = parseFloat(
      formatUnits(
        BigInt(transfer.rawContract.value),
        parseInt(transfer.rawContract.decimal)
      )
    );
  }
  
  // Make sent amounts negative
  if (direction === 'sent') {
    amount = -Math.abs(amount);
  }
  
  // Determine token symbol
  let tokenSymbol = transfer.asset || 'ETH';
  if (transfer.category === 'external') {
    tokenSymbol = 'ETH';
  }
  
  return {
    id: transfer.uniqueId,
    type: direction,
    description: direction === 'sent' 
      ? `Sent to ${shortAddress}`
      : `From ${shortAddress}`,
    counterparty,
    amount,
    timestamp: new Date(transfer.metadata.blockTimestamp),
    status: 'completed',
    txHash: transfer.hash,
    tokenSymbol,
  };
}

export function useTransactionHistory(
  address: `0x${string}` | undefined,
  options: UseTransactionHistoryOptions = {}
) {
  const { enabled = true, limit = 50 } = options;
  
  const [state, setState] = useState<TransactionHistoryState>({
    transactions: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });
  
  const fetchTransactions = useCallback(async () => {
    if (!address || !enabled) {
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return;
    }
    
    try {
      // Fetch both sent and received transfers in parallel
      const [sentTransfers, receivedTransfers] = await Promise.all([
        fetchAlchemyTransfers(address, 'from', limit),
        fetchAlchemyTransfers(address, 'to', limit),
      ]);
      
      // Convert to our Transaction format
      const sentTxs = sentTransfers.map(t => 
        transferToTransaction(t, address, 'sent')
      );
      const receivedTxs = receivedTransfers.map(t => 
        transferToTransaction(t, address, 'received')
      );
      
      // Combine, deduplicate, and sort by timestamp (newest first)
      const allTransactions = [...sentTxs, ...receivedTxs]
        .filter((tx, index, arr) => 
          // Remove duplicates by txHash (same tx can appear in both sent/received if self-transfer)
          arr.findIndex(t => t.txHash === tx.txHash && t.type === tx.type) === index
        )
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
      
      setState({
        transactions: allTransactions,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transaction history',
      }));
    }
  }, [address, enabled, limit]);
  
  // Initial fetch
  useEffect(() => {
    if (enabled && address) {
      fetchTransactions();
    }
  }, [enabled, address, fetchTransactions]);
  
  // Poll for updates every 30 seconds
  useEffect(() => {
    if (!enabled || !address) {
      return;
    }
    
    const interval = setInterval(fetchTransactions, 30000);
    
    return () => clearInterval(interval);
  }, [enabled, address, fetchTransactions]);
  
  const refetch = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    return fetchTransactions();
  }, [fetchTransactions]);
  
  return {
    ...state,
    refetch,
  };
}
