import { createConfig, http } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { createWalletClient, createPublicClient, http as viemHttp } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Wagmi config for reading chain state
export const config = createConfig({
  chains: [base, mainnet],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org'),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ETH_RPC_URL || 'https://eth.llamarpc.com'),
  },
  ssr: true,
});

// Create a public client for reading chain state
export function createPublicViemClient(chainId: number = base.id) {
  const chain = chainId === mainnet.id ? mainnet : base;
  const rpcUrl = chainId === mainnet.id 
    ? (process.env.NEXT_PUBLIC_ETH_RPC_URL || 'https://eth.llamarpc.com')
    : (process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org');
    
  return createPublicClient({
    chain,
    transport: viemHttp(rpcUrl),
  });
}

// Create a wallet client for sending transactions with embedded wallet
export function createEmbeddedWalletClient(privateKey: `0x${string}`, chainId: number = base.id) {
  const account = privateKeyToAccount(privateKey);
  const chain = chainId === mainnet.id ? mainnet : base;
  const rpcUrl = chainId === mainnet.id 
    ? (process.env.NEXT_PUBLIC_ETH_RPC_URL || 'https://eth.llamarpc.com')
    : (process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org');
    
  return createWalletClient({
    account,
    chain,
    transport: viemHttp(rpcUrl),
  });
}

// Export chain info
export { base, mainnet };
