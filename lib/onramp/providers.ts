/**
 * Onramp Provider Integrations
 * 
 * Fetches quotes from various onramp providers
 */

import type {
    OnrampQuote,
    OnrampQuoteRequest,
    CoinbaseQuoteResponse,
    MoonPayQuoteResponse,
    TransakQuoteResponse,
    RampQuoteResponse,
} from '@/lib/types/onramp';

// Timeout for API calls (3 seconds)
const API_TIMEOUT = 3000;

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(
    promise: Promise<Response>,
    timeoutMs: number = API_TIMEOUT
): Promise<Response> {
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    );
    return Promise.race([promise, timeoutPromise]);
}

export async function fetchCoinbaseQuote(
    request: OnrampQuoteRequest
): Promise<OnrampQuote> {
    try {
        console.log('[Coinbase] Fetching quote for:', request);
        console.log('[Coinbase] API Key exists:', !!process.env.COINBASE_ONRAMP_API_KEY);

        const requestBody = {
            purchase_currency: request.cryptoCurrency,
            payment_currency: request.fiatCurrency,
            payment_amount: request.fiatAmount.toString(),
            payment_method: request.paymentMethod?.toUpperCase() || 'CARD',
            country: request.country || 'US',
        };

        console.log('[Coinbase] Request body:', requestBody);

        const response = await fetchWithTimeout(
            fetch('https://api.developer.coinbase.com/onramp/v1/buy/quote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.COINBASE_ONRAMP_API_KEY}`,
                },
                body: JSON.stringify(requestBody),
            })
        );

        console.log('[Coinbase] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Coinbase] API error response:', errorText);
            throw new Error(`Coinbase API error: ${response.status} - ${errorText}`);
        }

        const data: CoinbaseQuoteResponse = await response.json();
        console.log('[Coinbase] Success! Quote data:', data);

        const coinbaseFee = parseFloat(data.coinbase_fee.value);
        const networkFee = parseFloat(data.network_fee.value);
        const totalFees = parseFloat(data.total_fee);
        const cryptoAmount = parseFloat(data.purchase_amount);

        return {
            provider: 'coinbase',
            providerName: 'Coinbase',
            fiatAmount: request.fiatAmount,
            fiatCurrency: request.fiatCurrency,
            cryptoAmount,
            cryptoCurrency: request.cryptoCurrency,
            totalFees,
            feePercentage: (totalFees / request.fiatAmount) * 100,
            feeBreakdown: [
                { name: 'Coinbase Fee', amount: coinbaseFee },
                { name: 'Network Fee', amount: networkFee },
            ],
            success: true,
            timestamp: Date.now(),
        };
    } catch (error) {
        console.error('[Coinbase] Error fetching quote:', error);
        return {
            provider: 'coinbase',
            providerName: 'Coinbase',
            fiatAmount: request.fiatAmount,
            fiatCurrency: request.fiatCurrency,
            cryptoAmount: 0,
            cryptoCurrency: request.cryptoCurrency,
            totalFees: 0,
            feePercentage: 0,
            feeBreakdown: [],
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
        };
    }
}

/**
 * MoonPay Quote
 */
export async function fetchMoonPayQuote(
    request: OnrampQuoteRequest
): Promise<OnrampQuote> {
    try {
        const params = new URLSearchParams({
            baseCurrencyAmount: request.fiatAmount.toString(),
            baseCurrencyCode: request.fiatCurrency.toLowerCase(),
            paymentMethod: 'credit_debit_card',
        });

        const response = await fetchWithTimeout(
            fetch(
                `https://api.moonpay.com/v3/currencies/${request.cryptoCurrency.toLowerCase()}/buy_quote?${params}`,
                {
                    headers: {
                        'Authorization': `Api-Key ${process.env.MOONPAY_API_KEY}`,
                    },
                }
            )
        );

        if (!response.ok) {
            throw new Error(`MoonPay API error: ${response.status}`);
        }

        const data: MoonPayQuoteResponse = await response.json();

        const totalFees = data.feeAmount + data.networkFeeAmount;

        return {
            provider: 'moonpay',
            providerName: 'MoonPay',
            fiatAmount: request.fiatAmount,
            fiatCurrency: request.fiatCurrency,
            cryptoAmount: data.quoteCurrencyAmount,
            cryptoCurrency: request.cryptoCurrency,
            totalFees,
            feePercentage: (totalFees / request.fiatAmount) * 100,
            feeBreakdown: [
                { name: 'MoonPay Fee', amount: data.feeAmount },
                { name: 'Network Fee', amount: data.networkFeeAmount },
            ],
            expiresAt: data.expiresAt,
            success: true,
            timestamp: Date.now(),
        };
    } catch (error) {
        return {
            provider: 'moonpay',
            providerName: 'MoonPay',
            fiatAmount: request.fiatAmount,
            fiatCurrency: request.fiatCurrency,
            cryptoAmount: 0,
            cryptoCurrency: request.cryptoCurrency,
            totalFees: 0,
            feePercentage: 0,
            feeBreakdown: [],
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
        };
    }
}

/**
 * Transak Quote
 */
export async function fetchTransakQuote(
    request: OnrampQuoteRequest
): Promise<OnrampQuote> {
    try {
        const params = new URLSearchParams({
            fiatCurrency: request.fiatCurrency,
            cryptoCurrency: request.cryptoCurrency,
            fiatAmount: request.fiatAmount.toString(),
            paymentMethod: 'credit_debit_card',
            network: 'ethereum', // TODO: Make this configurable
        });

        const response = await fetchWithTimeout(
            fetch(`https://api.transak.com/api/v2/currencies/price?${params}`, {
                headers: {
                    'api-key': process.env.TRANSAK_API_KEY || '',
                },
            })
        );

        if (!response.ok) {
            throw new Error(`Transak API error: ${response.status}`);
        }

        const data: TransakQuoteResponse = await response.json();

        const totalFees = data.response.feeBreakdown.reduce(
            (sum, fee) => sum + fee.value,
            0
        );

        return {
            provider: 'transak',
            providerName: 'Transak',
            fiatAmount: request.fiatAmount,
            fiatCurrency: request.fiatCurrency,
            cryptoAmount: data.response.cryptoAmount,
            cryptoCurrency: request.cryptoCurrency,
            totalFees,
            feePercentage: (totalFees / request.fiatAmount) * 100,
            feeBreakdown: data.response.feeBreakdown.map((fee) => ({
                name: fee.name,
                amount: fee.value,
            })),
            success: true,
            timestamp: Date.now(),
        };
    } catch (error) {
        return {
            provider: 'transak',
            providerName: 'Transak',
            fiatAmount: request.fiatAmount,
            fiatCurrency: request.fiatCurrency,
            cryptoAmount: 0,
            cryptoCurrency: request.cryptoCurrency,
            totalFees: 0,
            feePercentage: 0,
            feeBreakdown: [],
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
        };
    }
}

/**
 * Ramp Network Quote
 */
export async function fetchRampQuote(
    request: OnrampQuoteRequest
): Promise<OnrampQuote> {
    try {
        const params = new URLSearchParams({
            fiatCurrency: request.fiatCurrency,
            fiatValue: request.fiatAmount.toString(),
            paymentMethodType: 'CARD',
        });

        const response = await fetchWithTimeout(
            fetch(
                `https://api.ramp.network/api/host-api/assets/${request.cryptoCurrency}/price?${params}`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.RAMP_API_KEY}`,
                    },
                }
            )
        );

        if (!response.ok) {
            throw new Error(`Ramp API error: ${response.status}`);
        }

        const data: RampQuoteResponse = await response.json();

        const cryptoAmount = parseFloat(data.assetAmount);
        const totalFees = data.appliedFee;

        return {
            provider: 'ramp',
            providerName: 'Ramp',
            fiatAmount: request.fiatAmount,
            fiatCurrency: request.fiatCurrency,
            cryptoAmount,
            cryptoCurrency: request.cryptoCurrency,
            totalFees,
            feePercentage: (totalFees / request.fiatAmount) * 100,
            feeBreakdown: [{ name: 'Ramp Fee', amount: totalFees }],
            success: true,
            timestamp: Date.now(),
        };
    } catch (error) {
        return {
            provider: 'ramp',
            providerName: 'Ramp',
            fiatAmount: request.fiatAmount,
            fiatCurrency: request.fiatCurrency,
            cryptoAmount: 0,
            cryptoCurrency: request.cryptoCurrency,
            totalFees: 0,
            feePercentage: 0,
            feeBreakdown: [],
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
        };
    }
}
