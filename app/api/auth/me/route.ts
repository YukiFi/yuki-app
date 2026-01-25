/**
 * GET /api/auth/me
 * 
 * Get current authenticated user info from Clerk session.
 */

import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getOrCreateUserByClerkId, getWalletByUserId } from '@/lib/db';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get Clerk user details
    const clerkUser = await currentUser();
    
    // Get or create our internal user
    const user = await getOrCreateUserByClerkId(clerkUserId);
    const wallet = await getWalletByUserId(user.id);
    
    return NextResponse.json({
      user: {
        id: user.id,
        clerkId: clerkUserId,
        email: clerkUser?.primaryEmailAddress?.emailAddress || user.email,
        phone: clerkUser?.primaryPhoneNumber?.phoneNumber || user.phone_number,
        firstName: clerkUser?.firstName,
        lastName: clerkUser?.lastName,
        imageUrl: clerkUser?.imageUrl,
        username: user.username,
        hasWallet: !!wallet,
        walletAddress: wallet?.address,
        securityLevel: wallet?.security_level,
        hasPasskey: !!user.passkey_credential_id,
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
