import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, base, arbitrum, optimism, polygon } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Yuki Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [mainnet, base, arbitrum, optimism, polygon],
  ssr: true,
});

