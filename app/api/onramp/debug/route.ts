/**
 * Debug endpoint to test Coinbase API
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        console.log('=== Coinbase API Debug ===');
        console.log('API Key exists:', !!process.env.COINBASE_ONRAMP_API_KEY);
        console.log('Project ID exists:', !!process.env.COINBASE_ONRAMP_PROJECT_ID);

        const testRequest = {
            purchase_currency: 'USDC',
            payment_currency: 'USD',
            payment_amount: '100',
            payment_method: 'CARD',
            country: 'US',
        };

        console.log('Request body:', JSON.stringify(testRequest, null, 2));

        const response = await fetch('https://api.developer.coinbase.com/onramp/v1/buy/quote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.COINBASE_ONRAMP_API_KEY}`,
            },
            body: JSON.stringify(testRequest),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('Response body:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = { raw: responseText };
        }

        return NextResponse.json({
            success: response.ok,
            status: response.status,
            data,
            env: {
                hasApiKey: !!process.env.COINBASE_ONRAMP_API_KEY,
                hasProjectId: !!process.env.COINBASE_ONRAMP_PROJECT_ID,
                apiKeyPrefix: process.env.COINBASE_ONRAMP_API_KEY?.substring(0, 10) + '...',
            }
        });
    } catch (error) {
        console.error('Debug error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        }, { status: 500 });
    }
}
