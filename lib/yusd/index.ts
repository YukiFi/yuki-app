/**
 * yUSD Interface — the spine.
 *
 * Every UI/business-logic call that wants the user's "balance" or to "send/
 * deposit/withdraw money" routes through this module. Today (STUB_MODE) it
 * wraps USDC 1:1: balance is the USDC balance, conversions are identity,
 * deposit is a no-op, withdraw/transfer are USDC ERC-20 transfers.
 *
 * Tomorrow, when NEXT_PUBLIC_YUSD_VAULT is set to a real ERC-4626 vault
 * address, this is the only file that needs to learn about the vault. Every
 * caller stays unchanged.
 *
 * Design rules (from the architecture plan):
 *   - Share-based, not rebasing. Balances stable; yield is a separate line.
 *   - Auto-swap on arrival, no USDC float.
 *   - Live transitions are driven by UserOp receipts, not the indexer.
 *   - Idempotency keyed by onramp tx hash (handled at the deposits-table
 *     layer, not here).
 */

import {
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  parseUnits,
} from "viem";
import {
  USDC_ADDRESS,
  USDC_DECIMALS,
  YUSD_ADDRESS,
  getUSDCBalance,
  isYUSDConfigured,
} from "@/lib/transactions/sendYUSD";

// ────────────────────────────────────────────────────────────────────────────
// Mode flag + constants
// ────────────────────────────────────────────────────────────────────────────

/**
 * The optional vault address. When unset (the default today), we run in
 * STUB_MODE — yUSD is a label over USDC and the deposit/withdraw flows are
 * no-ops. When set, we route through the 4626 interface.
 *
 * We accept either NEXT_PUBLIC_YUSD_VAULT (the new convention from the
 * architecture plan) or NEXT_PUBLIC_YUSD_ADDRESS (the historical name kept
 * around so existing deploys keep working). The address is read once at
 * module-load time.
 */
const VAULT_ADDRESS_RAW = (
  process.env.NEXT_PUBLIC_YUSD_VAULT ||
  process.env.NEXT_PUBLIC_YUSD_ADDRESS ||
  ""
).toLowerCase();

export const YUSD_VAULT_ADDRESS =
  VAULT_ADDRESS_RAW &&
  VAULT_ADDRESS_RAW !== "0x0000000000000000000000000000000000000000"
    ? (VAULT_ADDRESS_RAW as `0x${string}`)
    : ("" as const);

/** True when no real vault is wired — the entire app runs against USDC. */
export const STUB_MODE = !YUSD_VAULT_ADDRESS;

/**
 * yUSD reports balances in USDC units while we're stubbed (so the conversion
 * functions are identity). When a real vault lands, this gets read from the
 * vault contract's `decimals()`.
 */
export const YUSD_DECIMALS = USDC_DECIMALS;

/** The user-visible asset symbol shown on receipts and tx detail pages. */
export const YUSD_SYMBOL = "yUSD";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export type VaultStatus = "active" | "paused" | "capped" | "unknown";

export type UserOpCall = {
  target: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
};

export type Balance = {
  /** Human-readable USD-denominated balance, e.g. "1234.56". */
  assets: string;
  /** Human-readable share count. In stub mode equals `assets`. */
  shares: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Read API
// ────────────────────────────────────────────────────────────────────────────

/** Fetch the user's yUSD balance. In stub mode this is their USDC balance. */
export async function getBalance(user: `0x${string}`): Promise<Balance> {
  if (STUB_MODE) {
    const usdc = await getUSDCBalance(user);
    return { assets: usdc, shares: usdc };
  }
  // Vault-mode: TODO when the real vault contract lands. Read shares via
  // balanceOf(vault, user), then convertToAssets to denominate in USD.
  return { assets: "0", shares: "0" };
}

/**
 * Yield earned vs the user's deposit cost basis. The cost basis comes from
 * the deposits table (sum of confirmed deposits), passed in by the caller —
 * we don't reach into the DB from this module.
 *
 * In stub mode this always returns "0.00" (USDC doesn't accrue yield), and
 * that's the truthful answer. The line should be visible in the UI so users
 * see it tick up the moment the real vault lights up.
 */
export async function getEarned(
  user: `0x${string}`,
  costBasisAssets: string,
): Promise<string> {
  const { assets } = await getBalance(user);
  const earned = parseFloat(assets) - parseFloat(costBasisAssets);
  return earned > 0 ? earned.toFixed(2) : "0.00";
}

/** Identity in stub mode; reads from vault.convertToAssets() in vault mode. */
export function convertToAssets(shares: bigint): bigint {
  if (STUB_MODE) return shares;
  // Vault-mode: TODO.
  return shares;
}

/** Identity in stub mode; reads from vault.convertToShares() in vault mode. */
export function convertToShares(assets: bigint): bigint {
  if (STUB_MODE) return assets;
  // Vault-mode: TODO.
  return assets;
}

/**
 * Vault availability check. The auto-deposit pipeline reads this to decide
 * whether to fire the deposit UserOp or transition to the retry state.
 * In stub mode the vault is always "active" — there's nothing to be down.
 */
export async function vaultStatus(): Promise<VaultStatus> {
  if (STUB_MODE) return "active";
  // Vault-mode: TODO. Read paused() + totalAssets() vs cap().
  return "unknown";
}

// ────────────────────────────────────────────────────────────────────────────
// Write API — returns UserOp call objects, not transactions.
// Callers pass these to `useSendUserOperation`'s sendUserOperationAsync.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build the deposit batch. Caller wraps in `sendUserOperationAsync({ uo })`.
 *
 * In STUB_MODE this returns an empty array — there's nothing to deposit
 * because the wallet already holds USDC and we treat USDC == yUSD. The
 * caller should detect the empty batch and short-circuit straight to the
 * "Earning" success state without sending a UserOp at all.
 *
 * In vault mode this returns `[approve(vault, amount), vault.deposit(...)]`.
 */
export function buildDeposit(assets: string): { uo: UserOpCall[] } {
  if (STUB_MODE) return { uo: [] };
  // Vault-mode: TODO.
  // const value = parseUnits(assets, USDC_DECIMALS);
  // return { uo: [approve(USDC_ADDRESS, YUSD_VAULT_ADDRESS, value), depositCall(...)] };
  return { uo: [] };
}

/**
 * Build the withdraw batch. The receiver is who gets the USDC at the end —
 * for off-ramp withdrawals it's the user's own wallet (so the next UserOp
 * can transfer USDC to Coinbase's deposit address); for direct on-chain
 * withdrawals to an external address it's that address.
 *
 * In STUB_MODE this is just a USDC ERC-20 transfer to the receiver, since
 * there's no vault to redeem from.
 */
export function buildWithdraw(
  assets: string,
  receiver: `0x${string}`,
): { uo: UserOpCall[] } {
  if (STUB_MODE) {
    return {
      uo: [
        {
          target: USDC_ADDRESS,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "transfer",
            args: [receiver, parseUnits(assets, USDC_DECIMALS)],
          }),
          value: 0n,
        },
      ],
    };
  }
  // Vault-mode: TODO. vault.withdraw(assets, receiver, owner).
  return { uo: [] };
}

/**
 * Build a P2P transfer call. In stub mode this transfers USDC; in vault
 * mode it transfers yUSD shares (which are themselves an ERC-20 from the
 * recipient's POV). Either way, callers don't need to know the difference.
 */
export function buildTransfer(
  to: `0x${string}`,
  assets: string,
): UserOpCall {
  const token = STUB_MODE ? USDC_ADDRESS : (YUSD_VAULT_ADDRESS as `0x${string}`);
  const decimals = STUB_MODE ? USDC_DECIMALS : YUSD_DECIMALS;
  return {
    target: token,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [to, parseUnits(assets, decimals)],
    }),
    value: 0n,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers — token recognition for the indexer / activity feed
// ────────────────────────────────────────────────────────────────────────────

/**
 * The canonical set of token contracts the app considers "balance" — tokens
 * whose inbound transfers trigger the auto-deposit pipeline and whose ERC-20
 * transfers surface as yUSD in the UI.
 *
 * **Contract for Phase 2 wiring:** the indexer subscribes to this list
 * directly (one viem `watchContractEvent` per address), it does NOT filter
 * a global Transfer-event stream through `isBalanceToken`. Reasons:
 *
 *   1. **RPC efficiency.** Subscribing per-address tells the node "send me
 *      logs for these specific contracts" — not "send me everything and I'll
 *      throw most of it away." We don't get woken up by dust airdrops, NFT
 *      mints, or scam-token spam.
 *   2. **Single source of truth.** Both the subscriber (indexer) and the
 *      decoders (getTransaction, useTransactionHistory) flow from this
 *      constant. The predicate `isBalanceToken` is derived; it can't drift.
 *   3. **Deploy-time set.** `NEXT_PUBLIC_YUSD_VAULT` is build-inlined; there's
 *      no runtime add/remove. A frozen array is the honest shape.
 *
 * Captured at module load. Add a token here only if you also want the
 * arrival pipeline to auto-deposit it.
 */
export const WATCHED_TOKENS: readonly `0x${string}`[] = Object.freeze(
  YUSD_VAULT_ADDRESS
    ? ([USDC_ADDRESS, YUSD_VAULT_ADDRESS] as const)
    : ([USDC_ADDRESS] as const),
) as readonly `0x${string}`[];

/**
 * Predicate over `WATCHED_TOKENS`. Use this in *decoders* (getTransaction,
 * useTransactionHistory) where the log address is whatever the chain handed
 * us and you need to ask "is this one of ours?".
 *
 * **Do not use in the indexer.** The indexer should iterate `WATCHED_TOKENS`
 * and subscribe per-address — see the doc on `WATCHED_TOKENS` above.
 */
export function isBalanceToken(addr: string): boolean {
  const lower = addr.toLowerCase();
  return WATCHED_TOKENS.some((t) => t.toLowerCase() === lower);
}

/**
 * Map a token contract address to a user-facing symbol. Anything in our
 * whitelist surfaces as "yUSD"; unknown tokens keep whatever label the
 * indexer found. We never expose USDC vs yUSD distinction to end users in
 * stub mode — the abstraction is the whole point.
 */
export function symbolForToken(addr: string, fallback?: string): string {
  return isBalanceToken(addr) ? YUSD_SYMBOL : fallback || "TOKEN";
}

/** Format a yUSD amount for display, mirroring the existing formatBalance shape. */
export function formatAssets(assets: string, decimals = 2): string {
  const num = parseFloat(assets);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Re-exports for backwards-compat callsites that haven't been migrated yet.
// New code should import these names from this module, not from sendYUSD.ts.
// ────────────────────────────────────────────────────────────────────────────

export { USDC_DECIMALS };
// Suppress unused warnings for the values reserved for future vault wiring.
void formatUnits;
void YUSD_ADDRESS;
void isYUSDConfigured;
