/**
 * POST /api/wallet/upgrade
 * 
 * DEPRECATED: With Alchemy Smart Wallets, passkey management is handled natively.
 * This endpoint is kept for backwards compatibility but returns a deprecation notice.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Passkey management is now handled by Alchemy Smart Wallets.',
      code: 'DEPRECATED'
    },
    { status: 410 } // Gone
  );
}
