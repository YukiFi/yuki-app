/**
 * Provider Modal Component
 * 
 * Opens when user selects a provider to complete their purchase
 * Uses direct URL approach for Coinbase (simpler, no SDK needed)
 */

"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OnrampQuote } from "@/lib/types/onramp";

interface ProviderModalProps {
    isOpen: boolean;
    provider: string | null;
    quote: OnrampQuote | null;
    walletAddress: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function ProviderModal({
    isOpen,
    provider,
    quote,
    walletAddress,
    onClose,
    onSuccess,
}: ProviderModalProps) {
    useEffect(() => {
        if (!isOpen || !provider || !quote || !walletAddress) return;

        if (provider === "coinbase") {
            openCoinbaseWidget();
        }
    }, [isOpen, provider, quote, walletAddress]);

    const openCoinbaseWidget = () => {
        // Build Coinbase Onramp URL with correct parameters
        // Using the simpler URL format that Coinbase expects
        const params = new URLSearchParams({
            appId: process.env.NEXT_PUBLIC_COINBASE_ONRAMP_CLIENT_KEY || '',
            addresses: JSON.stringify({
                [walletAddress]: ['base'], // wallet address mapped to networks
            }),
            assets: JSON.stringify(['USDC']), // assets to purchase
            defaultAsset: 'USDC',
            defaultNetwork: 'base',
            defaultPaymentMethod: 'CARD',
            presetCryptoAmount: quote?.fiatAmount.toString() || '100',
        });

        const coinbaseUrl = `https://pay.coinbase.com/buy/select-asset?${params.toString()}`;

        console.log('Opening Coinbase URL:', coinbaseUrl);

        // Open in new window
        const width = 500;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        const popup = window.open(
            coinbaseUrl,
            'coinbase-onramp',
            `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        if (!popup) {
            alert('Please allow popups for this site to use Coinbase');
            onClose();
        }
        // Note: We don't auto-close anymore - user manually closes when done
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-[400px] bg-[#0a0a0a] rounded-2xl sm:rounded-3xl border border-white/[0.05] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-white/[0.05]">
                        <h2 className="text-white text-lg font-medium">
                            Opening Coinbase
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-white/40 hover:text-white/60 transition-colors"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-[#e1a8f0]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-[#e1a8f0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </div>

                        <h3 className="text-white text-lg font-medium mb-2">
                            Complete Your Purchase
                        </h3>

                        <p className="text-white/50 text-sm mb-6">
                            A new window has opened with Coinbase. Complete your purchase there and return here when done.
                        </p>

                        <div className="bg-white/[0.03] rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white/50 text-sm">Amount</span>
                                <span className="text-white font-medium">${quote?.fiatAmount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-white/50 text-sm">You'll receive</span>
                                <span className="text-white font-medium">~{quote?.fiatAmount} USDC</span>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-white/[0.05] text-white/60 rounded-xl text-sm hover:bg-white/[0.08] transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
