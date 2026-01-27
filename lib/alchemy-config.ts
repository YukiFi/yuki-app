/**
 * Alchemy Smart Wallets Configuration
 * 
 * This file configures the Alchemy Account Kit for Smart Wallets.
 * Supports email OTP and passkey authentication with sponsored gas.
 */

import { createConfig } from "@account-kit/react";
import { base } from "@account-kit/infra";
import { alchemy } from "@account-kit/infra";

// Alchemy Smart Wallets configuration
export const alchemyConfig = createConfig({
  // Transport configuration using Alchemy RPC
  transport: alchemy({ 
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY! 
  }),
  
  // Chain configuration - Base Mainnet
  chain: base,
  
  // Enable server-side rendering support for Next.js
  ssr: true,
  
  // Gas Manager policy for sponsored transactions
  // Users don't need ETH - we pay for gas
  policyId: process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID,
  
  // Signer configuration for authentication methods
  signerConnection: {
    // Alchemy Signer for email OTP and passkey
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!,
  },
  
  // Session configuration for persistent login
  sessionConfig: {
    // Session duration in seconds (7 days)
    expirationTimeMs: 7 * 24 * 60 * 60 * 1000,
  },
});

// Export chain info for use elsewhere
export { base as alchemyChain };

