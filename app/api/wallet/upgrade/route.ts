/**
 * POST /api/wallet/upgrade
 * 
 * Upgrade wallet to passkey-enabled mode.
 * Stores the re-encrypted wallet data with wrapped DEKs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getWalletByUserId, updateWalletPasskey, getOrCreateUserByClerkId } from '@/lib/db';
import type { EncryptedWalletData } from '@/lib/crypto';

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
    
    if (!wallet) {
      return NextResponse.json(
        { error: 'No wallet found' },
        { status: 404 }
      );
    }
    
    if (wallet.security_level === 'passkey_enabled') {
      return NextResponse.json(
        { error: 'Wallet already has passkey enabled' },
        { status: 409 }
      );
    }
    
    const body = await request.json();
    const { upgradedWallet, passkeyCredential } = body as {
      upgradedWallet: EncryptedWalletData;
      passkeyCredential: {
        credentialId: string;
        publicKey: string;
        counter: number;
        transports?: string[];
      };
    };
    
    // Validate required fields
    if (!upgradedWallet || !passkeyCredential) {
      return NextResponse.json(
        { error: 'Upgraded wallet data and passkey credential are required' },
        { status: 400 }
      );
    }
    
    const requiredFields = [
      'cipherPriv', 'ivPriv', 'wrappedDekPassword', 'ivDekPassword',
      'wrappedDekPasskey', 'ivDekPasskey'
    ];
    for (const field of requiredFields) {
      if (!upgradedWallet[field as keyof EncryptedWalletData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Update wallet with passkey data
    await updateWalletPasskey(user.id, {
      cipherPriv: upgradedWallet.cipherPriv,
      ivPriv: upgradedWallet.ivPriv,
      securityLevel: 'passkey_enabled',
      passkeyMeta: passkeyCredential,
      wrappedDekPassword: upgradedWallet.wrappedDekPassword!,
      ivDekPassword: upgradedWallet.ivDekPassword!,
      wrappedDekPasskey: upgradedWallet.wrappedDekPasskey!,
      ivDekPasskey: upgradedWallet.ivDekPasskey!,
    });
    
    return NextResponse.json({
      success: true,
      securityLevel: 'passkey_enabled',
    });
  } catch (error) {
    console.error('Upgrade wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
