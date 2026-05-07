/**
 * Supported chains for inbound deposits.
 *
 * Phase 2a launches Base-only. Architected so adding a chain later (mainnet,
 * Arbitrum, Optimism) is a one-entry append — every consumer reads from
 * `SUPPORTED_CHAINS` rather than hardcoding "Base".
 *
 * The Alchemy smart wallet address is the same across EVM chains
 * (counterfactual deployment), but only Base has the deployed account
 * contract right now. USDC sent on other chains is reachable only when the
 * wallet is deployed there too — which is a future, not a launch concern.
 *
 * Each entry's `usdc` is the canonical USDC token on that chain. The arrival
 * pipeline only auto-deposits transfers from these contract addresses on
 * their respective chains; random ERC-20s arriving at the wallet stay
 * inert (prevents dust-attack noise).
 */

export interface SupportedChain {
  /** Stable string id used in URL params and Coinbase widget. */
  id: "base";
  /** Display name. */
  name: string;
  /** EVM chain id (per EIP-155). */
  chainId: number;
  /** Canonical USDC contract on this chain. */
  usdc: `0x${string}`;
  /** Whether the chain is live for deposits. Future chains can land here as `false` first. */
  isActive: boolean;
}

export const SUPPORTED_CHAINS: readonly SupportedChain[] = Object.freeze([
  {
    id: "base",
    name: "Base",
    chainId: 8453,
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    isActive: true,
  },
]) as readonly SupportedChain[];

/** The default chain shown to the user in the deposit-crypto card. */
export const DEFAULT_CHAIN_ID: SupportedChain["id"] = "base";

export function getChainById(
  id: SupportedChain["id"],
): SupportedChain | undefined {
  return SUPPORTED_CHAINS.find((c) => c.id === id);
}
