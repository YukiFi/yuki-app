"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";

// ============================================================================
// YIELD HISTORY - User's actual daily yield performance
// ============================================================================

const BRAND_LAVENDER = "#e1a8f0";

interface DayYield {
  date: Date;
  amount: number; // dollars earned
}

// Generate mock historical yield data based on balance
function generateYieldHistory(balance: number, days: number = 14): DayYield[] {
  const data: DayYield[] = [];
  const baseDaily = balance * (0.078 / 365); // 7.8% APY base
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Slight natural variance (±15%) to feel real
    const variance = 0.85 + Math.random() * 0.30;
    const amount = baseDaily * variance;
    
    data.push({ date, amount });
  }
  
  return data;
}

interface YieldHistoryChartProps {
  balance: number;
}

function YieldHistoryChart({ balance }: YieldHistoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const [data, setData] = useState<DayYield[]>([]);
  const initializedRef = useRef(false);
  
  useEffect(() => {
    if (balance > 0 && !initializedRef.current) {
      setData(generateYieldHistory(balance, 14));
      initializedRef.current = true;
    }
  }, [balance]);

  const maxYield = data.length > 0 ? Math.max(...data.map(d => d.amount)) : 1;
  const totalYield = data.reduce((sum, d) => sum + d.amount, 0);

  const chartHeight = 100;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get display values - either hovered day or today
  const displayIndex = hoveredIndex !== null ? hoveredIndex : data.length - 1;
  const displayData = data[displayIndex];

  if (data.length === 0) {
    return (
      <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <p className="text-white/50 text-xs sm:text-sm font-medium">Daily Yield</p>
        </div>
        <div className="flex items-end gap-1 sm:gap-1.5 h-20 sm:h-[100px]">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="flex-1 h-full flex items-end">
              <div className="w-full rounded-sm bg-white/[0.04]" style={{ height: '30%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <p className="text-white/50 text-xs sm:text-sm font-medium">Daily Yield</p>
        <p className="text-white/30 text-xs sm:text-sm tabular-nums" style={{ fontFeatureSettings: "'tnum' 1" }}>
          ${totalYield.toFixed(2)} · 14d
        </p>
      </div>

      {/* Selected day display */}
      <div className="mb-4 sm:mb-6">
        <p 
          className="text-xl sm:text-2xl font-medium tabular-nums mb-0.5 sm:mb-1"
          style={{ color: BRAND_LAVENDER, fontFeatureSettings: "'tnum' 1" }}
        >
          +${displayData?.amount.toFixed(2) || '0.00'}
        </p>
        <p className="text-white/40 text-xs sm:text-sm">
          {displayData ? formatDate(displayData.date) : '—'}
          {hoveredIndex === null && displayData && ' (today)'}
        </p>
      </div>

      {/* Chart - touch-friendly on mobile */}
      <div 
        className="flex items-end gap-1 sm:gap-1.5 h-20 sm:h-[100px] touch-pan-x"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const target = e.currentTarget;
          const rect = target.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const barWidth = rect.width / 14;
          const index = Math.min(13, Math.max(0, Math.floor(x / barWidth)));
          setHoveredIndex(index);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const target = e.currentTarget;
          const rect = target.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const barWidth = rect.width / 14;
          const index = Math.min(13, Math.max(0, Math.floor(x / barWidth)));
          setHoveredIndex(index);
        }}
        onTouchEnd={() => setHoveredIndex(null)}
      >
        {data.map((day, index) => {
          const heightPercent = Math.max((day.amount / maxYield) * 100, 10);
          const isHovered = hoveredIndex === index;
          const isToday = index === data.length - 1;
          const isActive = isHovered || (hoveredIndex === null && isToday);

          return (
            <div
              key={index}
              className="flex-1 h-full flex items-end"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="w-full rounded-sm transition-all duration-100"
                style={{ 
                  height: `${heightPercent}%`,
                  backgroundColor: isActive ? BRAND_LAVENDER : 'rgba(255,255,255,0.08)',
                  opacity: isActive ? 1 : (hoveredIndex !== null ? 0.5 : 1)
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-3 sm:mt-4 text-white/30 text-[10px] sm:text-xs">
        <span>14d ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL SYSTEM - Premium, minimal, intentional
// ============================================================================

// Format phone number with (xxx) xxx-xxxx pattern
function formatPhoneDisplay(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  } else {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  }
}

// Check if user exists via API - uses Clerk backend
async function checkUserExists(
  identifier: string, 
  mode: "phone" | "username",
  countryCode: string = "+1"
): Promise<boolean> {
  try {
    let formattedIdentifier = identifier;
    
    if (mode === "phone") {
      const digits = identifier.replace(/\D/g, "");
      const countryDigits = countryCode.replace(/\D/g, "");
      formattedIdentifier = `+${countryDigits}${digits}`;
    }

    const response = await fetch("/api/user/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: formattedIdentifier, type: mode }),
    });

    if (!response.ok) return true;
    const data = await response.json();
    return data.exists;
  } catch {
    return true;
  }
}

// ============================================================================
// SEND MODAL - "I'm moving my money confidently."
// ============================================================================

function SendModal({ 
  open, 
  onClose,
  balance,
  currentUserPhone,
  currentUserUsername,
}: { 
  open: boolean; 
  onClose: () => void;
  balance: number;
  currentUserPhone: string;
  currentUserUsername: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [recipientMode, setRecipientMode] = useState<"phone" | "username">("username");
  const [countryCode, setCountryCode] = useState("+1");
  const [step, setStep] = useState<"compose" | "confirm" | "processing" | "success">("compose");
  const [recipientExists, setRecipientExists] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const recipientDigits = recipient.replace(/\D/g, "");
  const isRecipientValid = recipientMode === "phone" 
    ? recipientDigits.length >= 10
    : recipient.length >= 3;
  
  const fullRecipientPhone = recipientMode === "phone" 
    ? `${countryCode.replace(/\D/g, "")}${recipientDigits}` : "";
  
  const isSendingToSelf = isRecipientValid && (
    recipientMode === "phone"
      ? fullRecipientPhone === currentUserPhone
      : recipient.toLowerCase() === currentUserUsername.toLowerCase()
  );

  // Check recipient with timeout safety
  useEffect(() => {
    if (!isRecipientValid || isSendingToSelf) {
      setRecipientExists(null);
      setIsChecking(false);
      return;
    }
    
    setIsChecking(true);
    let cancelled = false;
    
    // Debounce the API call
    const debounceId = setTimeout(async () => {
      try {
        const exists = await checkUserExists(recipient, recipientMode, countryCode);
        if (!cancelled) {
          setRecipientExists(exists);
          setIsChecking(false);
        }
      } catch {
        if (!cancelled) {
          setRecipientExists(null);
          setIsChecking(false);
        }
      }
    }, 400);
    
    // Safety timeout - if still checking after 5s, give up
    const safetyId = setTimeout(() => {
      if (!cancelled) {
        setIsChecking(false);
      }
    }, 5000);
    
    return () => {
      cancelled = true;
      clearTimeout(debounceId);
      clearTimeout(safetyId);
    };
  }, [recipient, recipientMode, countryCode, isRecipientValid, isSendingToSelf]);

  // Reset when mode or country code changes
  useEffect(() => { 
    setRecipientExists(null);
    setIsChecking(false);
  }, [recipientMode, countryCode]);

  // Focus input on open
  useEffect(() => {
    if (open && step === "compose") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, step]);

  const hasError = isSendingToSelf || recipientExists === false;
  const remaining = balance - numericAmount;
  const canSend = numericAmount > 0 && numericAmount <= balance && isRecipientValid && !isSendingToSelf && recipientExists === true;
  const displayRecipient = recipientMode === "username" ? `@${recipient}` : `${countryCode} ${recipient}`;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(val);
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (recipientMode === "phone") {
      setRecipient(formatPhoneDisplay(e.target.value));
    } else {
      setRecipient(e.target.value.replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, ""));
    }
  };

  const handleConfirm = async () => {
    setStep("processing");
    
    // Simulate transaction processing (in production, this would be the actual blockchain tx)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock transaction hash
    const mockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    setTxHash(mockHash);
    
    setStep("success");
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setAmount("");
      setRecipient("");
      setRecipientMode("username");
      setCountryCode("+1");
      setStep("compose");
      setRecipientExists(null);
      setIsChecking(false);
      setTxHash(null);
      setShowAdvanced(false);
    }, 200);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={handleClose}
        >
          {/* Backdrop - simple dim */}
          <motion.div 
            className="absolute inset-0 bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-[440px] mx-0 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {step === "compose" && (
                <motion.div
                  key="compose"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  className="bg-black sm:bg-white/[0.03] rounded-t-3xl sm:rounded-3xl overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white/50 text-sm font-medium">Send to</p>
                      <button
                        onClick={handleClose}
                        className="text-white/30 hover:text-white/50 transition-colors cursor-pointer p-1 -mr-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Recipient input */}
                    <div className="flex items-center gap-1">
                      {recipientMode === "username" ? (
                        <span style={{ color: BRAND_LAVENDER }} className="text-xl sm:text-2xl font-medium">@</span>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-white/40 text-xl sm:text-2xl font-light">+</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={countryCode.replace(/^\+/, "")}
                            onChange={(e) => setCountryCode(`+${e.target.value.replace(/\D/g, "").slice(0, 3)}`)}
                            className="bg-transparent text-white/60 text-xl sm:text-2xl font-light w-8 focus:outline-none"
                            style={{ fontFeatureSettings: "'tnum' 1" }}
                            placeholder="1"
                          />
                        </div>
                      )}
                      <input
                        type="text"
                        inputMode={recipientMode === "phone" ? "tel" : "text"}
                        value={recipient}
                        onChange={handleRecipientChange}
                        placeholder={recipientMode === "phone" ? "(555) 123-4567" : "username"}
                        className="bg-transparent text-white text-xl sm:text-2xl font-light flex-1 focus:outline-none placeholder:text-white/25"
                      />
                    </div>
                    
                    {/* Status row */}
                    <div className="flex items-center justify-between mt-3 min-h-[20px]">
                      <div className="flex items-center gap-2">
                        {isChecking && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 text-white/40 text-xs"
                          >
                            <span className="w-3 h-3 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                            Checking...
                          </motion.div>
                        )}
                        {!isChecking && recipientExists === true && !isSendingToSelf && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-1.5 text-emerald-400 text-xs"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Found
                          </motion.div>
                        )}
                        {!isChecking && hasError && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-400 text-xs"
                          >
                            {isSendingToSelf ? "Can't send to yourself" : "User not found"}
                          </motion.p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setRecipientMode(recipientMode === "phone" ? "username" : "phone");
                          setRecipient("");
                        }}
                        className="text-white/40 hover:text-white/60 text-xs transition-colors cursor-pointer"
                      >
                        {recipientMode === "phone" ? "use @username" : "use phone"}
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="px-6 sm:px-8 py-8 sm:py-10">
                    <div className="flex items-baseline">
                      <span style={{ color: BRAND_LAVENDER }} className="text-4xl sm:text-5xl font-light">$</span>
                      <input
                        ref={inputRef}
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="bg-transparent text-white text-4xl sm:text-5xl font-light w-full focus:outline-none placeholder:text-white/20"
                        style={{ fontFeatureSettings: "'tnum' 1" }}
                      />
                    </div>
                    
                    <div className="mt-4">
                      <span className="text-white/40 text-sm">
                        Balance: ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="px-6 sm:px-8 pb-8 sm:pb-8">
                    <button
                      onClick={() => canSend && setStep("confirm")}
                      disabled={!canSend}
                      className={`
                        w-full py-4 rounded-xl sm:rounded-2xl text-base font-medium transition-all duration-150 cursor-pointer touch-manipulation
                        ${canSend 
                          ? "bg-white text-black active:scale-[0.98]" 
                          : hasError
                            ? "bg-red-500/10 text-red-400"
                            : "bg-white/[0.05] text-white/30"
                        }
                      `}
                    >
                      {canSend 
                        ? "Continue" 
                        : hasError 
                          ? "Can't send" 
                          : numericAmount > 0 && !isRecipientValid
                            ? recipientMode === "phone" ? "Enter phone" : "Enter username"
                            : "Enter amount"
                      }
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "confirm" && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="bg-black sm:bg-white/[0.03] rounded-t-3xl sm:rounded-3xl overflow-hidden"
                >
                  <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-6">
                    {/* Header with back button */}
                    <div className="flex items-center justify-between mb-6">
                      <button
                        onClick={() => setStep("compose")}
                        className="text-white/40 hover:text-white/60 transition-colors cursor-pointer p-1 -ml-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <button
                        onClick={handleClose}
                        className="text-white/30 hover:text-white/50 transition-colors cursor-pointer p-1 -mr-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Confirmation display */}
                    <div className="text-center py-6">
                      <p className="text-white/50 text-sm font-medium mb-3">Sending</p>
                      <p 
                        className="text-4xl sm:text-5xl font-light text-white mb-3"
                        style={{ fontFeatureSettings: "'tnum' 1" }}
                      >
                        <span style={{ color: BRAND_LAVENDER }}>$</span>
                        {numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-white/50 text-base">
                        to <span className="text-white/80">{displayRecipient}</span>
                      </p>
                    </div>

                    {/* Details */}
                    <div className="py-4 space-y-3 bg-white/[0.03] rounded-xl px-4 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-sm">Network fee</span>
                        <span className="text-white/60 text-sm">$0.00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-sm">New balance</span>
                        <span className="text-white/80 text-sm tabular-nums" style={{ fontFeatureSettings: "'tnum' 1" }}>
                          ${remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Confirm button */}
                    <button
                      onClick={handleConfirm}
                      className="w-full py-4 rounded-xl sm:rounded-2xl text-base font-medium bg-white text-black cursor-pointer active:scale-[0.98] transition-all duration-150 touch-manipulation"
                    >
                      Confirm & Send
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-black sm:bg-white/[0.03] rounded-t-3xl sm:rounded-3xl overflow-hidden py-12 sm:py-16 px-6 sm:px-8"
                >
                  <div className="text-center">
                    {/* Spinner */}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                      <div className="absolute inset-0 rounded-full border-2 border-white/[0.08]" />
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-transparent"
                        style={{ borderTopColor: BRAND_LAVENDER }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    
                    <p className="text-white text-lg font-medium mb-1">Sending...</p>
                    <p className="text-white/40 text-sm mb-6">Confirming on Base</p>
                    
                    <p 
                      className="text-2xl font-light text-white"
                      style={{ fontFeatureSettings: "'tnum' 1" }}
                    >
                      <span style={{ color: BRAND_LAVENDER }}>$</span>
                      {numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-white/40 text-sm mt-1">to {displayRecipient}</p>
                  </div>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-black sm:bg-white/[0.03] rounded-t-3xl sm:rounded-3xl overflow-hidden py-10 sm:py-12 px-6 sm:px-8"
                >
                  <div className="text-center">
                    {/* Success checkmark */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                      className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5"
                    >
                      <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                    
                    <p className="text-white text-lg font-medium mb-1">Sent successfully</p>
                    <p className="text-white/50 text-sm mb-6">
                      ${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} to {displayRecipient}
                    </p>

                    {/* Transaction details */}
                    <div className="py-3 space-y-2 bg-white/[0.03] rounded-xl px-4 text-left mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-sm">Status</span>
                        <span className="text-emerald-400 text-sm flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Confirmed
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-sm">Network</span>
                        <span className="text-white/60 text-sm">Base</span>
                      </div>
                      {txHash && (
                        <div className="flex items-center justify-between">
                          <span className="text-white/40 text-sm">Transaction</span>
                          <a
                            href={`https://basescan.org/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/50 hover:text-white/70 text-sm font-mono transition-colors"
                          >
                            {txHash.slice(0, 6)}...{txHash.slice(-4)}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Done button */}
                    <button
                      onClick={handleClose}
                      className="w-full py-4 rounded-xl sm:rounded-2xl text-base font-medium bg-white text-black cursor-pointer active:scale-[0.98] transition-all duration-150 touch-manipulation"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// REQUEST MODAL - "This is simple. This is safe."
// ============================================================================

function RequestModal({ 
  open, 
  onClose,
  userIdentifier,
  currentUserPhone,
  currentUserUsername,
}: { 
  open: boolean; 
  onClose: () => void;
  userIdentifier: string;
  currentUserPhone: string;
  currentUserUsername: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState("");
  const [fromMode, setFromMode] = useState<"phone" | "username">("username");
  const [fromCountryCode, setFromCountryCode] = useState("+1");
  const [step, setStep] = useState<"compose" | "confirm" | "success">("compose");
  const [fromExists, setFromExists] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const fromDigits = from.replace(/\D/g, "");
  const isFromValid = fromMode === "phone" ? fromDigits.length >= 10 : from.length >= 3;
  
  const fullFromPhone = fromMode === "phone" 
    ? `${fromCountryCode.replace(/\D/g, "")}${fromDigits}` : "";
  
  const isRequestingFromSelf = isFromValid && (
    fromMode === "phone"
      ? fullFromPhone === currentUserPhone
      : from.toLowerCase() === currentUserUsername.toLowerCase()
  );

  // Check "from" user with timeout safety
  useEffect(() => {
    if (!isFromValid || isRequestingFromSelf) {
      setFromExists(null);
      setIsChecking(false);
      return;
    }
    
    setIsChecking(true);
    let cancelled = false;
    
    // Debounce the API call
    const debounceId = setTimeout(async () => {
      try {
        const exists = await checkUserExists(from, fromMode, fromCountryCode);
        if (!cancelled) {
          setFromExists(exists);
          setIsChecking(false);
        }
      } catch {
        if (!cancelled) {
          setFromExists(null);
          setIsChecking(false);
        }
      }
    }, 400);
    
    // Safety timeout - if still checking after 5s, give up
    const safetyId = setTimeout(() => {
      if (!cancelled) {
        setIsChecking(false);
      }
    }, 5000);
    
    return () => {
      cancelled = true;
      clearTimeout(debounceId);
      clearTimeout(safetyId);
    };
  }, [from, fromMode, fromCountryCode, isFromValid, isRequestingFromSelf]);

  // Reset when mode or country code changes
  useEffect(() => { 
    setFromExists(null);
    setIsChecking(false);
  }, [fromMode, fromCountryCode]);

  useEffect(() => {
    if (open && step === "compose") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, step]);

  const hasFromError = isRequestingFromSelf || fromExists === false;
  const hasSpecificFrom = from.length > 0 && isFromValid;
  const canRequest = numericAmount > 0 && (!hasSpecificFrom || (fromExists === true && !isRequestingFromSelf));
  const displayFrom = from ? (fromMode === "username" ? `@${from}` : `${fromCountryCode} ${from}`) : "Anyone";

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(val);
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (fromMode === "phone") {
      setFrom(formatPhoneDisplay(e.target.value));
    } else {
      setFrom(e.target.value.replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, ""));
    }
  };

  const handleConfirm = () => {
    setStep("success");
    setTimeout(() => handleClose(), 1800);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setAmount("");
      setFrom("");
      setFromMode("username");
      setFromCountryCode("+1");
      setStep("compose");
      setFromExists(null);
      setIsChecking(false);
    }, 200);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={handleClose}
        >
          <motion.div 
            className="absolute inset-0 bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-[440px] mx-0 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {step === "compose" && (
                <motion.div
                  key="compose"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  className="bg-black sm:bg-white/[0.03] rounded-t-3xl sm:rounded-3xl overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white/50 text-sm font-medium">Request</p>
                      <button
                        onClick={handleClose}
                        className="text-white/30 hover:text-white/50 transition-colors cursor-pointer p-1 -mr-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="px-6 sm:px-8 py-6 sm:py-8">
                    <div className="flex items-baseline">
                      <span style={{ color: BRAND_LAVENDER }} className="text-4xl sm:text-5xl font-light">$</span>
                      <input
                        ref={inputRef}
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="bg-transparent text-white text-4xl sm:text-5xl font-light w-full focus:outline-none placeholder:text-white/20"
                        style={{ fontFeatureSettings: "'tnum' 1" }}
                      />
                    </div>
                  </div>

                  {/* From - optional */}
                  <div className="px-6 sm:px-8 pb-4">
                    <p className="text-white/40 text-sm font-medium mb-3">From (optional)</p>
                    
                    <div className="flex items-center gap-1">
                      {fromMode === "username" ? (
                        <span style={{ color: BRAND_LAVENDER }} className="text-lg font-medium">@</span>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-white/40 text-lg">+</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={fromCountryCode.replace(/^\+/, "")}
                            onChange={(e) => setFromCountryCode(`+${e.target.value.replace(/\D/g, "").slice(0, 3)}`)}
                            className="bg-transparent text-white/60 text-lg w-8 focus:outline-none"
                            style={{ fontFeatureSettings: "'tnum' 1" }}
                            placeholder="1"
                          />
                        </div>
                      )}
                      <input
                        type="text"
                        inputMode={fromMode === "phone" ? "tel" : "text"}
                        value={from}
                        onChange={handleFromChange}
                        placeholder={fromMode === "phone" ? "(555) 123-4567" : "anyone"}
                        className="flex-1 bg-transparent text-white text-lg focus:outline-none placeholder:text-white/25"
                      />
                    </div>
                    
                    {/* Status row */}
                    <div className="flex items-center justify-between mt-3 min-h-[20px]">
                      <div className="flex items-center gap-2">
                        {isChecking && hasSpecificFrom && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 text-white/40 text-xs"
                          >
                            <span className="w-3 h-3 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                            Checking...
                          </motion.div>
                        )}
                        {!isChecking && fromExists === true && !isRequestingFromSelf && hasSpecificFrom && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-1.5 text-emerald-400 text-xs"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Found
                          </motion.div>
                        )}
                        {!isChecking && hasFromError && hasSpecificFrom && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-400 text-xs"
                          >
                            {isRequestingFromSelf ? "Can't request from yourself" : "User not found"}
                          </motion.p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setFromMode(fromMode === "phone" ? "username" : "phone");
                          setFrom("");
                        }}
                        className="text-white/40 hover:text-white/60 text-xs transition-colors cursor-pointer"
                      >
                        {fromMode === "phone" ? "use @username" : "use phone"}
                      </button>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="px-6 sm:px-8 pb-8 pt-4">
                    <button
                      onClick={() => canRequest && setStep("confirm")}
                      disabled={!canRequest}
                      className={`
                        w-full py-4 rounded-xl sm:rounded-2xl text-base font-medium transition-all duration-150 cursor-pointer touch-manipulation
                        ${canRequest 
                          ? "bg-white text-black active:scale-[0.98]" 
                          : hasFromError
                            ? "bg-red-500/10 text-red-400"
                            : "bg-white/[0.05] text-white/30"
                        }
                      `}
                    >
                      {canRequest 
                        ? "Continue" 
                        : hasFromError && hasSpecificFrom
                          ? "Can't request"
                          : "Enter amount"
                      }
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "confirm" && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="bg-black sm:bg-white/[0.03] rounded-t-3xl sm:rounded-3xl overflow-hidden"
                >
                  <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-6">
                    <div className="flex items-center justify-between mb-6">
                      <button
                        onClick={() => setStep("compose")}
                        className="text-white/40 hover:text-white/60 transition-colors cursor-pointer p-1 -ml-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <button
                        onClick={handleClose}
                        className="text-white/30 hover:text-white/50 transition-colors cursor-pointer p-1 -mr-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="text-center py-6">
                      <p className="text-white/50 text-sm font-medium mb-3">Requesting</p>
                      <p 
                        className="text-4xl sm:text-5xl font-light text-white mb-3"
                        style={{ fontFeatureSettings: "'tnum' 1" }}
                      >
                        <span style={{ color: BRAND_LAVENDER }}>$</span>
                        {numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-white/50 text-base">
                        from <span className="text-white/80">{displayFrom}</span>
                      </p>
                    </div>

                    <button
                      onClick={handleConfirm}
                      className="w-full py-4 rounded-xl sm:rounded-2xl text-base font-medium bg-white text-black cursor-pointer active:scale-[0.98] transition-all duration-150 touch-manipulation"
                    >
                      Send Request
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-black sm:bg-white/[0.03] rounded-t-3xl sm:rounded-3xl overflow-hidden py-10 sm:py-12 px-6 sm:px-8"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                      style={{ backgroundColor: `${BRAND_LAVENDER}15` }}
                    >
                      <svg 
                        className="w-8 h-8"
                        style={{ color: BRAND_LAVENDER }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </motion.div>
                    
                    <p className="text-white text-lg font-medium mb-1">Request Sent</p>
                    <p className="text-white/50 text-sm">
                      ${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} from {displayFrom}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Dashboard() {
  const { user } = useUser();
  const [balance, setBalance] = useState<number | null>(null);
  const [todayYield, setTodayYield] = useState(0);
  const [sendOpen, setSendOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  // Extract user's phone and username from Clerk
  const currentUserPhone = user?.primaryPhoneNumber?.phoneNumber?.replace(/\D/g, "") || "";
  const currentUserUsername = user?.username || "";
  const userIdentifier = currentUserUsername ? `@${currentUserUsername}` : currentUserPhone ? `+1${currentUserPhone.slice(-10)}` : "user";

  useEffect(() => {
    const stored = localStorage.getItem("yuki_balance");
    const initial = stored ? parseFloat(stored) : 12438.72;
    setBalance(initial);
      localStorage.setItem("yuki_balance", initial.toString());
    
    // Today's yield at 7.8% APY
    setTodayYield(initial * (0.078 / 365));
  }, []);

  // Split balance for typography control
  const [dollars, cents] = balance !== null 
    ? balance.toFixed(2).split(".") 
    : ["0", "00"];
  const formattedDollars = parseInt(dollars).toLocaleString("en-US");
  
  // Show skeleton-like state while loading, but with stable layout
  const isReady = balance !== null;

  return (
    <>
      {/* 
        Dashboard Layout - Stable, immediate rendering
        No staggered animations - everything appears composed
        Layout is fixed - no shifts during hydration
      */}
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center px-4 sm:px-8 lg:px-12 py-6 sm:py-10 lg:py-16">
        <div className="w-full max-w-[1100px]">
        
        {/* Page Title */}
        <h1 className="text-lg sm:text-xl lg:text-2xl text-white mb-6 sm:mb-8">
          Dashboard
        </h1>

        {/* Hero Balance Section */}
        <div 
          className="transition-opacity duration-200"
          style={{ opacity: isReady ? 1 : 0.5 }}
        >
          {/* Balance Card */}
          <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-5 py-6 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
              {/* Top row with label and status */}
              <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
                <p className="text-white/50 text-xs sm:text-sm font-medium">
                  Total Balance
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span 
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                    style={{ backgroundColor: BRAND_LAVENDER }}
                  />
                  <span className="text-white/50 text-[10px] sm:text-xs font-medium">7.8% APY</span>
                </div>
              </div>
              
              {/* The Balance */}
              <p
                className="text-[2.5rem] sm:text-[4rem] lg:text-[5.5rem] font-light text-white leading-none tracking-tight"
                style={{ fontFeatureSettings: "'tnum' 1" }}
              >
                <span style={{ color: BRAND_LAVENDER }}>$</span>
                {formattedDollars}
                <span className="text-white/30 text-[0.35em] font-normal ml-0.5 sm:ml-1">.{cents}</span>
              </p>

              {/* Bottom stats row - stacks on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 lg:gap-10 mt-6 sm:mt-8 lg:mt-10">
                <div>
                  <p className="text-emerald-400 text-base sm:text-lg font-medium tabular-nums mb-0.5 sm:mb-1" style={{ fontFeatureSettings: "'tnum' 1" }}>
                    +${todayYield.toFixed(2)}
                  </p>
                  <p className="text-white/40 text-xs sm:text-sm">Earned today</p>
                </div>
                <div>
                  <p className="text-white/80 text-base sm:text-lg font-medium tabular-nums mb-0.5 sm:mb-1" style={{ fontFeatureSettings: "'tnum' 1" }}>
                    ~${((balance || 0) * (0.078 / 12)).toFixed(2)}
                  </p>
                  <p className="text-white/40 text-xs sm:text-sm">Est. this month</p>
                </div>
              </div>
          </div>
        </div>

        {/* Yield History Section */}
        <div className="mt-6 sm:mt-10 lg:mt-16">
          <YieldHistoryChart balance={balance || 0} />
        </div>

        {/* Flexible spacer - pushes actions to bottom */}
        <div className="flex-1 min-h-8 sm:min-h-12 lg:min-h-16" />

        {/* 
          Action bar - Mobile-first grid layout
          Primary actions full width on mobile, inline on larger screens
        */}
        <div className="w-full">
          {/* Primary actions - Send & Request */}
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-3">
            <button
              onClick={() => setSendOpen(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3.5 sm:py-3 rounded-xl sm:rounded-full bg-white text-black text-sm sm:text-[13px] font-semibold cursor-pointer active:scale-[0.98] sm:active:scale-[0.985] transition-all duration-100 touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
              Send
            </button>

            <button
              onClick={() => setRequestOpen(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3.5 sm:py-3 rounded-xl sm:rounded-full bg-white/[0.08] text-white/80 text-sm sm:text-[13px] font-medium cursor-pointer active:scale-[0.98] sm:active:scale-[0.985] transition-all duration-100 touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
              </svg>
              Request
            </button>

            {/* Separator - hidden on mobile */}
            <div className="hidden sm:block w-px h-4 bg-white/[0.08] mx-1" />

            {/* Tertiary actions - hidden on mobile, shown in second row */}
            <Link href="/deposit" className="hidden sm:block">
              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/[0.04] text-white/50 text-[13px] font-medium cursor-pointer hover:bg-white/[0.07] hover:text-white/75 active:scale-[0.985] transition-all duration-100">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add
              </div>
            </Link>

            <Link href="/withdraw" className="hidden sm:block">
              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/[0.04] text-white/50 text-[13px] font-medium cursor-pointer hover:bg-white/[0.07] hover:text-white/75 active:scale-[0.985] transition-all duration-100">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Withdraw
              </div>
            </Link>
          </div>

          {/* Secondary actions row - mobile only */}
          <div className="grid grid-cols-2 gap-3 mt-3 sm:hidden">
            <Link href="/deposit">
              <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.05] text-white/60 text-sm font-medium cursor-pointer active:scale-[0.98] transition-all duration-100 touch-manipulation">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add
              </div>
            </Link>

            <Link href="/withdraw">
              <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.05] text-white/60 text-sm font-medium cursor-pointer active:scale-[0.98] transition-all duration-100 touch-manipulation">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Withdraw
              </div>
            </Link>
          </div>
        </div>
        </div>
      </div>

      {/* Modals */}
      <SendModal 
        open={sendOpen} 
        onClose={() => setSendOpen(false)} 
        balance={balance ?? 0}
        currentUserPhone={currentUserPhone}
        currentUserUsername={currentUserUsername}
      />
      <RequestModal 
        open={requestOpen} 
        onClose={() => setRequestOpen(false)}
        userIdentifier={userIdentifier}
        currentUserPhone={currentUserPhone}
        currentUserUsername={currentUserUsername}
      />
    </>
  );
}
