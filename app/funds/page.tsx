"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSmartAccountClient } from "@account-kit/react";
import { useBalance } from "@/lib/hooks/useBalance";

type Mode = "add" | "withdraw";

export default function FundsPage() {
  const router = useRouter();
  const { client } = useSmartAccountClient({});
  const [mode, setMode] = useState<Mode>("add");
  const [step, setStep] = useState<"input" | "confirm" | "success">("input");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get wallet address from smart account client
  const walletAddress = client?.account?.address as `0x${string}` | undefined;
  const { total, refetch } = useBalance(walletAddress, { enabled: !!walletAddress });
  const totalBalance = parseFloat(total) || 0;

  const handleAdd = () => {
    setIsLoading(true);

    // In production, this would trigger a deposit flow
    // For now, we show the success step and refetch balance
    setTimeout(() => {
      setIsLoading(false);
      setStep("success");
      // Refetch balance from blockchain
      refetch();
    }, 1500);
  };

  const handleWithdraw = () => {
    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0 || withdrawAmount > totalBalance) return;

    setIsLoading(true);

    // In production, this would trigger a withdrawal transaction
    // For now, we show the success step and refetch balance
    setTimeout(() => {
      setIsLoading(false);
      setStep("success");
      // Refetch balance from blockchain
      refetch();
    }, 2000);
  };

  const resetForm = () => {
    setStep("input");
    setAmount("");
  };

  return (
    <div className="w-full py-12 animate-fade-in">
      {/* Back link */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {step === "input" && (
        <>
          {/* Mode Toggle */}
          <div className="flex bg-white/5 rounded-lg p-1 mb-10">
            <button
              onClick={() => { setMode("add"); setAmount(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                mode === "add" ? "bg-white text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              Add
            </button>
            <button
              onClick={() => { setMode("withdraw"); setAmount(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                mode === "withdraw" ? "bg-white text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              Withdraw
            </button>
          </div>

          <section className="mb-10">
            <h1 className="text-2xl font-medium text-white mb-2">
              {mode === "add" ? "Add Funds" : "Withdraw"}
            </h1>
            <p className="text-gray-500 text-sm">
              {mode === "add" ? "Add money to your balance." : "Withdraw to your bank account."}
            </p>
          </section>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-500">Amount</label>
                {mode === "withdraw" && (
                  <span className="text-sm text-gray-600">
                    Available: ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 pl-8 pr-20 text-white text-lg placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                />
                {mode === "withdraw" && (
                  <button
                    onClick={() => setAmount(totalBalance.toString())}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2">
              {(mode === "add" ? [100, 500, 1000, 5000] : [100, 500, 1000]).map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  disabled={mode === "withdraw" && val > totalBalance}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-gray-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ${val.toLocaleString()}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("confirm")}
              disabled={
                !amount || 
                parseFloat(amount) <= 0 || 
                (mode === "withdraw" && parseFloat(amount) > totalBalance)
              }
              className="w-full py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Continue
            </button>
          </div>
        </>
      )}

      {step === "confirm" && (
        <>
          <section className="mb-10 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mode === "add" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                )}
              </svg>
            </div>
            <h1 className="text-2xl font-medium text-white mb-2">Confirm</h1>
          </section>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Amount</span>
              <span className="text-white font-medium text-lg">
                ${parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            {mode === "withdraw" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">To</span>
                  <span className="text-gray-400 text-sm">Bank Account ••••4829</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Arrival</span>
                  <span className="text-gray-400 text-sm">1-2 business days</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Fee</span>
              <span className="text-gray-400 text-sm">Free</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("input")}
              className="flex-1 py-3 bg-white/5 text-gray-400 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={mode === "add" ? handleAdd : handleWithdraw}
              disabled={isLoading}
              className="flex-1 py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto" />
              ) : (
                mode === "add" ? "Add Funds" : "Withdraw"
              )}
            </button>
          </div>
        </>
      )}

      {step === "success" && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-white mb-2">
            {mode === "add" ? "Added" : "Withdrawal Initiated"}
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            {mode === "add" 
              ? `$${parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} has been added to your balance.`
              : `$${parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} is on its way to your bank.`
            }
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-white/5 text-gray-400 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
            >
              {mode === "add" ? "Add More" : "Withdraw More"}
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Done
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

