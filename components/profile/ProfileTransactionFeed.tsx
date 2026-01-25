'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const BRAND_LAVENDER = "#e1a8f0";

// Only show sent and received transactions on profiles
type TransactionType = "sent" | "received";

interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  counterparty: string;
  amount: number;
  timestamp: Date;
  status: "completed" | "pending";
}

interface ProfileTransactionFeedProps {
  isPrivate: boolean;
  isOwner: boolean;
}

function getTransactionIcon(type: TransactionType) {
  const baseClass = "w-4 h-4";
  
  if (type === "sent") {
    return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
      </svg>
    );
  }
  
  return (
    <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
    </svg>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Mock transaction generator - in production, fetch from API
// Only includes sent/received transactions (no deposits, withdrawals, or yield)
function generateMockTransactions(): Transaction[] {
  return [
    {
      id: "1",
      type: "received",
      description: "From Mike",
      counterparty: "Mike",
      amount: 250.00,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "2",
      type: "sent",
      description: "To Alex",
      counterparty: "Alex",
      amount: -150.00,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "3",
      type: "received",
      description: "From Sarah",
      counterparty: "Sarah",
      amount: 75.00,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "4",
      type: "sent",
      description: "To Jordan",
      counterparty: "Jordan",
      amount: -30.00,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
    {
      id: "5",
      type: "received",
      description: "From Taylor",
      counterparty: "Taylor",
      amount: 100.00,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: "completed",
    },
  ];
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const [isHovered, setIsHovered] = useState(false);
  const isPositive = transaction.amount > 0;
  const isYield = transaction.type === "yield";
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative py-3 cursor-pointer"
    >
      <motion.div
        className="absolute inset-x-0 inset-y-0 -mx-3 rounded-xl"
        initial={false}
        animate={{
          backgroundColor: isHovered ? "rgba(255,255,255,0.03)" : "transparent",
        }}
        transition={{ duration: 0.15 }}
      />
      
      <div className="relative flex items-center gap-3">
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
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
        >
          {getTransactionIcon(transaction.type)}
        </div>
        
        {/* Description */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm truncate">
            {transaction.description}
          </p>
          <p className="text-white/30 text-xs">
            {formatRelativeTime(transaction.timestamp)}
          </p>
        </div>
        
        {/* Amount */}
        <p
          className="text-sm font-medium tabular-nums flex-shrink-0"
          style={{ 
            color: isYield
              ? BRAND_LAVENDER
              : isPositive 
                ? "white" 
                : "rgba(255,255,255,0.5)",
          }}
        >
          {isPositive ? "+" : ""}
          ${Math.abs(transaction.amount).toLocaleString("en-US", { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}
        </p>
      </div>
    </div>
  );
}

export function ProfileTransactionFeed({ isPrivate, isOwner }: ProfileTransactionFeedProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // In production, fetch from API based on user handle
    const timer = setTimeout(() => {
      setTransactions(generateMockTransactions());
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // If profile is private and viewer is not the owner, show private message
  if (isPrivate && !isOwner) {
    return (
      <div className="py-12 text-center">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${BRAND_LAVENDER}10` }}
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={1.5}
            style={{ color: BRAND_LAVENDER }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <p className="text-white/50 text-sm">
          This account&apos;s transactions are private
        </p>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="py-8">
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-white/[0.05]" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-white/[0.05] rounded mb-1" />
                <div className="h-3 w-16 bg-white/[0.05] rounded" />
              </div>
              <div className="h-4 w-16 bg-white/[0.05] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Empty state
  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-white/30 text-sm">No transactions yet</p>
      </div>
    );
  }
  
  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white/50 text-xs font-medium tracking-wide">Recent Activity</h3>
      </div>
      
      <div className="divide-y divide-white/[0.04]">
        {transactions.map((tx) => (
          <TransactionItem key={tx.id} transaction={tx} />
        ))}
      </div>
    </div>
  );
}

