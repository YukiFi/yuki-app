/**
 * Quote Card Component
 * 
 * Displays an individual onramp provider quote with fees and benefits
 */

"use client";

import { motion } from "framer-motion";
import type { OnrampQuote } from "@/lib/types/onramp";

const BRAND_LAVENDER = "#e1a8f0";

interface QuoteCardProps {
    quote: OnrampQuote;
    isBest: boolean;
    onSelect: () => void;
}

export function QuoteCard({ quote, isBest, onSelect }: QuoteCardProps) {
    const savingsVsBest = 0; // TODO: Calculate savings vs best rate

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative bg-white/[0.03] rounded-2xl sm:rounded-3xl px-5 py-5 sm:px-6 sm:py-6 border transition-all duration-200 ${isBest
                    ? "border-[#e1a8f0]/30"
                    : "border-white/[0.05] hover:border-white/[0.1]"
                }`}
        >
            {/* Best Rate Badge */}
            {isBest && (
                <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-gradient-to-r from-[#e1a8f0] to-[#c48ef0] flex items-center gap-1.5">
                    <svg
                        className="w-3.5 h-3.5 text-black"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-black text-xs font-semibold">Best Rate</span>
                </div>
            )}

            {/* Provider Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-base sm:text-lg font-medium">
                    {quote.providerName}
                </h3>
                {quote.expiresAt && (
                    <span className="text-white/30 text-xs">
                        Expires in {/* TODO: Add countdown */}
                    </span>
                )}
            </div>

            {/* Main Amount */}
            <div className="mb-4">
                <p className="text-white/50 text-xs sm:text-sm mb-2">You receive</p>
                <p
                    className="text-3xl sm:text-4xl font-light text-white tabular-nums"
                    style={{ fontFeatureSettings: "'tnum' 1" }}
                >
                    {quote.cryptoAmount.toFixed(2)}{" "}
                    <span className="text-white/40 text-lg">{quote.cryptoCurrency}</span>
                </p>
            </div>

            {/* Fees */}
            <div className="mb-5 pb-5 border-b border-white/[0.05]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-white/40 text-sm">Total fees</span>
                    <span className="text-white/60 text-sm tabular-nums">
                        ${quote.totalFees.toFixed(2)} ({quote.feePercentage.toFixed(2)}%)
                    </span>
                </div>

                {/* Fee Breakdown - Expandable */}
                {quote.feeBreakdown.length > 0 && (
                    <details className="group">
                        <summary className="text-white/30 text-xs cursor-pointer hover:text-white/50 transition-colors list-none flex items-center gap-1">
                            <svg
                                className="w-3 h-3 transition-transform group-open:rotate-90"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                            See breakdown
                        </summary>
                        <div className="mt-2 space-y-1 pl-4">
                            {quote.feeBreakdown.map((fee, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <span className="text-white/30">{fee.name}</span>
                                    <span className="text-white/40 tabular-nums">
                                        ${fee.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>

            {/* Benefits (provider-specific) */}
            {quote.provider === "coinbase" && (
                <div className="mb-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-white/50">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>Zero fees on Base network</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>Apple Pay supported</span>
                    </div>
                </div>
            )}

            {/* Select Button */}
            <button
                onClick={onSelect}
                className={`w-full py-3.5 rounded-xl sm:rounded-2xl text-sm font-medium transition-all duration-150 active:scale-[0.98] ${isBest
                        ? "bg-white text-black"
                        : "bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white/80"
                    }`}
            >
                Select {quote.providerName}
            </button>
        </motion.div>
    );
}
