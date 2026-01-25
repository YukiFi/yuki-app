/**
 * Coinbase Onramp API Route
 * 
 * Generates Coinbase Onramp URLs for fiat-to-crypto deposits.
 * Users complete KYC and purchase with Coinbase, funds go to their wallet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserByClerkId, getWalletByUserId } from '@/lib/db';

// Coinbase Onramp configuration
const COINBASE_APP_ID = process.env.COINBASE_APP_ID || '';
const COINBASE_ONRAMP_URL = 'https://pay.coinbase.com/buy/select-asset';

interface OnrampParams {
  // Coinbase App ID
  appId: string;
  // Destination wallet address
  destinationWallets: Array<{
    address: string;
    blockchains?: string[];
    assets?: string[];
  }>;
  // Default asset to purchase
  defaultAsset?: string;
  // Default network
  defaultNetwork?: string;
  // Pre-filled purchase amount
  presetFiatAmount?: number;
  // Fiat currency
  fiatCurrency?: string;
}

/**
 * Build Coinbase Onramp URL
 */
function buildOnrampUrl(params: OnrampParams): string {
  const url = new URL(COINBASE_ONRAMP_URL);
  
  // Add app ID
  url.searchParams.set('appId', params.appId);
  
  // Add destination wallets as JSON
  url.searchParams.set('destinationWallets', JSON.stringify(params.destinationWallets));
  
  // Add optional parameters
  if (params.defaultAsset) {
    url.searchParams.set('defaultAsset', params.defaultAsset);
  }
  if (params.defaultNetwork) {
    url.searchParams.set('defaultNetwork', params.defaultNetwork);
  }
  if (params.presetFiatAmount) {
    url.searchParams.set('presetFiatAmount', params.presetFiatAmount.toString());
  }
  if (params.fiatCurrency) {
    url.searchParams.set('fiatCurrency', params.fiatCurrency);
  }
  
  return url.toString();
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get user and wallet
    const user = await getOrCreateUserByClerkId(clerkUserId);
    const wallet = await getWalletByUserId(user.id);
    
    if (!wallet) {
      return NextResponse.json(
        { error: 'No wallet found. Please create a wallet first.' },
        { status: 400 }
      );
    }
    
    // Parse request body for optional parameters
    const body = await request.json().catch(() => ({}));
    const { amount, asset = 'USDC', network = 'base' } = body as {
      amount?: number;
      asset?: string;
      network?: string;
    };
    
    // Validate Coinbase App ID
    if (!COINBASE_APP_ID) {
      return NextResponse.json(
        { error: 'Coinbase integration not configured' },
        { status: 500 }
      );
    }
    
    // Build the onramp URL
    const onrampUrl = buildOnrampUrl({
      appId: COINBASE_APP_ID,
      destinationWallets: [{
        address: wallet.address,
        blockchains: [network],
        assets: [asset],
      }],
      defaultAsset: asset,
      defaultNetwork: network,
      presetFiatAmount: amount,
      fiatCurrency: 'USD',
    });
    
    return NextResponse.json({
      success: true,
      onrampUrl,
      walletAddress: wallet.address,
    });
  } catch (error) {
    console.error('Coinbase onramp error:', error);
    return NextResponse.json(
      { error: 'Failed to generate onramp URL' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if Coinbase integration is available
 */
export async function GET() {
  const isConfigured = !!COINBASE_APP_ID;
  
  return NextResponse.json({
    available: isConfigured,
    supportedAssets: ['USDC', 'ETH'],
    supportedNetworks: ['base', 'ethereum'],
  });
}

