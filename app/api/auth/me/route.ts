/**
 * GET /api/auth/me
 * 
 * Get current authenticated user info.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserById, getWalletByUserId } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const wallet = await getWalletByUserId(user.id);
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        hasWallet: !!wallet,
        walletAddress: wallet?.address,
        securityLevel: wallet?.security_level,
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
