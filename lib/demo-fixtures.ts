/**
 * Demo state — single source of truth for NEXT_PUBLIC_DEMO_MODE.
 *
 * Hooks subscribe to this store via `useSyncExternalStore`, so a demo action
 * (e.g. SendModal's fake transfer) propagates to every dashboard reading
 * balances or transactions. No on-chain reads, no real funds.
 *
 * The store is module-level mutable singleton state. That's deliberate: demo
 * mode is a dev/preview-only flag, the lifetime is the browser tab, and any
 * cross-component sharing has to live somewhere. Don't import this in
 * production code paths — guard with DEMO_MODE.
 */

import type { Transaction, TransactionType } from './hooks/useTransactionHistory';

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === '1';

// Approximate self address used for demo-side party labelling.
export const DEMO_SELF_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface DemoBalance {
  yUSD: string;
  usdc: string;
  eth: string;
  total: string;
}

const INITIAL_BALANCE: DemoBalance = {
  yUSD: '1245.32',
  usdc: '380.00',
  eth: '0.0421',
  total: '1625.32', // yUSD + usdc; ETH excluded from $ total
};

const day = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'demo-tx-1',
    type: 'received',
    description: 'From @alice_demo',
    counterparty: '0x1111111111111111111111111111111111111111',
    amount: 25,
    timestamp: day(0),
    status: 'completed',
    txHash: '0xdemo000000000000000000000000000000000000000000000000000000000001',
    tokenSymbol: 'yUSD',
  },
  {
    id: 'demo-tx-2',
    type: 'sent',
    description: 'Sent to @bob_demo',
    counterparty: '0x2222222222222222222222222222222222222222',
    amount: -12.5,
    timestamp: day(1),
    status: 'completed',
    txHash: '0xdemo000000000000000000000000000000000000000000000000000000000002',
    tokenSymbol: 'yUSD',
  },
  {
    id: 'demo-tx-3',
    type: 'deposit',
    description: 'Deposit from bank',
    amount: 1000,
    timestamp: day(7),
    status: 'completed',
    txHash: '0xdemo000000000000000000000000000000000000000000000000000000000003',
    tokenSymbol: 'USDC',
  },
  {
    id: 'demo-tx-4',
    type: 'yield',
    description: 'Yield from Morpho',
    amount: 4.21,
    timestamp: day(2),
    status: 'completed',
    tokenSymbol: 'yUSD',
  },
  {
    id: 'demo-tx-5',
    type: 'withdrawal',
    description: 'Withdraw to bank',
    amount: -75,
    timestamp: day(5),
    status: 'completed',
    txHash: '0xdemo000000000000000000000000000000000000000000000000000000000005',
    tokenSymbol: 'USDC',
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────────────────────────────

type Listener = () => void;

let balanceState: DemoBalance = { ...INITIAL_BALANCE };
let transactionsState: Transaction[] = INITIAL_TRANSACTIONS.slice();
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l();
}

function recomputeTotal(b: DemoBalance): DemoBalance {
  const total = (
    (parseFloat(b.yUSD) || 0) + (parseFloat(b.usdc) || 0)
  ).toFixed(2);
  return { ...b, total };
}

export const demoStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getBalance(): DemoBalance {
    return balanceState;
  },
  getTransactions(): Transaction[] {
    return transactionsState;
  },
  /**
   * Record a fake send: debits USDC and prepends a "sent" transaction.
   * Returns the synthesized transaction so the caller can echo the hash.
   */
  recordSend(args: {
    counterparty: string;
    counterpartyLabel: string; // e.g. "@alice_demo"
    amount: number;
    txHash: string;
  }): Transaction {
    const next: Transaction = {
      id: `demo-tx-${Date.now()}`,
      type: 'sent',
      description: `Sent to ${args.counterpartyLabel}`,
      counterparty: args.counterparty,
      amount: -Math.abs(args.amount),
      timestamp: new Date(),
      status: 'completed',
      txHash: args.txHash,
      tokenSymbol: 'USDC',
    };
    transactionsState = [next, ...transactionsState];
    const newUsdc = Math.max(
      0,
      (parseFloat(balanceState.usdc) || 0) - Math.abs(args.amount),
    ).toFixed(2);
    balanceState = recomputeTotal({ ...balanceState, usdc: newUsdc });
    notify();
    return next;
  },
  /**
   * Drop a transaction by hash + restore its balance impact. Useful for
   * "undo" or test cleanup.
   */
  reset() {
    balanceState = { ...INITIAL_BALANCE };
    transactionsState = INITIAL_TRANSACTIONS.slice();
    notify();
  },
};

// Backwards-compat exports — kept as live snapshots, but new code should read
// from `demoStore` so it stays reactive.
export const DEMO_BALANCE: DemoBalance = INITIAL_BALANCE;
export const DEMO_TRANSACTIONS: Transaction[] = INITIAL_TRANSACTIONS;

// Re-export for callers that want the active type set without importing the
// hook module directly.
export type { Transaction, TransactionType };
