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
 * Create a public client for the Base network.
 *
 * pollingInterval is set to 12s rather than viem's HTTP default of 4s. On
 * Base's 2s block time, 4s = ~1 poll per 2 blocks, which is overkill for
 * "did a deposit just land" — a 12s ceiling on detection latency is plenty
 * for a Venmo-feel UX, and it cuts the watcher's CU burn ~3× at idle. Each
 * tick is an eth_getLogs call (~75 CU on Alchemy), so 900/hr → 300/hr per
 * session. WebSocket transport (eth_subscribe) is the proper fix at scale;
 * deferred until usage warrants it.
 */
const WATCHER_POLLING_INTERVAL_MS = 12_000;

function getPublicClient() {
  // Prefer the explicit Alchemy URL if set; fall back to the generic
  // NEXT_PUBLIC_RPC_URL; last resort the public Base RPC. The public RPC
  // 429s aggressively under any real load and load-balances across nodes
  // (which causes filter-not-found errors on watchContractEvent), so
  // hitting the fallback is a config-bug signal.
  const rpcUrl =
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    'https://mainnet.base.org';
  return createPublicClient({
    chain: base,
    transport: http(rpcUrl),
    pollingInterval: WATCHER_POLLING_INTERVAL_MS,
  });
}

// Alchemy free tier caps eth_getLogs at a 10-block range. We poll inside
// that limit explicitly instead of relying on viem's watchContractEvent,
// which used node-side filters (eth_newFilter + eth_getFilterChanges) —
// filters get GC'd between calls on load-balanced or free-tier RPCs and
// surface as "filter not found" errors. Manual getLogs polling is
// stateless and works on any tier.
const MAX_LOGS_BLOCK_RANGE = 10n;

/**
 * Internal: manual getLogs polling loop. Stateless on the RPC side; bounded
 * 10-block window per request to fit Alchemy free tier limits.
 *
 * On first tick we look at `currentBlock - 9..currentBlock` to catch arrivals
 * that just landed before the watcher mounted. Subsequent ticks cover from
 * the previous tick's lastSeen+1 forward, capped at 10 blocks. If the user is
 * away from the page longer than 10 blocks (~20s on Base), we'll miss
 * arrivals in the gap; the historical backstop (when re-mounted) covers it.
 */
function pollForDeposits(
  tokenAddress: `0x${string}`,
  receiver: `0x${string}`,
  decimals: number,
  tokenSymbol: DepositEvent['tokenSymbol'],
  onDeposit: DepositCallback,
): () => void {
  const client = getPublicClient();
  let lastSeenBlock: bigint | null = null;
  let cancelled = false;
  let timer: NodeJS.Timeout | null = null;
  // Per-session de-dupe — overlapping poll windows can include the same log
  // twice across consecutive ticks. Set is unbounded for the watcher's
  // lifetime (one auth session); not a real leak risk.
  const seen = new Set<string>();

  const tick = async () => {
    if (cancelled) return;
    try {
      const currentBlock = await client.getBlockNumber();
      const fromBlock =
        lastSeenBlock === null
          ? currentBlock - (MAX_LOGS_BLOCK_RANGE - 1n)
          : lastSeenBlock + 1n;
      if (fromBlock > currentBlock) return;
      const cappedFrom =
        currentBlock - fromBlock >= MAX_LOGS_BLOCK_RANGE
          ? currentBlock - (MAX_LOGS_BLOCK_RANGE - 1n)
          : fromBlock;

      const logs = await client.getContractEvents({
        address: tokenAddress,
        abi: [TRANSFER_EVENT],
        eventName: 'Transfer',
        args: { to: receiver },
        fromBlock: cappedFrom,
        toBlock: currentBlock,
      });

      lastSeenBlock = currentBlock;

      for (const log of logs) {
        const txHash = log.transactionHash!;
        if (seen.has(txHash)) continue;
        seen.add(txHash);
        onDeposit({
          txHash,
          from: log.args.from as string,
          to: log.args.to as string,
          amount: formatUnits(log.args.value as bigint, decimals),
          amountRaw: log.args.value as bigint,
          tokenAddress,
          tokenSymbol,
          blockNumber: log.blockNumber!,
        });
      }
    } catch (err) {
      console.error(`${tokenSymbol} deposit watcher error:`, err);
    } finally {
      if (!cancelled) {
        timer = setTimeout(tick, WATCHER_POLLING_INTERVAL_MS);
      }
    }
  };

  void tick();

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}

/**
 * Watch for incoming USDC transfers to a specific address
 */
export function watchUSDCDeposits(
  address: `0x${string}`,
  onDeposit: DepositCallback
): () => void {
  return pollForDeposits(USDC_ADDRESS, address, USDC_DECIMALS, 'USDC', onDeposit);
}

/**
 * Watch for incoming yUSD transfers to a specific address
 */
export function watchYUSDDeposits(
  address: `0x${string}`,
  onDeposit: DepositCallback
): () => void {
  // Skip if yUSD address is not configured (stub mode).
  if (YUSD_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return () => {};
  }
  return pollForDeposits(YUSD_ADDRESS, address, YUSD_DECIMALS, 'yUSD', onDeposit);
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

