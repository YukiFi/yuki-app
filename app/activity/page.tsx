"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSmartAccountClient } from "@account-kit/react";
import { useTransactionHistory, type Transaction, type TransactionType } from "@/lib/hooks/useTransactionHistory";

const BRAND_LAVENDER = "#e1a8f0";

// Group transactions by relative time periods
function groupTransactionsByDate(transactions: Transaction[]) {
  const groups: { [key: string]: Transaction[] } = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  transactions.forEach(tx => {
    const txDate = new Date(tx.timestamp);
    let key: string;

    if (txDate >= today) {
      key = "Today";
    } else if (txDate >= yesterday) {
      key = "Yesterday";
    } else if (txDate >= lastWeek) {
      key = "This Week";
    } else if (txDate >= lastMonth) {
      key = "This Month";
    } else {
      key = txDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });

  return groups;
}

function getTransactionIcon(type: TransactionType) {
  const baseClass = "w-5 h-5";

  switch (type) {
    case "sent":
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      );
    case "received":
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
        </svg>
      );
    case "deposit":
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
        </svg>
      );
    case "withdrawal":
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
        </svg>
      );
    case "yield":
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function TransactionRow({
  transaction,
  index
}: {
  transaction: Transaction;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const isPositive = transaction.amount > 0;
  const isYield = transaction.type === "yield";

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative py-4 sm:py-5 cursor-pointer"
    >
      {/* Hover background */}
      <motion.div
        className="absolute inset-x-0 inset-y-0 -mx-4 sm:-mx-5 rounded-2xl"
        initial={false}
        animate={{
          backgroundColor: isHovered ? "rgba(255,255,255,0.03)" : "transparent",
        }}
        transition={{ duration: 0.2 }}
      />

      <div className="relative flex items-center gap-3 sm:gap-4">
        {/* Icon */}
        <motion.div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: isYield
              ? `${BRAND_LAVENDER}15`
              : "rgba(255,255,255,0.05)",
            color: isYield
              ? BRAND_LAVENDER
              : isPositive
                ? "rgba(255,255,255,0.7)"
                : "rgba(255,255,255,0.4)"
          }}
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {getTransactionIcon(transaction.type)}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium text-sm sm:text-base truncate">
              {transaction.description}
            </p>
            {transaction.status === "pending" && (
              <span className="text-xs text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full">
                Pending
              </span>
            )}
          </div>
          <p className="text-white/30 text-xs sm:text-sm mt-0.5">
            {formatTime(transaction.timestamp)}
          </p>
        </div>

        {/* Amount */}
        <motion.div
          className="text-base sm:text-lg font-medium tabular-nums flex-shrink-0"
          style={{
            color: isYield
              ? BRAND_LAVENDER
              : isPositive
                ? "white"
                : "rgba(255,255,255,0.5)",
            fontFeatureSettings: "'tnum' 1"
          }}
          animate={{
            x: isHovered ? -4 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          {isPositive ? "+" : ""}
          ${Math.abs(transaction.amount).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </motion.div>

        {/* Arrow on hover */}
        <motion.div
          className="text-white/20 hidden sm:block"
          initial={{ opacity: 0, x: -10 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            x: isHovered ? 0 : -10
          }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const { client } = useSmartAccountClient({});
  const [filter, setFilter] = useState<"all" | "yield" | "transfers">("all");

  // Get wallet address from smart account client
  const walletAddress = client?.account?.address as `0x${string}` | undefined;
  const { transactions, isLoading } = useTransactionHistory(walletAddress, { enabled: !!walletAddress });

  const filteredTransactions = transactions.filter(tx => {
    if (filter === "yield") return tx.type === "yield";
    if (filter === "transfers") return tx.type !== "yield";
    return true;
  });

  const groupedTransactions = groupTransactionsByDate(filteredTransactions);
  const groupOrder = ["Today", "Yesterday", "This Week", "This Month"];

  // Calculate total yield
  const totalYield = transactions
    .filter(tx => tx.type === "yield")
    .reduce((sum, tx) => sum + tx.amount, 0);

  let rowIndex = 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full flex flex-col items-center px-4 sm:px-8 lg:px-16 py-8 sm:py-12">
      <div className="w-full max-w-[1100px]">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Activity</h1>
          <p className="text-white/40 text-sm sm:text-base">
            <span style={{ color: BRAND_LAVENDER }}>${totalYield.toFixed(2)}</span> earned all time
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-8 sm:mb-10">
          {[
            { key: "all", label: "All" },
            { key: "yield", label: "Yield" },
            { key: "transfers", label: "Transfers" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: filter === key ? `${BRAND_LAVENDER}20` : "transparent",
                color: filter === key ? BRAND_LAVENDER : "rgba(255,255,255,0.4)"
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Transaction groups */}
        <div className="space-y-6 sm:space-y-8">
          {isLoading ? (
            <div className="bg-white/[0.04] backdrop-blur-[40px] rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.35)] px-4 py-8 sm:px-5 sm:py-12 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white/[0.04] backdrop-blur-[40px] rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.35)] px-4 py-8 sm:px-5 sm:py-12 text-center">
              <p className="text-white/40 text-sm">No transactions yet</p>
              <p className="text-white/25 text-xs mt-1">Your transaction history will appear here</p>
            </div>
          ) : Object.keys(groupedTransactions)
            .sort((a, b) => {
              const aIndex = groupOrder.indexOf(a);
              const bIndex = groupOrder.indexOf(b);
              if (aIndex === -1 && bIndex === -1) return 0;
              if (aIndex === -1) return 1;
              if (bIndex === -1) return -1;
              return aIndex - bIndex;
            })
            .map((groupName) => (
              <div key={groupName} className="bg-white/[0.04] backdrop-blur-[40px] rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.35)] px-4 py-2 sm:px-5 sm:py-3">
                {/* Group header */}
                <p className="text-white/50 text-xs font-medium tracking-wide py-3 sm:py-4">
                  {groupName}
                </p>

                {/* Transactions in group */}
                <div className="divide-y divide-white/[0.04]">
                  {groupedTransactions[groupName].map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      index={rowIndex++}
                    />
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
