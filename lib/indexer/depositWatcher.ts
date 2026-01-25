/**
 * Deposit Watcher Service
 * 
 * Monitors incoming ERC20 transfers to user wallets.
 * Uses viem's event watching capabilities for real-time updates.
 */

import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { USDC_ADDRESS, YUSD_ADDRESS, USDC_DECIMALS, YUSD_DECIMALS } from '@/lib/transactions/sendYUSD';

// ERC20 Transfer event ABI
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

export interface DepositEvent {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  amountRaw: bigint;
  tokenAddress: string;
  tokenSymbol: 'USDC' | 'yUSD' | 'unknown';
  blockNumber: bigint;
  timestamp?: number;
}

export type DepositCallback = (deposit: DepositEvent) => void;

/**
 * Create a public client for the Base network
 */
function getPublicClient() {
  return createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org'),
  });
}

/**
 * Watch for incoming USDC transfers to a specific address
 */
export function watchUSDCDeposits(
  address: `0x${string}`,
  onDeposit: DepositCallback
): () => void {
  const client = getPublicClient();
  
  const unwatch = client.watchContractEvent({
    address: USDC_ADDRESS,
    abi: [TRANSFER_EVENT],
    eventName: 'Transfer',
    args: { to: address },
    onLogs: (logs) => {
      logs.forEach(log => {
        const deposit: DepositEvent = {
          txHash: log.transactionHash!,
          from: log.args.from as string,
          to: log.args.to as string,
          amount: formatUnits(log.args.value as bigint, USDC_DECIMALS),
          amountRaw: log.args.value as bigint,
          tokenAddress: USDC_ADDRESS,
          tokenSymbol: 'USDC',
          blockNumber: log.blockNumber!,
        };
        onDeposit(deposit);
      });
    },
    onError: (error) => {
      console.error('USDC deposit watcher error:', error);
    },
  });
  
  return unwatch;
}

/**
 * Watch for incoming yUSD transfers to a specific address
 */
export function watchYUSDDeposits(
  address: `0x${string}`,
  onDeposit: DepositCallback
): () => void {
  const client = getPublicClient();
  
  // Skip if yUSD address is not configured
  if (YUSD_ADDRESS === '0x0000000000000000000000000000000000000000') {
    console.log('[Indexer] yUSD address not configured, skipping watcher');
    return () => {};
  }
  
  const unwatch = client.watchContractEvent({
    address: YUSD_ADDRESS,
    abi: [TRANSFER_EVENT],
    eventName: 'Transfer',
    args: { to: address },
    onLogs: (logs) => {
      logs.forEach(log => {
        const deposit: DepositEvent = {
          txHash: log.transactionHash!,
          from: log.args.from as string,
          to: log.args.to as string,
          amount: formatUnits(log.args.value as bigint, YUSD_DECIMALS),
          amountRaw: log.args.value as bigint,
          tokenAddress: YUSD_ADDRESS,
          tokenSymbol: 'yUSD',
          blockNumber: log.blockNumber!,
        };
        onDeposit(deposit);
      });
    },
    onError: (error) => {
      console.error('yUSD deposit watcher error:', error);
    },
  });
  
  return unwatch;
}

/**
 * Watch all supported token deposits to an address
 */
export function watchAllDeposits(
  address: `0x${string}`,
  onDeposit: DepositCallback
): () => void {
  const unwatchUSDC = watchUSDCDeposits(address, onDeposit);
  const unwatchYUSD = watchYUSDDeposits(address, onDeposit);
  
  return () => {
    unwatchUSDC();
    unwatchYUSD();
  };
}

/**
 * Get historical deposits for an address
 */
export async function getHistoricalDeposits(
  address: `0x${string}`,
  fromBlock: bigint = 0n,
  toBlock?: bigint
): Promise<DepositEvent[]> {
  const client = getPublicClient();
  const deposits: DepositEvent[] = [];
  
  // Get USDC deposits
  try {
    const usdcLogs = await client.getLogs({
      address: USDC_ADDRESS,
      event: TRANSFER_EVENT,
      args: { to: address },
      fromBlock,
      toBlock: toBlock || 'latest',
    });
    
    for (const log of usdcLogs) {
      deposits.push({
        txHash: log.transactionHash!,
        from: log.args.from as string,
        to: log.args.to as string,
        amount: formatUnits(log.args.value as bigint, USDC_DECIMALS),
        amountRaw: log.args.value as bigint,
        tokenAddress: USDC_ADDRESS,
        tokenSymbol: 'USDC',
        blockNumber: log.blockNumber!,
      });
    }
  } catch (error) {
    console.error('Failed to get USDC history:', error);
  }
  
  // Get yUSD deposits
  if (YUSD_ADDRESS !== '0x0000000000000000000000000000000000000000') {
    try {
      const yUSDLogs = await client.getLogs({
        address: YUSD_ADDRESS,
        event: TRANSFER_EVENT,
        args: { to: address },
        fromBlock,
        toBlock: toBlock || 'latest',
      });
      
      for (const log of yUSDLogs) {
        deposits.push({
          txHash: log.transactionHash!,
          from: log.args.from as string,
          to: log.args.to as string,
          amount: formatUnits(log.args.value as bigint, YUSD_DECIMALS),
          amountRaw: log.args.value as bigint,
          tokenAddress: YUSD_ADDRESS,
          tokenSymbol: 'yUSD',
          blockNumber: log.blockNumber!,
        });
      }
    } catch (error) {
      console.error('Failed to get yUSD history:', error);
    }
  }
  
  // Sort by block number (newest first)
  deposits.sort((a, b) => Number(b.blockNumber - a.blockNumber));
  
  return deposits;
}

/**
 * Get the current block number
 */
export async function getCurrentBlockNumber(): Promise<bigint> {
  const client = getPublicClient();
  return await client.getBlockNumber();
}

/**
 * Get block timestamp
 */
export async function getBlockTimestamp(blockNumber: bigint): Promise<number> {
  const client = getPublicClient();
  const block = await client.getBlock({ blockNumber });
  return Number(block.timestamp);
}

