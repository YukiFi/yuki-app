/**
 * POST /api/passkey/authenticate
 * 
 * Generate passkey authentication options for WebAuthn wallet unlock.
 * Used for unlocking the wallet with passkey instead of password.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserByClerkId, getWalletByUserId } from '@/lib/db';
import { generateAuthenticationOptions } from '@simplewebauthn/server';

const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';

// Store challenges temporarily (in production, use Redis)
export const authChallengeStore = new Map<string, string>();

export async function POST() {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const user = await getOrCreateUserByClerkId(clerkUserId);
    const wallet = await getWalletByUserId(user.id);
    
    if (!wallet || wallet.security_level !== 'passkey_enabled' || !wallet.passkey_meta) {
      return NextResponse.json(
        { error: 'Passkey not enabled for this wallet' },
        { status: 400 }
      );
    }
    
    const passkeyMeta = JSON.parse(wallet.passkey_meta);
    
    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID,
      timeout: 60000,
      userVerification: 'preferred',
      allowCredentials: [{
        id: passkeyMeta.credentialId,
        transports: passkeyMeta.transports || [],
      }],
    });
    
    // Store challenge for verification
    authChallengeStore.set(user.id, options.challenge);
    
    // Clean up after 5 minutes
    setTimeout(() => {
      authChallengeStore.delete(user.id);
    }, 5 * 60 * 1000);
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Passkey auth options error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
