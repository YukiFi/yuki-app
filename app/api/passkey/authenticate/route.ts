/**
 * POST /api/passkey/authenticate
 * 
 * Generate passkey authentication options for WebAuthn signin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getWalletByUserId } from '@/lib/db';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getSession } from '@/lib/session';

const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const wallet = await getWalletByUserId(user.id);
    if (!wallet || wallet.security_level !== 'passkey_enabled' || !wallet.passkey_meta) {
      return NextResponse.json(
        { error: 'Passkey not enabled for this account' },
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
    // Store challenge and user info in session for verification
    const session = await getSession();
    session.passkeyChallenge = options.challenge;
    session.passkeyUserId = user.id;
    await session.save();
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Passkey auth options error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
