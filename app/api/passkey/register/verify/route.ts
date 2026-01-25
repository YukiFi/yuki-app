/**
 * POST /api/passkey/register/verify
 * 
 * Verify passkey registration and store credential.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserByClerkId, getWalletByUserId, updateWalletPasskey, updateUserPasskey } from '@/lib/db';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';

const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Import challenge store from parent route
// Note: In production, use Redis or a shared store
const challengeStore = new Map<string, string>();

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
    
    // Get challenge from request body (since we can't share state between routes easily)
    const body = await request.json();
    const { credential, walletUpgradeData, expectedChallenge } = body as {
      credential: RegistrationResponseJSON;
      expectedChallenge: string;
      walletUpgradeData?: {
        cipherPriv: string;
        ivPriv: string;
        wrappedDekPassword: string;
        ivDekPassword: string;
        wrappedDekPasskey: string;
        ivDekPasskey: string;
      };
    };
    
    if (!expectedChallenge) {
      return NextResponse.json(
        { error: 'No registration challenge provided' },
        { status: 400 }
      );
    }
    
    // Verify the registration
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
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
    
    await updateUserPasskey(user.id, passkeyData);
    
    // If wallet upgrade data is provided, update the wallet too
    if (walletUpgradeData) {
      const wallet = await getWalletByUserId(user.id);
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
        
        await updateWalletPasskey(user.id, {
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
