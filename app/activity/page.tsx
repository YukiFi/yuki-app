"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TransactionType = "sent" | "received" | "deposit" | "withdrawal" | "yield";

interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  counterparty?: string;
  amount: number;
  timestamp: Date;
  status: "completed" | "pending";
}

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
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative py-5 cursor-pointer"
    >
      {/* Hover background - subtle depth */}
      <motion.div
        className="absolute inset-x-0 inset-y-0 -mx-4 rounded-2xl"
        initial={false}
        animate={{
          backgroundColor: isHovered ? "rgba(255,255,255,0.03)" : "transparent",
        }}
        transition={{ duration: 0.2 }}
      />
      
      <div className="relative flex items-center gap-4">
        {/* Icon */}
        <motion.div
          className={`
            w-11 h-11 rounded-xl flex items-center justify-center
            ${transaction.type === "yield" 
              ? "text-emerald-400" 
              : isPositive 
                ? "text-white/70" 
                : "text-white/40"
            }
          `}
          style={{
            backgroundColor: transaction.type === "yield" 
              ? "rgba(52, 211, 153, 0.1)" 
              : "rgba(255,255,255,0.05)",
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
            <p className="text-white font-medium truncate">
              {transaction.description}
            </p>
            {transaction.status === "pending" && (
              <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                Pending
              </span>
            )}
          </div>
          <p className="text-white/30 text-sm mt-0.5">
            {formatTime(transaction.timestamp)}
          </p>
        </div>

        {/* Amount */}
        <motion.div
          className={`
            text-lg font-medium tabular-nums
            ${transaction.type === "yield"
              ? "text-emerald-400"
              : isPositive 
                ? "text-white" 
                : "text-white/50"
            }
          `}
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
          className="text-white/20"
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

// Mock data generator
function generateTransactions(): Transaction[] {
  return [
    {
      id: "1",
      type: "yield",
      description: "Interest earned",
      amount: 2.67,
      timestamp: new Date(),
      status: "completed",
    },
    {
      id: "2",
      type: "sent",
      description: "Sent to Alex",
      counterparty: "Alex",
      amount: -250.00,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "3",
      type: "deposit",
      description: "Added money",
      amount: 2000.00,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "4",
      type: "yield",
      description: "Interest earned",
      amount: 2.54,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "5",
      type: "received",
      description: "Received from Mike",
      counterparty: "Mike",
      amount: 75.00,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "6",
      type: "yield",
      description: "Interest earned",
      amount: 2.41,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "7",
      type: "deposit",
      description: "Added money",
      amount: 5000.00,
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "8",
      type: "withdrawal",
      description: "Withdrew to bank",
      amount: -500.00,
      timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "9",
      type: "received",
      description: "Received from Sarah",
      counterparty: "Sarah",
      amount: 150.00,
      timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "10",
      type: "deposit",
      description: "Initial deposit",
      amount: 6000.00,
      timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
  ];
}

export default function ActivityPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "yield" | "transfers">("all");

  useEffect(() => {
    setTransactions(generateTransactions());
  }, []);

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
    <div className="min-h-[calc(100vh-3.5rem)] px-4 sm:px-8 lg:px-16 py-12 max-w-3xl mx-auto">
      {/* Header - no entrance animation */}
      <div className="mb-12">
        <h1 className="text-4xl font-medium text-white mb-2">Activity</h1>
        <p className="text-white/40">
          ${totalYield.toFixed(2)} earned all time
        </p>
      </div>

      {/* Filter tabs - immediately visible */}
      <div className="flex gap-1 mb-10">
        {[
          { key: "all", label: "All" },
          { key: "yield", label: "Yield" },
          { key: "transfers", label: "Transfers" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer
              ${filter === key
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
              }
            `}
          >
            {label}
          </button>
        ))}
                  </div>

      {/* Transaction groups */}
      <div className="space-y-8">
        {Object.keys(groupedTransactions)
          .sort((a, b) => {
            const aIndex = groupOrder.indexOf(a);
            const bIndex = groupOrder.indexOf(b);
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
          })
          .map((groupName) => (
            <div key={groupName}>
              {/* Group header */}
              <p className="text-white/30 text-xs uppercase tracking-wider mb-2 px-0">
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
            ))}
          </div>

      {/* Empty state */}
      {filteredTransactions.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-white/50 font-medium mb-1">No transactions yet</p>
          <p className="text-white/30 text-sm">Your activity will appear here</p>
      </div>
      )}
    </div>
  );
}
