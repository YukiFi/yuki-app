"use client";

import { useState } from "react";

interface SendFlowProps {
  isOpen: boolean;
  onClose: () => void;
  balances: Record<string, number>;
  onUpdateBalances: (newBalances: Record<string, number>) => void;
}

export default function SendFlow({ isOpen, onClose, balances, onUpdateBalances }: SendFlowProps) {
  const [step, setStep] = useState<"input" | "confirm" | "success">("input");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const totalBalance = Object.values(balances).reduce((acc, val) => acc + val, 0);

  const isValidRecipient = (val: string) => {
    if (!val) return false;
    // Basic username check
    if (val.startsWith("@") && val.length > 3) return true;
    // Basic ETH address check (very loose for demo)
    if (val.startsWith("0x") && val.length > 10) return true;
    // ENS check (loose)
    if (val.includes(".") && val.length > 3) return true;
    return false;
  };

  const handleSend = () => {
    const sendAmount = parseFloat(amount);
    if (!sendAmount || sendAmount <= 0 || sendAmount > totalBalance) return;

    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      // Smart Deduction Logic: Stable -> Balanced -> Growth
      let remainingToDeduct = sendAmount;
      const newBalances = { ...balances };
      
      const deductionOrder = ["yuki-stable", "eth-yield", "sol-turbo"];
      
      for (const profileId of deductionOrder) {
        if (remainingToDeduct <= 0) break;
        
        const profileBalance = newBalances[profileId] || 0;
        if (profileBalance > 0) {
          const deduction = Math.min(profileBalance, remainingToDeduct);
          newBalances[profileId] = profileBalance - deduction;
          remainingToDeduct -= deduction;
        }
      }

      onUpdateBalances(newBalances);
      setIsLoading(false);
      setStep("success");
    }, 2000);
  };

  const resetAndClose = () => {
    setStep("input");
    setAmount("");
    setRecipient("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-white font-medium">Send / Withdraw</h3>
          <button 
            onClick={resetAndClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "input" && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Recipient</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="@username, 0x..., or ENS"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Amount</label>
                  <span className="text-xs text-gray-500">
                    Available: ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                  />
                  <button 
                    onClick={() => setAmount(totalBalance.toString())}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <button
                onClick={() => setStep("confirm")}
                disabled={!isValidRecipient(recipient) || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > totalBalance}
                className="w-full py-4 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                Review Transaction
              </button>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-1">Sending</p>
                <h2 className="text-4xl font-medium text-white mb-6">
                  ${parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </h2>
                
                <div className="bg-white/5 rounded-xl p-4 text-left space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">To</span>
                    <span className="text-white font-mono">
                      {recipient.startsWith("0x") ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}` : recipient}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Network Fee</span>
                    <span className="text-white">Free (Subsidized)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Arrival</span>
                    <span className="text-white">~2 mins</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("input")}
                  className="flex-1 py-3 text-gray-400 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-all disabled:opacity-70"
                >
                  {isLoading ? "Sending..." : "Confirm Send"}
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-medium text-white mb-2">Sent!</h2>
              <p className="text-gray-500 mb-8">
                Your transaction is on its way.
              </p>
              <button
                onClick={resetAndClose}
                className="w-full py-4 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
