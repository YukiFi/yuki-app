/**
 * Wallet API Routes
 * 
 * With Alchemy Smart Wallets, wallet management is handled by Alchemy.
 * This route now only provides user-wallet association info.
 * 
 * GET /api/wallet - Get wallet info for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUserByWalletAddress } from '@/lib/db';

/**
 * GET /api/wallet
 * 
 * Returns wallet information for the authenticated user.
 * With Alchemy Smart Wallets, the wallet is managed by Alchemy.
 */
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');
    
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get or create user record for this wallet
    const user = await getOrCreateUserByWalletAddress(walletAddress.toLowerCase());
    
    return NextResponse.json({
      hasWallet: true,
      wallet: {
        address: walletAddress.toLowerCase(),
        userId: user.id,
        // Alchemy Smart Wallets are always on Base
        chainId: 8453,
      },
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wallet
 * 
 * With Alchemy Smart Wallets, wallet creation is handled by Alchemy.
 * This endpoint just associates a wallet address with a user.
 */
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
    
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      return NextResponse.json(
        { error: 'Valid wallet address is required' },
        { status: 400 }
      );
    }
    
    // Get or create user record for this wallet
    const user = await getOrCreateUserByWalletAddress(walletAddress.toLowerCase());
    
    return NextResponse.json({
      success: true,
      wallet: {
        address: walletAddress.toLowerCase(),
        userId: user.id,
        chainId: 8453, // Base
      },
    });
  } catch (error) {
    console.error('Create wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
