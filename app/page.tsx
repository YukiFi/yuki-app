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
  const containerRef = useRef<HTMLDivElement>(null);
  
  const data = useRef(generateYieldHistory(balance, 14)).current;
  const maxYield = Math.max(...data.map(d => d.amount));
  const totalYield = data.reduce((sum, d) => sum + d.amount, 0);

  // Refined proportions - slightly narrower bars, more height
  const barWidth = 10;
  const barRadius = barWidth / 2;
  const barGap = 5;
  const chartHeight = 72;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDay = (date: Date) => {
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  return (
    <div
      ref={containerRef}
      className="w-full max-w-sm"
    >
      {/* Header row - refined typography */}
      <div className="flex items-baseline justify-between mb-5">
        <p className="text-white/25 text-[10px] uppercase tracking-[0.12em] font-medium">
          Daily yield
        </p>
        <p className="text-white/30 text-[11px] tabular-nums" style={{ fontFeatureSettings: "'tnum' 1" }}>
          ${totalYield.toFixed(2)} · 14 days
        </p>
      </div>

      {/* Hover tooltip - stable height prevents shift */}
      <div className="h-7 mb-3">
        {hoveredIndex !== null && (
          <div className="flex items-baseline gap-2">
            <span 
              className="text-base font-medium tabular-nums"
              style={{ color: BRAND_LAVENDER, fontFeatureSettings: "'tnum' 1" }}
            >
              +${data[hoveredIndex].amount.toFixed(2)}
            </span>
            <span className="text-white/35 text-xs">
              {formatDate(data[hoveredIndex].date)}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div 
        className="flex items-end gap-[5px]"
        style={{ height: chartHeight }}
      >
        {data.map((day, index) => {
          const heightPercent = (day.amount / maxYield) * 100;
          const isHovered = hoveredIndex === index;
          const isToday = index === data.length - 1;

  return (
            <div
              key={index}
              className="relative cursor-pointer"
              style={{ width: barWidth, height: '100%' }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Bar - renders immediately at full height */}
              <div
                className="absolute bottom-0 w-full"
                style={{ height: `${heightPercent}%` }}
              >
                <svg
                  width={barWidth}
                  height="100%"
                  className="overflow-visible"
                  style={{ display: 'block' }}
      >
        <defs>
                    <linearGradient id={`yield-bar-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
                        stopColor={isToday ? BRAND_LAVENDER : "white"} 
                        stopOpacity={isToday ? 0.9 : 0.25} 
            />
            <stop
              offset="100%"
                        stopColor={isToday ? BRAND_LAVENDER : "white"} 
                        stopOpacity={isToday ? 0.5 : 0.08} 
            />
          </linearGradient>
        </defs>
                  <rect
                    x="0"
                    y="0"
                    width={barWidth}
                    height="100%"
                    rx={barRadius}
                    ry={barRadius}
                    fill={`url(#yield-bar-${index})`}
                    style={{
                      filter: isHovered ? 'brightness(1.3)' : 'brightness(1)',
                      transition: 'filter 0.1s ease'
                    }}
        />
      </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Time labels - minimal, precise */}
      <div className="flex justify-between mt-4">
        <span className="text-white/20 text-[10px] tracking-wide">
          {formatDay(data[0].date)}
        </span>
        <span className="text-white/25 text-[10px] tracking-wide">
          Today
        </span>
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
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={handleClose}
        >
          {/* Backdrop with blur */}
          <motion.div 
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[440px] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {step === "compose" && (
                <motion.div
                  key="compose"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#121215] rounded-[28px] overflow-hidden"
                >
                  {/* Header - asymmetric, title left-aligned */}
                  <div className="px-8 pt-8 pb-4">
                    <p className="text-white/50 text-xs uppercase tracking-[0.2em] mb-1">Send to</p>
                    {/* Recipient inline - feels integrated, not a form */}
                    <div className="flex items-center gap-1">
                      {recipientMode === "username" ? (
                        <span className="text-white/40 text-2xl font-light">@</span>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-white/40 text-2xl font-light">+</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={countryCode.replace(/^\+/, "")}
                            onChange={(e) => setCountryCode(`+${e.target.value.replace(/\D/g, "").slice(0, 3)}`)}
                            className="bg-transparent text-white/50 text-2xl font-light w-8 focus:outline-none"
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
                        className="bg-transparent text-white text-2xl font-light w-48 focus:outline-none placeholder:text-white/30"
                      />
                    </div>
                    {/* Status / Error / Mode toggle row */}
                    <div className="flex items-center justify-between mt-2 min-h-[20px]">
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
                            initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
                            className="text-red-400 text-xs"
                          >
                            {isSendingToSelf ? "Can't send to yourself" : "User not found"}
                          </motion.p>
                        )}
                      </div>
                      {/* Mode toggle - minimal, bottom right of this section */}
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

                  {/* Amount - the hero, massive and confident */}
                  <div className="px-8 py-12">
                    <div className="flex items-baseline">
                      <span className="text-white/30 text-7xl sm:text-8xl font-extralight">$</span>
                      <input
                        ref={inputRef}
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="bg-transparent text-white text-7xl sm:text-8xl font-extralight w-full focus:outline-none placeholder:text-white/25 caret-white/50"
                        style={{ fontFeatureSettings: "'tnum' 1", caretColor: BRAND_LAVENDER }}
                      />
                    </div>
                    
                    {/* Current balance - subtle, integrated */}
                    <div className="mt-6">
                      <span className="text-white/40 text-sm">
                        Balance: ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Action - full width, decisive */}
                  <div className="px-8 pb-8">
                    <motion.button
                      onClick={() => canSend && setStep("confirm")}
                      disabled={!canSend}
                      className={`
                        w-full py-5 rounded-2xl text-base font-medium transition-all duration-300 cursor-pointer
                        ${canSend 
                          ? "bg-white text-black" 
                          : hasError
                            ? "bg-red-500/15 text-red-400"
                            : "bg-white/[0.06] text-white/30"
                        }
                      `}
                      whileHover={canSend ? { scale: 1.01, backgroundColor: "#f0f0f0" } : {}}
                      whileTap={canSend ? { scale: 0.99 } : {}}
                    >
                      {canSend 
                        ? "Continue" 
                        : hasError 
                          ? "Can't send" 
                          : numericAmount > 0 && !isRecipientValid
                            ? recipientMode === "phone" ? "Enter phone" : "Enter username"
                            : "Enter amount"
                      }
                    </motion.button>
                  </div>

                  {/* Dismiss - text only, bottom right */}
                  <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 text-white/30 hover:text-white/50 transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              )}

              {step === "confirm" && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#121215] rounded-[28px] overflow-hidden"
                >
                  <div className="px-8 pt-8 pb-10">
                    {/* Back button */}
                    <button
                      onClick={() => setStep("compose")}
                      className="text-white/40 hover:text-white/60 transition-colors mb-8 -ml-1 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>

                    {/* Confirmation display - confident, clear */}
                    <div className="text-center py-8">
                      <p className="text-white/50 text-xs uppercase tracking-[0.2em] mb-4">You're sending</p>
                      <p 
                        className="text-6xl sm:text-7xl font-extralight text-white mb-4"
                        style={{ fontFeatureSettings: "'tnum' 1" }}
                      >
                        <span className="text-white/40">$</span>
                        {numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-white/50 text-lg">
                        to <span className="text-white/80">{displayRecipient}</span>
                      </p>
                    </div>

                    {/* Details - minimal, no boxes */}
                    <div className="py-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/45 text-sm">Network fee</span>
                        <span className="text-white/60 text-sm">$0.00</span>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                      <div className="flex items-center justify-between">
                        <span className="text-white/45 text-sm">New balance</span>
                        <span className="text-white/80 text-sm tabular-nums" style={{ fontFeatureSettings: "'tnum' 1" }}>
                          ${remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Confirm action */}
                  <div className="px-8 pb-8">
                    <motion.button
                      onClick={handleConfirm}
                      className="w-full py-5 rounded-2xl text-base font-medium bg-white text-black cursor-pointer"
                      whileHover={{ scale: 1.01, backgroundColor: "#f0f0f0" }}
                      whileTap={{ scale: 0.99 }}
                    >
                      Confirm & Send
                    </motion.button>
                  </div>

                  <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 text-white/30 hover:text-white/50 transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              )}

              {step === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#121215] rounded-[28px] overflow-hidden py-16 px-8"
                >
                  <div className="text-center">
                    {/* Animated spinner */}
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                      {/* Outer ring */}
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-white/[0.08]"
                      />
                      {/* Spinning arc */}
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/50"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      {/* Inner pulse */}
                      <motion.div
                        className="w-3 h-3 rounded-full bg-white/30"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                    
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-white text-xl font-medium mb-2"
                    >
                      Sending...
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-white/40 text-sm"
                    >
                      Confirming on Base
                    </motion.p>
                    
                    {/* Amount being sent */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-8 py-4"
                    >
                      <p className="text-white/50 text-sm mb-1">Sending</p>
                      <p className="text-white text-2xl font-light" style={{ fontFeatureSettings: "'tnum' 1" }}>
                        ${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-white/40 text-sm mt-1">to {displayRecipient}</p>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#121215] rounded-[28px] overflow-hidden py-12 px-8"
                >
                  <div className="text-center">
                    {/* Success checkmark with animation */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                      className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6"
                    >
                      <motion.svg
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="w-10 h-10 text-emerald-400"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <motion.path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </motion.svg>
                    </motion.div>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-white text-xl font-medium mb-1"
                    >
                      Sent successfully
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-white/50 text-base mb-6"
                    >
                      ${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} to {displayRecipient}
                    </motion.p>

                    {/* Transaction details */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="py-4 space-y-3 text-left"
                    >
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
                    </motion.div>

                    {/* Advanced section */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="mt-4"
                    >
                      <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-white/30 hover:text-white/50 text-xs transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                      >
                        Advanced
                        <svg 
                          className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showAdvanced && txHash && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 space-y-3 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white/40 text-sm">Transaction</span>
                            <span className="text-white/50 text-sm font-mono">
                              {txHash.slice(0, 6)}...{txHash.slice(-4)}
                            </span>
                          </div>
                          <a
                            href={`https://basescan.org/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 text-white/40 hover:text-white/60 text-sm transition-colors py-2"
                          >
                            View on Basescan
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Done button */}
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      onClick={handleClose}
                      className="w-full mt-6 py-4 rounded-2xl text-base font-medium bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
                    >
                      Done
                    </motion.button>
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
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={handleClose}
        >
          <motion.div 
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[440px] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {step === "compose" && (
                <motion.div
                  key="compose"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#121215] rounded-[28px] overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-8 pt-8 pb-2">
                    <p className="text-white/50 text-xs uppercase tracking-[0.2em]">Request</p>
                </div>

                  {/* Amount - the hero */}
                  <div className="px-8 py-10">
                    <div className="flex items-baseline">
                      <span className="text-white/30 text-7xl sm:text-8xl font-extralight">$</span>
                      <input
                        ref={inputRef}
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="bg-transparent text-white text-7xl sm:text-8xl font-extralight w-full focus:outline-none placeholder:text-white/25 caret-white/50"
                        style={{ fontFeatureSettings: "'tnum' 1", caretColor: BRAND_LAVENDER }}
                      />
                    </div>
                  </div>

                  {/* From - optional, subtle */}
                  <div className="px-8 pb-4">
                    <p className="text-white/45 text-xs uppercase tracking-[0.15em] mb-3">From</p>
                    
                    <div className="flex items-center gap-1">
                      {fromMode === "username" ? (
                        <span className="text-white/40 text-lg">@</span>
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
                        className="flex-1 bg-transparent text-white/80 text-lg focus:outline-none placeholder:text-white/30"
                      />
                    </div>
                    
                    {/* Status / Error / Mode toggle row */}
                    <div className="flex items-center justify-between mt-2 min-h-[20px]">
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
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
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
                  <div className="px-8 py-8">
                    <motion.button
                      onClick={() => canRequest && setStep("confirm")}
                      disabled={!canRequest}
                      className={`
                        w-full py-5 rounded-2xl text-base font-medium transition-all duration-300 cursor-pointer
                        ${canRequest 
                          ? "bg-white text-black" 
                          : hasFromError
                            ? "bg-red-500/15 text-red-400"
                            : "bg-white/[0.06] text-white/30"
                        }
                      `}
                      whileHover={canRequest ? { scale: 1.01, backgroundColor: "#f0f0f0" } : {}}
                      whileTap={canRequest ? { scale: 0.99 } : {}}
                    >
                      {canRequest 
                        ? "Continue" 
                        : hasFromError && hasSpecificFrom
                          ? "Can't request"
                          : "Enter amount"
                      }
                    </motion.button>
                  </div>

                  <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 text-white/30 hover:text-white/50 transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              )}

              {step === "confirm" && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#121215] rounded-[28px] overflow-hidden"
                >
                  <div className="px-8 pt-8 pb-10">
                    <button
                      onClick={() => setStep("compose")}
                      className="text-white/40 hover:text-white/60 transition-colors mb-8 -ml-1 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>

                    <div className="text-center py-8">
                      <p className="text-white/50 text-xs uppercase tracking-[0.2em] mb-4">Requesting</p>
                      <p 
                        className="text-6xl sm:text-7xl font-extralight text-white mb-4"
                        style={{ fontFeatureSettings: "'tnum' 1" }}
                      >
                        <span className="text-white/40">$</span>
                        {numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-white/50 text-lg">
                        from <span className="text-white/80">{displayFrom}</span>
                </p>
              </div>
            </div>

                  <div className="px-8 pb-8">
                    <motion.button
                      onClick={handleConfirm}
                      className="w-full py-5 rounded-2xl text-base font-medium bg-white text-black cursor-pointer"
                      whileHover={{ scale: 1.01, backgroundColor: "#f0f0f0" }}
                      whileTap={{ scale: 0.99 }}
                    >
                      Send Request
                    </motion.button>
            </div>

                  <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 text-white/30 hover:text-white/50 transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
                  </button>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#121215] rounded-[28px] overflow-hidden py-16 px-8"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                      className="w-20 h-20 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-8"
                    >
                      <motion.svg
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="w-10 h-10 text-white/80"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </motion.svg>
                    </motion.div>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-white text-xl font-medium mb-2"
                    >
                      Request Sent
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-white/50 text-base"
                    >
                      ${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} from {displayFrom}
                    </motion.p>
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
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col px-6 sm:px-12 lg:px-12 py-12 sm:py-16 lg:py-20">
        
        {/* 
          Primary hierarchy: The balance.
          No entrance animation - immediately composed
          Opacity transition for data loading only
        */}
        <div 
          className="transition-opacity duration-200"
          style={{ opacity: isReady ? 1 : 0.5 }}
        >
          {/* Label - subtle, uppercase, generous letter-spacing */}
          <p className="text-white/35 text-[11px] uppercase tracking-[0.15em] mb-3">
            Total balance
          </p>
          
          {/* 
            The number - hero element
            Fixed height prevents layout shift
          */}
          <h1
            className="text-[3.5rem] sm:text-[5rem] lg:text-[6.5rem] xl:text-[7.5rem] font-extralight text-white leading-[0.9] tracking-[-0.03em]"
            style={{ fontFeatureSettings: "'tnum' 1" }}
          >
            <span className="text-white/30">$</span>
            {formattedDollars}
            <span className="text-white/25 text-[0.35em] font-light ml-0.5">.{cents}</span>
          </h1>

          {/* Yield indicator - whispered context */}
          <div className="mt-5 flex items-center gap-2">
            <span className="text-white/20 text-sm font-normal tracking-wide">
              +${todayYield.toFixed(2)} earned today
            </span>
          </div>
        </div>

        {/* 
          Yield history chart
          Renders immediately with stable dimensions
        */}
        <div className="mt-12 lg:mt-16">
          <div className="p-6 -ml-6 rounded-2xl">
            <YieldHistoryChart balance={balance || 0} />
          </div>
        </div>

        {/* Flexible spacer - pushes actions to bottom */}
        <div className="flex-1 min-h-16" />

        {/* 
          Action bar - No entrance animations
          Buttons use CSS transitions for hover states only
        */}
        <div className="flex items-center gap-3">
          {/* Primary action - Send */}
          <button
            onClick={() => setSendOpen(true)}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-[#0f0f12] text-[13px] font-semibold cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:bg-[#f5f5f5] active:scale-[0.985] transition-all duration-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
            Send
          </button>

          {/* Secondary action - Request */}
          <button
            onClick={() => setRequestOpen(true)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-white/[0.05] text-white/60 text-[13px] font-medium cursor-pointer hover:bg-white/[0.08] hover:text-white/85 active:scale-[0.985] transition-all duration-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
            </svg>
            Request
          </button>

          {/* Visual separator - refined */}
          <div className="w-px h-4 bg-white/[0.08] mx-1" />

          {/* Tertiary actions - Add & Withdraw */}
          <Link href="/deposit">
            <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/[0.04] text-white/50 text-[13px] font-medium cursor-pointer hover:bg-white/[0.07] hover:text-white/75 active:scale-[0.985] transition-all duration-100">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add
            </div>
          </Link>

          <Link href="/withdraw">
            <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/[0.04] text-white/50 text-[13px] font-medium cursor-pointer hover:bg-white/[0.07] hover:text-white/75 active:scale-[0.985] transition-all duration-100">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Withdraw
            </div>
          </Link>
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
