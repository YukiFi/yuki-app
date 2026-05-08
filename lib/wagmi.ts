import { createConfig, http } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { createWalletClient, createPublicClient, http as viemHttp } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// RPC URL resolution. Checks the Alchemy-specific var first (which is what
// .env.local actually carries), then a generic fallback, then the public
// Base RPC as last resort. The public RPC heavily rate-limits — getting
// here means env config is missing and the app will 429 under any load.
function baseRpcUrl(): string {
  return (
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    'https://mainnet.base.org'
  );
}
function ethRpcUrl(): string {
  return (
    process.env.NEXT_PUBLIC_ALCHEMY_ETH_RPC_URL ||
    process.env.NEXT_PUBLIC_ETH_RPC_URL ||
    'https://eth.llamarpc.com'
  );
}

// Wagmi config for reading chain state
export const config = createConfig({
  chains: [base, mainnet],
  transports: {
    [base.id]: http(baseRpcUrl()),
    [mainnet.id]: http(ethRpcUrl()),
  },
  ssr: true,
});

// Create a public client for reading chain state
export function createPublicViemClient(chainId: number = base.id) {
  const chain = chainId === mainnet.id ? mainnet : base;
  const rpcUrl = chainId === mainnet.id ? ethRpcUrl() : baseRpcUrl();

  return createPublicClient({
    chain,
    transport: viemHttp(rpcUrl),
  });
}

// Create a wallet client for sending transactions with embedded wallet
export function createEmbeddedWalletClient(privateKey: `0x${string}`, chainId: number = base.id) {
  const account = privateKeyToAccount(privateKey);
  const chain = chainId === mainnet.id ? mainnet : base;
  const rpcUrl = chainId === mainnet.id ? ethRpcUrl() : baseRpcUrl();

  return createWalletClient({
    account,
    chain,
    transport: viemHttp(rpcUrl),
  });
}

// Export chain info
export { base, mainnet };
