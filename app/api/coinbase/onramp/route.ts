/**
 * Coinbase Onramp API Route
 * 
 * Generates Coinbase Onramp URLs for fiat-to-crypto deposits.
 * Users complete KYC and purchase with Coinbase, funds go to their wallet.
 * 
 * Uses wallet address from request body for authentication.
 */

import { NextRequest, NextResponse } from 'next/server';

// Coinbase Onramp configuration
const COINBASE_APP_ID = process.env.COINBASE_APP_ID || '';
const COINBASE_ONRAMP_URL = 'https://pay.coinbase.com/buy/select-asset';

interface OnrampParams {
  appId: string;
  destinationWallets: Array<{
    address: string;
    blockchains?: string[];
    assets?: string[];
  }>;
  defaultAsset?: string;
  defaultNetwork?: string;
  presetFiatAmount?: number;
  fiatCurrency?: string;
}

/**
 * Build Coinbase Onramp URL
 */
function buildOnrampUrl(params: OnrampParams): string {
  const url = new URL(COINBASE_ONRAMP_URL);
  
  url.searchParams.set('appId', params.appId);
  url.searchParams.set('destinationWallets', JSON.stringify(params.destinationWallets));
  
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
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { walletAddress, amount, asset = 'USDC', network = 'base' } = body as {
      walletAddress?: string;
      amount?: number;
      asset?: string;
      network?: string;
    };
    
    // Validate wallet address
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      return NextResponse.json(
        { error: 'Valid wallet address is required' },
        { status: 400 }
      );
    }
    
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
        address: walletAddress,
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
      walletAddress,
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
