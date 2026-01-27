/**
 * POST /api/auth/me
 * 
 * Get current user info based on wallet address.
 * With Alchemy Smart Wallets, the wallet address is the user identity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUserByWalletAddress } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    let walletAddress: string;
    
    try {
      const body = await request.json();
      walletAddress = body.walletAddress;
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    // Validate address format
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }
    
    // Normalize to lowercase
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Get or create user by wallet address
    const user = await getOrCreateUserByWalletAddress(normalizedAddress);
    
    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        bannerUrl: user.banner_url,
        bio: user.bio,
        isPrivate: user.is_private,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Keep GET for backwards compatibility, but it now requires wallet address in headers
export async function GET(request: NextRequest) {
  const walletAddress = request.headers.get('x-wallet-address');
  
  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
  
  // Create a mock request with the wallet address in the body
  const mockRequest = new Request(request.url, {
    method: 'POST',
    body: JSON.stringify({ walletAddress }),
    headers: { 'Content-Type': 'application/json' },
  });
  
  return POST(mockRequest as NextRequest);
}
