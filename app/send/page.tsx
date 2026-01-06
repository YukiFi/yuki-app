"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Mode = "send" | "receive";

export default function SendPage() {
  const [mode, setMode] = useState<Mode>("send");
  const [step, setStep] = useState<"input" | "confirm" | "success">("input");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    // Load balance from localStorage
    const storedBalance = localStorage.getItem("yuki_balance");
    if (storedBalance) {
      setTotalBalance(parseFloat(storedBalance));
    }
  }, []);

  const isValidRecipient = (val: string) => {
    if (!val) return false;
    if (val.startsWith("@") && val.length > 3) return true;
    if (val.startsWith("0x") && val.length > 10) return true;
    if (val.includes(".") && val.length > 3) return true;
    return false;
  };

  const handleSend = () => {
    const sendAmount = parseFloat(amount);
    if (!sendAmount || sendAmount <= 0 || sendAmount > totalBalance) return;

    setIsLoading(true);

    setTimeout(() => {
      const newBalance = totalBalance - sendAmount;
      localStorage.setItem("yuki_balance", newBalance.toString());
      setTotalBalance(newBalance);
      window.dispatchEvent(new Event("yuki_login_update"));

      setIsLoading(false);
      setStep("success");
    }, 2000);
  };

  const handleReceive = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("success");
    }, 1000);
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
              onClick={() => setMode("send")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                mode === "send" ? "bg-white text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              Pay
            </button>
            <button
              onClick={() => setMode("receive")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                mode === "receive" ? "bg-white text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              Request
            </button>
          </div>

          <section className="mb-10">
            <h1 className="text-2xl font-medium text-white mb-2">
              {mode === "send" ? "Pay" : "Request"}
            </h1>
            <p className="text-gray-500 text-sm">
              {mode === "send" ? "Send money to anyone." : "Request money from someone."}
            </p>
          </section>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-500 mb-2">
                {mode === "send" ? "Recipient" : "From"}
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="@username or 0x..."
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-500">Amount</label>
                {mode === "send" && (
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
                {mode === "send" && (
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
              {[50, 100, 250].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  disabled={mode === "send" && val > totalBalance}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm text-gray-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ${val}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("confirm")}
              disabled={
                !isValidRecipient(recipient) || 
                !amount || 
                parseFloat(amount) <= 0 || 
                (mode === "send" && parseFloat(amount) > totalBalance)
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
                {mode === "send" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{mode === "send" ? "To" : "From"}</span>
              <span className="text-white font-mono text-sm">
                {recipient.startsWith("0x") ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}` : recipient}
              </span>
            </div>
            {mode === "send" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Fee</span>
                  <span className="text-gray-400 text-sm">Free</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Arrival</span>
                  <span className="text-gray-400 text-sm">Instant</span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("input")}
              className="flex-1 py-3 bg-white/5 text-gray-400 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={mode === "send" ? handleSend : handleReceive}
              disabled={isLoading}
              className="flex-1 py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto" />
              ) : (
                mode === "send" ? "Pay" : "Request"
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
            {mode === "send" ? "Paid" : "Request Sent"}
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            {mode === "send" ? (
              <>
                ${parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} is on its way to{" "}
                {recipient.startsWith("0x") ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}` : recipient}
              </>
            ) : (
              <>
                Request for ${parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} sent to{" "}
                {recipient.startsWith("0x") ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}` : recipient}
              </>
            )}
          </p>
          <Link
            href="/"
            className="inline-flex px-6 py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
