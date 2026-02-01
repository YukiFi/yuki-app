/**
 * POST /api/auth/onboarding-status
 * 
 * Check if the user has completed onboarding (has a username).
 * Uses wallet address as the user identifier.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUserByWalletAddress, getUserByWalletAddress } from '@/lib/db';

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
        { status: 401 }
      );
    }

    // Validate address format
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Get user by wallet address (no auto-creation)
    const user = await getUserByWalletAddress(walletAddress.toLowerCase());

    if (!user) {
      return NextResponse.json({
        completed: false,
        username: null,
        steps: {
          username: false,
        },
      });
    }

    console.log('[Onboarding] Checking user:', {
      walletAddress: walletAddress.toLowerCase(),
      username: user.username,
      hasUsername: !!user.username && user.username.length > 0,
    });

    // Check if user has completed onboarding
    const hasUsername = !!user.username && user.username.length > 0;

    return NextResponse.json({
      completed: hasUsername,
      username: user.username,
      steps: {
        username: hasUsername,
      },
    });
  } catch (error) {
    console.error('Onboarding status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Keep GET for backwards compatibility
export async function GET(request: NextRequest) {
  const walletAddress = request.headers.get('x-wallet-address');

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const mockRequest = new Request(request.url, {
    method: 'POST',
    body: JSON.stringify({ walletAddress }),
    headers: { 'Content-Type': 'application/json' },
  });

  return POST(mockRequest as NextRequest);
}
