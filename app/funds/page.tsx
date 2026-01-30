"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSmartAccountClient } from "@account-kit/react";
import { useBalance } from "@/lib/hooks/useBalance";
import { OnrampComparison } from "@/components/onramp/OnrampComparison";
import { ProviderModal } from "@/components/onramp/ProviderModal";
import type { OnrampQuote } from "@/lib/types/onramp";

const BRAND_LAVENDER = "#e1a8f0";

type Mode = "add" | "withdraw";

export default function FundsPage() {
  const { client } = useSmartAccountClient({});
  const [mode, setMode] = useState<Mode>("add");
  const [step, setStep] = useState<"input" | "confirm" | "success">("input");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<OnrampQuote | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);

  // Get wallet address from smart account client
  const walletAddress = client?.account?.address as `0x${string}` | undefined;
  const { total, refetch } = useBalance(walletAddress, { enabled: !!walletAddress });
  const totalBalance = parseFloat(total) || 0;

  const numericAmount = parseFloat(amount) || 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(val);
  };

  const handleAdd = () => {
    setIsLoading(true);

    // In production, this would trigger a deposit flow
    setTimeout(() => {
      setIsLoading(false);
      setStep("success");
      refetch();
    }, 1500);
  };

  const handleWithdraw = () => {
    if (!numericAmount || numericAmount <= 0 || numericAmount > totalBalance) return;

    setIsLoading(true);

    // In production, this would trigger a withdrawal transaction
    setTimeout(() => {
      setIsLoading(false);
      setStep("success");
      refetch();
    }, 2000);
  };

  const resetForm = () => {
    setStep("input");
    setAmount("");
  };

  const canContinue = numericAmount > 0 && (mode === "add" || numericAmount <= totalBalance);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center px-4 sm:px-8 lg:px-12 py-6 sm:py-10 lg:py-16">
      <div className="w-full max-w-[600px]">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors mb-6 sm:mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </Link>

        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Page Title */}
              <h1 className="text-lg sm:text-xl lg:text-2xl text-white mb-6 sm:mb-8">
                {mode === "add" ? "Add Funds" : "Withdraw"}
              </h1>

              {/* Mode Toggle */}
              <div className="bg-white/[0.03] rounded-2xl p-1.5 mb-6 sm:mb-8">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => { setMode("add"); setAmount(""); }}
                    className={`py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl transition-all duration-200 ${mode === "add"
                      ? "bg-white text-black shadow-lg"
                      : "text-white/50 hover:text-white/70"
                      }`}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setMode("withdraw"); setAmount(""); }}
                    className={`py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl transition-all duration-200 ${mode === "withdraw"
                      ? "bg-white text-black shadow-lg"
                      : "text-white/50 hover:text-white/70"
                      }`}
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              {mode === "add" ? (
                /* Add Funds - Simple Coinbase Integration */
                <>
                  {/* Amount Input Card */}
                  <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-5 py-6 sm:px-8 sm:py-8 mb-6">
                    {/* Label */}
                    <div className="mb-4 sm:mb-6">
                      <p className="text-white/50 text-xs sm:text-sm font-medium">Amount to add</p>
                    </div>

                    {/* Amount Input */}
                    <div className="flex items-baseline mb-6 sm:mb-8">
                      <span style={{ color: BRAND_LAVENDER }} className="text-4xl sm:text-5xl font-light">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="bg-transparent text-white text-4xl sm:text-5xl font-light w-full focus:outline-none placeholder:text-white/20"
                        style={{ fontFeatureSettings: "'tnum' 1" }}
                        autoFocus
                      />
                    </div>

                    {/* Quick amounts */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                      {[100, 500, 1000, 5000].map((val, idx) => (
                        <button
                          key={idx}
                          onClick={() => setAmount(val.toString())}
                          className="py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white/80 active:scale-[0.98]"
                        >
                          ${val.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={() => {
                      setSelectedProvider("coinbase");
                      setSelectedQuote({
                        provider: "coinbase",
                        providerName: "Coinbase",
                        fiatAmount: numericAmount,
                        fiatCurrency: "USD",
                        cryptoAmount: numericAmount,
                        cryptoCurrency: "USDC",
                        totalFees: 0,
                        feePercentage: 0,
                        feeBreakdown: [],
                        success: true,
                        timestamp: Date.now(),
                      });
                      setShowProviderModal(true);
                    }}
                    disabled={!canContinue}
                    className={`w-full py-4 rounded-xl sm:rounded-2xl text-base font-medium transition-all duration-150 ${canContinue
                      ? "bg-white text-black active:scale-[0.98] cursor-pointer"
                      : "bg-white/[0.05] text-white/30 cursor-not-allowed"
                      }`}
                  >
                    Continue with Coinbase
                  </button>
                </>
              ) : (
                /* Withdraw - Keep existing amount input */
                <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-5 py-6 sm:px-8 sm:py-8 mb-6">
                  {/* Label and Available Balance */}
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <p className="text-white/50 text-xs sm:text-sm font-medium">Amount</p>
                    <p className="text-white/30 text-xs sm:text-sm tabular-nums" style={{ fontFeatureSettings: "'tnum' 1" }}>
                      Available: ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Amount Input */}
                  <div className="flex items-baseline mb-6 sm:mb-8">
                    <span style={{ color: BRAND_LAVENDER }} className="text-4xl sm:text-5xl font-light">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0"
                      className="bg-transparent text-white text-4xl sm:text-5xl font-light w-full focus:outline-none placeholder:text-white/20"
                      style={{ fontFeatureSettings: "'tnum' 1" }}
                      autoFocus
                    />
                  </div>

                  {/* Quick amounts */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {[100, 500, 1000, totalBalance].map((val, idx) => {
                      const isMax = idx === 3;
                      const displayVal = isMax ? "MAX" : `$${val.toLocaleString()}`;
                      const disabled = val > totalBalance;

                      return (
                        <button
                          key={idx}
                          onClick={() => setAmount(val.toString())}
                          disabled={disabled}
                          className={`py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${disabled
                            ? "bg-white/[0.02] text-white/20 cursor-not-allowed"
                            : "bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white/80 active:scale-[0.98]"
                            }`}
                        >
                          {displayVal}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Continue Button - Only show for withdraw mode */}
              {mode === "withdraw" && (
                <button
                  onClick={() => setStep("confirm")}
                  disabled={!canContinue}
                  className={`w-full py-4 rounded-xl sm:rounded-2xl text-base font-medium transition-all duration-150 ${canContinue
                    ? "bg-white text-black active:scale-[0.98] cursor-pointer"
                    : "bg-white/[0.05] text-white/30 cursor-not-allowed"
                    }`}
                >
                  Continue
                </button>
              )}
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Page Title */}
              <h1 className="text-lg sm:text-xl lg:text-2xl text-white mb-6 sm:mb-8">
                Confirm {mode === "add" ? "Deposit" : "Withdrawal"}
              </h1>

              {/* Confirmation Card */}
              <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-5 py-6 sm:px-8 sm:py-8 mb-6">
                {/* Amount Display */}
                <div className="text-center mb-6 sm:mb-8">
                  <p className="text-white/50 text-xs sm:text-sm font-medium mb-3">
                    {mode === "add" ? "Adding" : "Withdrawing"}
                  </p>
                  <p
                    className="text-4xl sm:text-5xl font-light text-white"
                    style={{ fontFeatureSettings: "'tnum' 1" }}
                  >
                    <span style={{ color: BRAND_LAVENDER }}>$</span>
                    {numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 border-t border-white/[0.05]">
                  {mode === "withdraw" && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-sm">To</span>
                        <span className="text-white/60 text-sm">Bank Account ••••4829</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-sm">Arrival</span>
                        <span className="text-white/60 text-sm">1-2 business days</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-sm">Fee</span>
                    <span className="text-white/60 text-sm">Free</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStep("input")}
                  className="py-4 rounded-xl sm:rounded-2xl bg-white/[0.05] text-white/60 text-base font-medium hover:bg-white/[0.08] hover:text-white/80 transition-all duration-150 active:scale-[0.98]"
                >
                  Back
                </button>
                <button
                  onClick={mode === "add" ? handleAdd : handleWithdraw}
                  disabled={isLoading}
                  className="py-4 rounded-xl sm:rounded-2xl bg-white text-black text-base font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto" />
                  ) : (
                    mode === "add" ? "Confirm" : "Withdraw"
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center py-12"
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: `${BRAND_LAVENDER}15` }}
              >
                <svg
                  className="w-10 h-10"
                  style={{ color: BRAND_LAVENDER }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              {/* Success Message */}
              <h2 className="text-2xl sm:text-3xl font-medium text-white mb-3">
                {mode === "add" ? "Funds Added" : "Withdrawal Initiated"}
              </h2>
              <p className="text-white/50 text-sm sm:text-base mb-8 max-w-md mx-auto">
                {mode === "add"
                  ? `$${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} has been added to your balance.`
                  : `$${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} is on its way to your bank.`
                }
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={resetForm}
                  className="px-6 py-3.5 rounded-xl bg-white/[0.05] text-white/60 text-sm font-medium hover:bg-white/[0.08] hover:text-white/80 transition-all duration-150 active:scale-[0.98]"
                >
                  {mode === "add" ? "Add More" : "Withdraw More"}
                </button>
                <Link
                  href="/"
                  className="px-6 py-3.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-gray-100 transition-all duration-150 active:scale-[0.98] text-center"
                >
                  Back to Dashboard
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Provider Modal */}
      <ProviderModal
        isOpen={showProviderModal}
        provider={selectedProvider}
        quote={selectedQuote}
        walletAddress={walletAddress || ""}
        onClose={() => {
          setShowProviderModal(false);
          setSelectedProvider(null);
          setSelectedQuote(null);
        }}
        onSuccess={() => {
          setShowProviderModal(false);
          setStep("success");
          refetch();
        }}
      />
    </div>
  );
}
