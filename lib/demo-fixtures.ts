/**
 * Demo fixtures for development.
 *
 * Activated when NEXT_PUBLIC_DEMO_MODE === '1'. Hooks consult this module
 * before hitting Alchemy / on-chain reads, so dashboards render against
 * deterministic fake data without moving any funds.
 */

import type { Transaction } from './hooks/useTransactionHistory';

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === '1';

export const DEMO_BALANCE = {
  yUSD: '1245.32',
  usdc: '380.00',
  eth: '0.0421',
  total: '1781.96',
};

const day = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

export const DEMO_TRANSACTIONS: Transaction[] = [
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
