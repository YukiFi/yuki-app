/**
 * GET /api/auth/me
 * 
 * Get current authenticated user info from session.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserById, getWalletByUserId } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    
    console.log('GET /api/auth/me - Session check:', {
      isLoggedIn: session.isLoggedIn,
      userId: session.userId,
      email: session.email
    });
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const user = await getUserById(session.userId);
    if (!user) {
      console.log('⚠️  WARNING: Session exists but user not in database!');
      console.log('   This happens when the server restarts (in-memory DB clears but cookie persists)');
      console.log('   Destroying stale session...');
      // User no longer exists (likely DB reset), destroy invalid session
      session.destroy();
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }
    
    console.log('✅ User authenticated successfully:', user.email);
    
    const wallet = await getWalletByUserId(user.id);
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        hasWallet: !!wallet,
        walletAddress: wallet?.address,
        securityLevel: wallet?.security_level,
        passkey_credential_id: user.passkey_credential_id,
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
