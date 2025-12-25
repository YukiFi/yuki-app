"use client";

import { useState, useEffect } from "react";

type ComfortLevel = "steady" | "balanced" | "flexible";

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: ComfortLevel;
  onConfirm: (level: ComfortLevel) => void;
}

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

export default function AllocationModal({ 
  isOpen, 
  onClose, 
  currentLevel,
  onConfirm 
}: AllocationModalProps) {
  const [selected, setSelected] = useState<ComfortLevel>(currentLevel);
  const [step, setStep] = useState<"select" | "confirm">("select");

  useEffect(() => {
    if (isOpen) {
      setSelected(currentLevel);
      setStep("select");
    }
  }, [isOpen, currentLevel]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedLevel = comfortLevels.find(l => l.id === selected)!;
  const hasChanged = selected !== currentLevel;

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "select" ? (
          <>
            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-medium text-white mb-1">
                    How should your money behave?
                  </h2>
                  <p className="text-sm text-gray-500">
                    Choose a comfort level. You can change this anytime.
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="text-gray-500 hover:text-white transition-colors p-1 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Reassurance */}
              <div className="mt-4 p-3 bg-white/[0.02] rounded-lg border border-white/5">
                <p className="text-xs text-gray-500 leading-relaxed">
                  This affects future behavior only. Your money stays available — 
                  sends and withdrawals are never blocked. Nothing is locked.
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="p-4 space-y-2">
              {comfortLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelected(level.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    selected === level.id
                      ? "bg-white/[0.04] border-white/20"
                      : "bg-white/[0.01] border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{level.name}</span>
                      {level.isRecommended && (
                        <span className="px-2 py-0.5 text-[10px] text-emerald-500/80 bg-emerald-500/10 rounded-full">
                          Recommended
                        </span>
                      )}
                      {level.id === currentLevel && level.id !== selected && (
                        <span className="px-2 py-0.5 text-[10px] text-gray-500 bg-white/5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected === level.id ? "border-white" : "border-white/20"
                    }`}>
                      {selected === level.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-3">{level.intent}</p>
                  
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-600">{level.riskPosture}</p>
                    <p className="text-xs text-gray-500 italic">{level.forWho}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Tradeoff reminder */}
            <div className="px-6 pb-2">
              <p className="text-[11px] text-gray-600 text-center">
                More growth means more fluctuation. More stability means lower upside.
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 pt-2 border-t border-white/5">
              {hasChanged ? (
                <button
                  onClick={() => setStep("confirm")}
                  className="w-full py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-white/5 text-gray-400 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Close
                </button>
              )}
              
              {/* Advanced link - de-emphasized */}
              <p className="text-center mt-4">
                <button className="text-[11px] text-gray-600 hover:text-gray-500 transition-colors cursor-pointer">
                  Need more control? Advanced options →
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation Step */}
            <div className="p-6">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-white mb-2">
                  Confirm your choice
                </h2>
              </div>

              {/* Summary */}
              <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">New setting</span>
                  <span className="text-sm text-white font-medium">{selectedLevel.name}</span>
                </div>
                <p className="text-sm text-gray-400">{selectedLevel.intent}</p>
              </div>

              {/* Reassurances */}
              <div className="space-y-2 mb-6">
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
                  Go back
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

