/**
 * POST /api/passkey/register
 * 
 * Generate passkey registration options for WebAuthn.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserById, getWalletByUserId } from '@/lib/db';
import { generateRegistrationOptions } from '@simplewebauthn/server';

const rpName = 'Yuki';
const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';

export async function POST() {
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
    
    // Check if user already has passkey enabled
    const wallet = await getWalletByUserId(session.userId);
    if (wallet?.security_level === 'passkey_enabled') {
      return NextResponse.json(
        { error: 'Passkey already enabled' },
        { status: 409 }
      );
    }
    
    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(user.id),
      userName: user.email,
      userDisplayName: user.email.split('@')[0],
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
      timeout: 60000,
    });
    
    // Store challenge in session for verification
    session.passkeyChallenge = options.challenge;
    await session.save();
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Passkey register options error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
