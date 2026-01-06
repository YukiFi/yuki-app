/**
 * POST /api/passkey/register/verify
 * 
 * Verify passkey registration and store credential.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserById, getWalletByUserId, updateWalletPasskey, updateUserPasskey } from '@/lib/db';
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
    
    // Store passkey credential on user
    const passkeyData = {
      credentialId: Buffer.from(verifiedCredential.id).toString('base64url'),
      publicKey: Buffer.from(verifiedCredential.publicKey).toString('base64'),
      counter: verifiedCredential.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: credential.response.transports || [],
    };
    
    await updateUserPasskey(session.userId, passkeyData);
    
    // If wallet upgrade data is provided, update the wallet too
    if (walletUpgradeData) {
      const wallet = await getWalletByUserId(session.userId);
      if (wallet) {
        const passkeyMeta = {
          credentialId: passkeyData.credentialId,
          publicKey: passkeyData.publicKey,
          counter: passkeyData.counter,
          deviceType: passkeyData.deviceType,
          backedUp: passkeyData.backedUp,
          transports: passkeyData.transports,
          createdAt: new Date().toISOString(),
        };
        
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
    delete session.passkeyUserId;
    await session.save();
    
    return NextResponse.json({
      success: true,
      verified: true,
      credentialId: passkeyData.credentialId,
    });
  } catch (error) {
    console.error('Passkey verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
