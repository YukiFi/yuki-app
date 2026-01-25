/**
 * POST /api/passkey/register
 * 
 * Generate passkey registration options for WebAuthn.
 */

import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getOrCreateUserByClerkId } from '@/lib/db';
import { generateRegistrationOptions } from '@simplewebauthn/server';

const rpName = 'Yuki';
const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';

// Store challenges temporarily (in production, use Redis or similar)
const challengeStore = new Map<string, string>();

export async function POST() {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in first.' },
        { status: 401 }
      );
    }
    
    const clerkUser = await currentUser();
    const user = await getOrCreateUserByClerkId(clerkUserId);
    
    // Check if user already has passkey enabled
    if (user.passkey_credential_id) {
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
      userName: clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.primaryPhoneNumber?.phoneNumber || user.id,
      userDisplayName: user.username || clerkUser?.firstName || 'Yuki User',
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
      timeout: 60000,
    });
    
    // Store challenge for verification
    challengeStore.set(user.id, options.challenge);
    
    // Clean up old challenges after 5 minutes
    setTimeout(() => {
      challengeStore.delete(user.id);
    }, 5 * 60 * 1000);
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Passkey register options error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export for use in verify route
export { challengeStore };
