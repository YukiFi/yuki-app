/**
 * POST /api/passkey/authenticate/verify
 * 
 * Verify passkey authentication and create session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, createUserSession } from '@/lib/session';
import { getUserById, getWalletByUserId } from '@/lib/db';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/types';

const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    const challenge = session.passkeyChallenge;
    const userId = session.passkeyUserId;
    
    if (!challenge || !userId) {
      return NextResponse.json(
        { error: 'No authentication challenge found' },
        { status: 400 }
      );
    }
    
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const wallet = await getWalletByUserId(userId);
    if (!wallet || !wallet.passkey_meta) {
      return NextResponse.json(
        { error: 'Passkey not found' },
        { status: 400 }
      );
    }
    
    const passkeyMeta = JSON.parse(wallet.passkey_meta);
    
    const body = await request.json();
    const credential = body as AuthenticationResponseJSON;
    
    // Verify the authentication
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
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
    
    // Clear passkey challenge
    delete session.passkeyChallenge;
    delete session.passkeyUserId;
    await session.save();
    
    // Create user session
    await createUserSession(user.id, user.email, wallet.address);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        hasWallet: true,
        walletAddress: wallet.address,
        securityLevel: wallet.security_level,
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
