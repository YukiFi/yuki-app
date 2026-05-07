/**
 * Server-side transaction lookup by hash.
 *
 * Powers the /tx/[hash] receipt pages. Demo hashes ("0xdemo...") resolve from
 * fixtures; real hashes resolve via Alchemy/RPC and ERC-20 log decoding.
 * Both branches enrich the from/to addresses with our DB user records when
 * available, so receipts show usernames + avatars instead of raw addresses.
 */

import "server-only";
import {
  erc20Abi,
  formatUnits,
  getAddress,
  parseEventLogs,
} from "viem";
import { createPublicViemClient } from "@/lib/wagmi";
import { isBalanceToken, symbolForToken, YUSD_DECIMALS } from "@/lib/yusd";
import { DEMO_TRANSACTIONS } from "@/lib/demo-fixtures";
import {
  getUserByWalletAddressPg,
  getDepositByTxHashPg,
  getWithdrawalByTxHashPg,
} from "@/lib/db-postgres";

export type TxParty = {
  address: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type TxStatus = "success" | "failed" | "pending";

export type TxDetail = {
  hash: string;
  status: TxStatus;
  network: "Base";
  tokenSymbol: string;
  amount: number;
  amountWei?: string;
  from: TxParty;
  to: TxParty;
  timestamp: Date | null;
  blockNumber: number | null;
  isDemo: boolean;
};

const HASH_RE = /^0x[0-9a-f]{64}$/;
const DEMO_PREFIX = "0xdemo";

export async function getTransactionByHash(
  hash: string,
): Promise<TxDetail | null> {
  const lower = hash.toLowerCase();
  if (lower.startsWith(DEMO_PREFIX)) return resolveDemoTransaction(lower);
  if (!HASH_RE.test(lower)) return null;
  return resolveOnChainTransaction(lower as `0x${string}`);
}

async function resolveDemoTransaction(hash: string): Promise<TxDetail | null> {
  const tx = DEMO_TRANSACTIONS.find(
    (t) => t.txHash?.toLowerCase() === hash,
  );
  if (!tx) return null;

  // Demo fixtures use "you" as one side; the counterparty (if any) is on-chain
  // looking but anchored in the fixtures.
  const youParty: TxParty = {
    address: "0x0000000000000000000000000000000000000000",
    username: "you",
    displayName: "You",
    avatarUrl: null,
  };
  const otherAddress =
    tx.counterparty || "0x0000000000000000000000000000000000000000";
  const otherParty = await resolveParty(otherAddress);

  let from: TxParty;
  let to: TxParty;
  if (tx.type === "sent" || tx.type === "withdrawal") {
    from = youParty;
    to = otherParty;
  } else {
    from = otherParty;
    to = youParty;
  }

  return {
    hash: tx.txHash!,
    status: tx.status === "completed" ? "success" : "pending",
    network: "Base",
    tokenSymbol: tx.tokenSymbol || "USDC",
    amount: Math.abs(tx.amount),
    from,
    to,
    timestamp: tx.timestamp,
    blockNumber: null,
    isDemo: true,
  };
}

async function resolveOnChainTransaction(
  hash: `0x${string}`,
): Promise<TxDetail | null> {
  const client = createPublicViemClient();

  let tx;
  try {
    tx = await client.getTransaction({ hash });
  } catch {
    return null;
  }
  if (!tx) return null;

  let receipt: Awaited<ReturnType<typeof client.getTransactionReceipt>> | null =
    null;
  try {
    receipt = await client.getTransactionReceipt({ hash });
  } catch {
    receipt = null;
  }

  let timestamp: Date | null = null;
  if (receipt?.blockNumber) {
    try {
      const block = await client.getBlock({ blockNumber: receipt.blockNumber });
      timestamp = new Date(Number(block.timestamp) * 1000);
    } catch {
      // best-effort
    }
  }

  // Default to the raw tx-level addresses; ERC-20 decoding overrides below.
  let fromAddr = tx.from.toLowerCase();
  let toAddr = tx.to?.toLowerCase() ?? "";
  let amount = 0;
  let amountWei: string | undefined;
  let tokenSymbol = "ETH";

  // ─── Symbol-resolution precedence ────────────────────────────────────────
  // For owned resources (deposits, withdrawals, requests.paid_tx_hash), the
  // snapshot column `token_symbol_at_time` is ALWAYS authoritative — it was
  // captured at write time and is the user-facing label they saw on the
  // receipt. Live-decode below is the fallback for tx hashes that don't
  // appear in any owned table (e.g., direct P2P sends that pre-date a
  // dedicated transfers table).
  //
  // DO NOT "optimize" this by skipping the snapshot lookup. The whole point
  // of (b) snapshot-at-write is that share links remain stable across vault
  // cutover — relabeling history would break /tx/[hash] receipts that users
  // have already shared. Live-decode is correct only when there's no
  // snapshot to honor.
  //
  // Sub-phase 2a wires the deposits-table lookup here; 2b extends to
  // withdrawals (the helper is already imported); Phase 3 adds
  // requests.paid_tx_hash.
  // ────────────────────────────────────────────────────────────────────────

  // ─── Symbol-resolution precedence ────────────────────────────────────────
  // For owned resources (deposits, withdrawals, requests.paid_tx_hash), the
  // snapshot column `token_symbol_at_time` is ALWAYS authoritative — it was
  // captured at write time and is the user-facing label they saw on the
  // receipt. Live-decode below is the fallback for tx hashes that don't
  // appear in any owned table (e.g., direct P2P sends that pre-date a
  // dedicated transfers table).
  //
  // DO NOT "optimize" this by skipping the snapshot lookup. The whole point
  // of (b) snapshot-at-write is that share links remain stable across vault
  // cutover — relabeling history would break /tx/[hash] receipts that users
  // have already shared. Live-decode is correct only when there's no
  // snapshot to honor.
  // ────────────────────────────────────────────────────────────────────────

  let snapshotSymbol: string | null = null;
  try {
    // Both helpers are O(1) lookups (tx_hash UNIQUE on deposits, indexed on
    // withdrawals). Run in parallel; first hit wins. A tx_hash should only
    // ever appear in one of the two tables, but we don't enforce that here
    // — if both somehow match, deposits takes precedence as the more
    // common case.
    const [depRow, wdRow] = await Promise.all([
      getDepositByTxHashPg(hash),
      getWithdrawalByTxHashPg(hash),
    ]);
    if (depRow?.token_symbol_at_time) snapshotSymbol = depRow.token_symbol_at_time;
    else if (wdRow?.token_symbol_at_time) snapshotSymbol = wdRow.token_symbol_at_time;
  } catch {
    // DB unavailable — fall through to live decode. Snapshot is best-effort.
  }

  if (receipt?.logs?.length) {
    try {
      const events = parseEventLogs({
        abi: erc20Abi,
        eventName: "Transfer",
        logs: receipt.logs,
      });
      // Prefer a yUSD-recognized log (USDC in stub mode, vault token in vault
      // mode) over an arbitrary ERC-20 transfer.
      const balanceLog =
        events.find((e) => isBalanceToken(e.address)) || events[0];
      if (balanceLog) {
        const args = balanceLog.args;
        fromAddr = args.from.toLowerCase();
        toAddr = args.to.toLowerCase();
        const isYusd = isBalanceToken(balanceLog.address);
        const decimals = isYusd ? YUSD_DECIMALS : 18;
        amount = parseFloat(formatUnits(args.value, decimals));
        amountWei = args.value.toString();
        // Snapshot wins; live decode only fills the gap.
        tokenSymbol = snapshotSymbol ?? symbolForToken(balanceLog.address, "TOKEN");
      }
    } catch {
      // No decodable Transfer; fall back to plain ETH path below.
    }
  }

  if (amount === 0 && tx.value > 0n) {
    amount = parseFloat(formatUnits(tx.value, 18));
    amountWei = tx.value.toString();
    // Snapshot still wins even on the ETH-transfer fallback path. Defensive
    // — the precedence rule is "snapshot is authoritative for owned rows,"
    // not "snapshot is authoritative unless we hit this unusual branch."
    tokenSymbol = snapshotSymbol ?? "ETH";
  }

  const [fromParty, toParty] = await Promise.all([
    resolveParty(fromAddr),
    resolveParty(toAddr),
  ]);

  const status: TxStatus = !receipt
    ? "pending"
    : receipt.status === "success"
      ? "success"
      : "failed";

  return {
    hash,
    status,
    network: "Base",
    tokenSymbol,
    amount,
    amountWei,
    from: fromParty,
    to: toParty,
    timestamp,
    blockNumber: receipt ? Number(receipt.blockNumber) : null,
    isDemo: false,
  };
}

async function resolveParty(address: string): Promise<TxParty> {
  if (!address) {
    return { address: "", username: null, displayName: null, avatarUrl: null };
  }
  let user: Awaited<ReturnType<typeof getUserByWalletAddressPg>> = null;
  try {
    user = await getUserByWalletAddressPg(address);
  } catch {
    // DB unreachable — fall through to address-only display.
  }
  return {
    address: checksumOrRaw(address),
    username: user?.username ?? null,
    displayName: user?.display_name ?? null,
    avatarUrl: user?.avatar_url ?? null,
  };
}

function checksumOrRaw(addr: string): string {
  try {
    return getAddress(addr);
  } catch {
    return addr;
  }
}
