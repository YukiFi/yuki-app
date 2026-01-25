/**
 * POST /api/passkey/authenticate/verify
 * 
 * Verify passkey authentication for wallet unlock.
 * Returns success if passkey is valid, allowing client to derive DEK.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserByClerkId, getWalletByUserId, updatePasskeyCounter } from '@/lib/db';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/types';

const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
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
    
    if (!wallet || !wallet.passkey_meta) {
      return NextResponse.json(
        { error: 'Passkey not found' },
        { status: 400 }
      );
    }
    
    const passkeyMeta = JSON.parse(wallet.passkey_meta);
    
    const body = await request.json();
    const { credential, expectedChallenge } = body as {
      credential: AuthenticationResponseJSON;
      expectedChallenge: string;
    };
    
    if (!expectedChallenge) {
      return NextResponse.json(
        { error: 'No authentication challenge provided' },
        { status: 400 }
      );
    }
    
    // Verify the authentication
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkeyMeta.credentialId,
        publicKey: new Uint8Array(Buffer.from(passkeyMeta.publicKey, 'base64')),
        counter: passkeyMeta.counter || 0,
        transports: passkeyMeta.transports || [],
      },
    });
    
    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      );
    }
    
    // Update counter to prevent replay attacks
    if (verification.authenticationInfo) {
      await updatePasskeyCounter(user.id, verification.authenticationInfo.newCounter);
    }
    
    return NextResponse.json({
      success: true,
      verified: true,
      // Return wallet data needed for client-side decryption
      wallet: {
        address: wallet.address,
        securityLevel: wallet.security_level,
        wrappedDekPasskey: wallet.wrapped_dek_passkey,
        ivDekPasskey: wallet.iv_dek_passkey,
        cipherPriv: wallet.cipher_priv,
        ivPriv: wallet.iv_priv,
      },
    });
  } catch (error) {
    console.error('Passkey auth verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
