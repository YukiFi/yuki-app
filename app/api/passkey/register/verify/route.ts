/**
 * POST /api/passkey/register/verify
 * 
 * Verify passkey registration and store credential.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserById, getWalletByUserId, updateWalletPasskey } from '@/lib/db';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';

const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const challenge = session.passkeyChallenge;
    if (!challenge) {
      return NextResponse.json(
        { error: 'No registration challenge found' },
        { status: 400 }
      );
    }
    
    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const { credential, walletUpgradeData } = body as {
      credential: RegistrationResponseJSON;
      walletUpgradeData?: {
        cipherPriv: string;
        ivPriv: string;
        wrappedDekPassword: string;
        ivDekPassword: string;
        wrappedDekPasskey: string;
        ivDekPasskey: string;
      };
    };
    
    // Verify the registration
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
    
    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      );
    }
    
    const { credential: verifiedCredential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    
    // Store passkey credential metadata
    const passkeyMeta = {
      credentialId: Buffer.from(verifiedCredential.id).toString('base64url'),
      publicKey: Buffer.from(verifiedCredential.publicKey).toString('base64'),
      counter: verifiedCredential.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: credential.response.transports || [],
      createdAt: new Date().toISOString(),
    };
    
    // If wallet upgrade data is provided, update the wallet
    if (walletUpgradeData) {
      const wallet = await getWalletByUserId(session.userId);
      if (wallet) {
        await updateWalletPasskey(session.userId, {
          cipherPriv: walletUpgradeData.cipherPriv,
          ivPriv: walletUpgradeData.ivPriv,
          securityLevel: 'passkey_enabled',
          passkeyMeta,
          wrappedDekPassword: walletUpgradeData.wrappedDekPassword,
          ivDekPassword: walletUpgradeData.ivDekPassword,
          wrappedDekPasskey: walletUpgradeData.wrappedDekPasskey,
          ivDekPasskey: walletUpgradeData.ivDekPasskey,
        });
      }
    }
    
    // Clear challenge from session
    delete session.passkeyChallenge;
    await session.save();
    
    return NextResponse.json({
      success: true,
      verified: true,
      credentialId: passkeyMeta.credentialId,
    });
  } catch (error) {
    console.error('Passkey verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
