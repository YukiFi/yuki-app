/**
 * Wallet-based Authentication Helper
 * 
 * With Alchemy Smart Wallets, authentication is client-side.
 * This helper validates wallet addresses from API requests.
 */

import { NextRequest } from 'next/server';

/**
 * Extract and validate wallet address from request body
 */
export async function getWalletAddressFromRequest(
  request: NextRequest
): Promise<{ walletAddress: string | null; error?: string }> {
  try {
    const body = await request.json();
    const { walletAddress } = body as { walletAddress?: string };
    
    if (!walletAddress) {
      return { walletAddress: null, error: 'Wallet address is required' };
    }
    
    // Validate address format
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return { walletAddress: null, error: 'Invalid wallet address format' };
    }
    
    return { walletAddress: walletAddress.toLowerCase() };
  } catch {
    return { walletAddress: null, error: 'Invalid request body' };
  }
}

/**
 * Validate wallet address from query params or headers
 */
export function getWalletAddressFromHeaders(
  request: NextRequest
): { walletAddress: string | null; error?: string } {
  const walletAddress = request.headers.get('x-wallet-address');
  
  if (!walletAddress) {
    return { walletAddress: null, error: 'Wallet address header is required' };
  }
  
  // Validate address format
  if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return { walletAddress: null, error: 'Invalid wallet address format' };
  }
  
  return { walletAddress: walletAddress.toLowerCase() };
}

