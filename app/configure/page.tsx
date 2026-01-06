"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type ComfortLevel = "steady" | "balanced" | "flexible";

const comfortLevels: {
  id: ComfortLevel;
  name: string;
  intent: string;
  riskPosture: string;
  forWho: string;
  isRecommended: boolean;
}[] = [
  {
    id: "steady",
    name: "Steady",
    intent: "Prioritizes stability. Your balance changes slowly and predictably.",
    riskPosture: "In bad conditions, this holds up well with minimal fluctuation.",
    forWho: "For those who prefer not to think about it.",
    isRecommended: false,
  },
  {
    id: "balanced",
    name: "Balanced",
    intent: "A mix of stability and growth. Some movement, but nothing dramatic.",
    riskPosture: "In bad conditions, you may see temporary dips, but they tend to recover.",
    forWho: "For most people. A reasonable middle ground.",
    isRecommended: true,
  },
  {
    id: "flexible",
    name: "Flexible",
    intent: "Allows for more growth, but with more ups and downs along the way.",
    riskPosture: "In bad conditions, your balance may drop noticeably before recovering.",
    forWho: "For those comfortable with fluctuation over time.",
    isRecommended: false,
  },
];

const comfortToAllocation: Record<ComfortLevel, { stable: number; balanced: number; growth: number }> = {
  steady: { stable: 80, balanced: 20, growth: 0 },
  balanced: { stable: 40, balanced: 45, growth: 15 },
  flexible: { stable: 20, balanced: 35, growth: 45 },
};

export default function ConfigurePage() {
  const [step, setStep] = useState<"select" | "confirm" | "success">("select");
  const [currentLevel, setCurrentLevel] = useState<ComfortLevel>("balanced");
  const [selected, setSelected] = useState<ComfortLevel>("balanced");

  useEffect(() => {
    // Load comfort level from localStorage
    const storedComfort = localStorage.getItem("yuki_comfort_level") as ComfortLevel | null;
    if (storedComfort) {
      setCurrentLevel(storedComfort);
      setSelected(storedComfort);
    }
  }, []);

  const selectedLevel = comfortLevels.find(l => l.id === selected)!;
  const hasChanged = selected !== currentLevel;

  const handleConfirm = () => {
    // Update comfort level
    localStorage.setItem("yuki_comfort_level", selected);

    // Redistribute balances
    const storedBalances = localStorage.getItem("yuki_balances");
    const balances = storedBalances ? JSON.parse(storedBalances) : {};
    const totalBalance = Object.values(balances).reduce((acc: number, val) => acc + (val as number), 0);

    const distribution = comfortToAllocation[selected];
    const newBalances = {
      "yuki-stable": (totalBalance * distribution.stable) / 100,
      "eth-yield": (totalBalance * distribution.balanced) / 100,
      "sol-turbo": (totalBalance * distribution.growth) / 100,
    };

    localStorage.setItem("yuki_balances", JSON.stringify(newBalances));
    window.dispatchEvent(new Event("yuki_login_update"));

    setCurrentLevel(selected);
    setStep("success");
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

      {step === "select" && (
        <>
          <section className="mb-8">
            <h1 className="text-2xl font-medium text-white mb-2">How should your money behave?</h1>
            <p className="text-gray-500 text-sm">
              Choose a comfort level. You can change this anytime.
            </p>
          </section>

          {/* Reassurance */}
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 mb-8">
            <p className="text-sm text-gray-500 leading-relaxed">
              This affects future behavior only. Your money stays available — 
              sends and withdrawals are never blocked. Nothing is locked.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {comfortLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelected(level.id)}
                className={`w-full text-left p-5 rounded-xl border transition-all cursor-pointer ${
                  selected === level.id
                    ? "bg-white/[0.04] border-white/20"
                    : "bg-white/[0.01] border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{level.name}</span>
                    {level.isRecommended && (
                      <span className="px-2 py-0.5 text-[10px] text-emerald-500/80 bg-emerald-500/10 rounded-full">
                        Recommended
                      </span>
                    )}
                    {level.id === currentLevel && (
                      <span className="px-2 py-0.5 text-[10px] text-gray-500 bg-white/5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selected === level.id ? "border-white" : "border-white/20"
                  }`}>
                    {selected === level.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-3">{level.intent}</p>

                <div className="space-y-1">
                  <p className="text-xs text-gray-600">{level.riskPosture}</p>
                  <p className="text-xs text-gray-500 italic">{level.forWho}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Tradeoff reminder */}
          <p className="text-xs text-gray-600 text-center mb-8">
            More growth means more fluctuation. More stability means lower upside.
          </p>

          {/* Actions */}
          {hasChanged ? (
            <button
              onClick={() => setStep("confirm")}
              className="w-full py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Continue
            </button>
          ) : (
            <Link
              href="/"
              className="block w-full py-3 bg-white/5 text-gray-400 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors text-center"
            >
              Back to Dashboard
            </Link>
          )}
        </>
      )}

      {step === "confirm" && (
        <>
          <section className="mb-10 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-medium text-white mb-2">Confirm your choice</h1>
          </section>

          {/* Summary */}
          <div className="bg-white/[0.02] rounded-xl border border-white/5 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">New setting</span>
              <span className="text-sm text-white font-medium">{selectedLevel.name}</span>
            </div>
            <p className="text-sm text-gray-400">{selectedLevel.intent}</p>
          </div>

          {/* Reassurances */}
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-500">Takes effect automatically in the background</p>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-500">Your money stays fully available</p>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-500">You can change this anytime</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep("select")}
              className="flex-1 py-3 bg-white/5 text-gray-400 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Confirm
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
          <h2 className="text-xl font-medium text-white mb-2">Updated</h2>
          <p className="text-gray-500 text-sm mb-8">
            Your comfort level is now set to {selectedLevel.name}.
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

