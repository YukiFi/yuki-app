/**
 * Onramp Types
 * 
 * Type definitions for multi-provider onramp quote comparison
 */

export type OnrampProvider = 'coinbase' | 'moonpay' | 'transak' | 'ramp';

export interface FeeItem {
    name: string;
    amount: number;
    percentage?: number;
}

export interface OnrampQuote {
    provider: OnrampProvider;
    providerName: string;

    // Amounts
    fiatAmount: number;
    fiatCurrency: string;
    cryptoAmount: number;
    cryptoCurrency: string;

    // Fees
    totalFees: number;
    feePercentage: number;
    feeBreakdown: FeeItem[];

    // Metadata
    expiresAt?: string;
    estimatedTime?: string;
    paymentMethods?: string[];

    // Status
    success: boolean;
    error?: string;
    timestamp: number;
}

export interface OnrampQuoteRequest {
    fiatAmount: number;
    fiatCurrency: string;
    cryptoCurrency: string;
    paymentMethod?: 'card' | 'bank' | 'apple_pay';
    country?: string;
}

export interface OnrampQuoteResponse {
    quotes: OnrampQuote[];
    bestQuote?: OnrampQuote;
    timestamp: number;
}

// Provider-specific response types
export interface CoinbaseQuoteResponse {
    coinbase_fee: { value: string; currency: string };
    network_fee: { value: string; currency: string };
    purchase_amount: string;
    total_fee: string;
    quote_id?: string;
}

export interface MoonPayQuoteResponse {
    quoteCurrencyAmount: number;
    feeAmount: number;
    networkFeeAmount: number;
    totalAmount: number;
    expiresAt: string;
}

export interface TransakQuoteResponse {
    response: {
        cryptoAmount: number;
        conversionPrice: number;
        feeBreakdown: Array<{
            name: string;
            value: number;
            id: string;
        }>;
    };
}

export interface RampQuoteResponse {
    assetAmount: string;
    fiatValue: number;
    appliedFee: number;
}
