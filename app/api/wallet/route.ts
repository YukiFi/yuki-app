/**
 * Wallet API Routes
 * 
 * GET /api/wallet - Get encrypted wallet data for the current user
 * POST /api/wallet - Create a new wallet (store encrypted data)
 * 
 * IMPORTANT: This endpoint only handles encrypted data.
 * The server NEVER sees plaintext private keys.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getWalletByUserId, createWallet, getUserById } from '@/lib/db';
import { generateId } from '@/lib/auth';
import type { EncryptedWalletData } from '@/lib/crypto';

/**
 * GET /api/wallet
 * 
 * Returns the encrypted wallet data for the current user.
 * This data must be decrypted client-side with the user's password.
 */
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const wallet = await getWalletByUserId(session.userId);
    
    if (!wallet) {
      return NextResponse.json(
        { error: 'No wallet found', hasWallet: false },
        { status: 404 }
      );
    }
    
    // Parse JSON fields
    const kdfParams = JSON.parse(wallet.kdf_params);
    const passkeyMeta = wallet.passkey_meta ? JSON.parse(wallet.passkey_meta) : null;
    
    // Return encrypted wallet data
    const encryptedData: EncryptedWalletData = {
      address: wallet.address,
      chainId: wallet.chain_id,
      version: wallet.version,
      cipherPriv: wallet.cipher_priv,
      ivPriv: wallet.iv_priv,
      kdfSalt: wallet.kdf_salt,
      kdfParams,
      securityLevel: wallet.security_level,
      passkeyMeta,
      wrappedDekPassword: wallet.wrapped_dek_password,
      ivDekPassword: wallet.iv_dek_password,
      wrappedDekPasskey: wallet.wrapped_dek_passkey,
      ivDekPasskey: wallet.iv_dek_passkey,
    };
    
    return NextResponse.json({
      hasWallet: true,
      wallet: encryptedData,
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wallet
 * 
 * Store encrypted wallet data from client-side wallet creation.
 * The client generates the key, encrypts it, and sends ONLY the ciphertext.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user already has a wallet
    const existingWallet = await getWalletByUserId(session.userId);
    if (existingWallet) {
      return NextResponse.json(
        { error: 'Wallet already exists' },
        { status: 409 }
      );
    }
    
    const body = await request.json();
    const { encryptedWallet } = body as { encryptedWallet: EncryptedWalletData };
    
    // Validate required fields
    if (!encryptedWallet) {
      return NextResponse.json(
        { error: 'Encrypted wallet data is required' },
        { status: 400 }
      );
    }
    
    const requiredFields = ['address', 'chainId', 'cipherPriv', 'ivPriv', 'kdfSalt', 'kdfParams'];
    for (const field of requiredFields) {
      if (!(field in encryptedWallet)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate address format
    if (!encryptedWallet.address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }
    
    // Only allow mainnet (chainId 1)
    if (encryptedWallet.chainId !== 1) {
      return NextResponse.json(
        { error: 'Only mainnet (chainId 1) is supported' },
        { status: 400 }
      );
    }
    
    // Create wallet record
    const walletId = generateId();
    const newWallet = await createWallet(walletId, session.userId, {
      address: encryptedWallet.address,
      chainId: encryptedWallet.chainId,
      version: encryptedWallet.version || 1,
      cipherPriv: encryptedWallet.cipherPriv,
      ivPriv: encryptedWallet.ivPriv,
      kdfSalt: encryptedWallet.kdfSalt,
      kdfParams: encryptedWallet.kdfParams,
      securityLevel: 'password_only',
    });
    
    if (!newWallet) {
      return NextResponse.json(
        { error: 'Failed to create wallet' },
        { status: 500 }
      );
    }
    
    // Update session with wallet address
    const user = await getUserById(session.userId);
    if (user) {
      session.walletAddress = encryptedWallet.address;
      await session.save();
    }
    
    return NextResponse.json({
      success: true,
      wallet: {
        address: newWallet.address,
        chainId: newWallet.chain_id,
        securityLevel: newWallet.security_level,
      },
    });
  } catch (error) {
    console.error('Create wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
