/**
 * Onramp Quote Comparison API
 * 
 * Fetches quotes from multiple providers and returns sorted results
 */

import { NextRequest, NextResponse } from 'next/server';
import type { OnrampQuoteRequest, OnrampQuoteResponse } from '@/lib/types/onramp';
import {
    fetchCoinbaseQuote,
    fetchMoonPayQuote,
    fetchTransakQuote,
    fetchRampQuote,
} from '@/lib/onramp/providers';

// Simple in-memory cache
const quoteCache = new Map<string, { data: OnrampQuoteResponse; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getCacheKey(request: OnrampQuoteRequest): string {
    return `${request.fiatAmount}_${request.fiatCurrency}_${request.cryptoCurrency}_${request.paymentMethod || 'card'}`;
}

export async function POST(req: NextRequest) {
    try {
        const body: OnrampQuoteRequest = await req.json();

        // Validate request
        if (!body.fiatAmount || body.fiatAmount <= 0) {
            return NextResponse.json(
                { error: 'Invalid fiat amount' },
                { status: 400 }
            );
        }

        // Set defaults
        const request: OnrampQuoteRequest = {
            fiatAmount: body.fiatAmount,
            fiatCurrency: body.fiatCurrency || 'USD',
            cryptoCurrency: body.cryptoCurrency || 'USDC',
            paymentMethod: body.paymentMethod || 'card',
            country: body.country || 'US',
        };

        // Check cache
        const cacheKey = getCacheKey(request);
        const cached = quoteCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data);
        }

        // Fetch quotes from all providers in parallel
        const results = await Promise.allSettled([
            fetchCoinbaseQuote(request),
            // Only fetch from other providers if API keys are configured
            process.env.MOONPAY_API_KEY ? fetchMoonPayQuote(request) : Promise.resolve(null),
            process.env.TRANSAK_API_KEY ? fetchTransakQuote(request) : Promise.resolve(null),
            process.env.RAMP_API_KEY ? fetchRampQuote(request) : Promise.resolve(null),
        ]);

        // Extract successful quotes
        const quotes = results
            .map((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    return result.value;
                }
                return null;
            })
            .filter((quote): quote is import('@/lib/types/onramp').OnrampQuote => quote !== null && quote.success);

        // Sort by crypto amount (descending - best rate first)
        quotes.sort((a, b) => b.cryptoAmount - a.cryptoAmount);

        const response: OnrampQuoteResponse = {
            quotes,
            bestQuote: quotes.length > 0 ? quotes[0] : undefined,
            timestamp: Date.now(),
        };

        // Cache the result
        quoteCache.set(cacheKey, { data: response, timestamp: Date.now() });

        // Clean up old cache entries (simple cleanup)
        if (quoteCache.size > 100) {
            const now = Date.now();
            for (const [key, value] of quoteCache.entries()) {
                if (now - value.timestamp > CACHE_TTL) {
                    quoteCache.delete(key);
                }
            }
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Quote comparison error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quotes' },
            { status: 500 }
        );
    }
}
