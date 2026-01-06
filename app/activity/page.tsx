"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Activity categories
type ActivityCategory = "received" | "sent" | "added" | "withdrawn" | "earned";

interface ActivityEntry {
  id: string;
  category: ActivityCategory;
  description: string;
  recipient?: string;
  amount: number;
  date: Date;
  isHighlight?: boolean;
}

// Mock activity data - in production this would come from an API
const generateMockActivity = (): ActivityEntry[] => {
  return [
    {
      id: "1",
      category: "sent",
      description: "Sent to Alex",
      recipient: "Alex",
      amount: -250.00,
      date: new Date("2024-12-18T14:32:00"),
    },
    {
      id: "2",
      category: "added",
      description: "Deposited funds",
      amount: 2000.00,
      date: new Date("2024-12-15T09:15:00"),
    },
    {
      id: "3",
      category: "earned",
      description: "Interest earned today",
      amount: 12.43,
      date: new Date("2024-12-15T00:00:00"),
      isHighlight: true,
    },
    {
      id: "4",
      category: "received",
      description: "Received from Mike",
      recipient: "Mike",
      amount: 75.00,
      date: new Date("2024-12-10T18:45:00"),
    },
    {
      id: "5",
      category: "added",
      description: "Deposited funds",
      amount: 5000.00,
      date: new Date("2024-11-28T11:20:00"),
    },
    {
      id: "6",
      category: "withdrawn",
      description: "Withdrew to bank",
      amount: -500.00,
      date: new Date("2024-11-10T16:08:00"),
    },
    {
      id: "7",
      category: "earned",
      description: "Interest earned",
      amount: 8.32,
      date: new Date("2024-11-10T00:00:00"),
      isHighlight: true,
    },
    {
      id: "8",
      category: "received",
      description: "Received from Sarah",
      recipient: "Sarah",
      amount: 150.00,
      date: new Date("2024-10-25T20:30:00"),
    },
    {
      id: "9",
      category: "sent",
      description: "Sent to Jordan",
      recipient: "Jordan",
      amount: -36.28,
      date: new Date("2024-10-15T12:55:00"),
    },
    {
      id: "10",
      category: "added",
      description: "Initial deposit",
      amount: 6000.00,
      date: new Date("2024-10-01T10:00:00"),
    },
  ];
};

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
  });
}

function getActivityIcon(category: ActivityCategory) {
  switch (category) {
    case "received":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      );
    case "sent":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      );
    case "added":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    case "withdrawn":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      );
    case "earned":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
  }
}

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    // Load mock activity
    setActivity(generateMockActivity());
  }, []);

  return (
    <div className="w-full min-h-screen pt-24 pb-12 relative">
      {/* Ambient glow */}
      <motion.div
        animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#004BAD]/15 rounded-full blur-[150px] pointer-events-none"
      />

      <div className="max-w-[800px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <h1 
            className="font-display text-4xl sm:text-5xl text-white tracking-tight mb-3"
            style={{ 
              WebkitFontSmoothing: "antialiased",
              textRendering: "geometricPrecision",
            }}
          >
            ACTIVITY
          </h1>
          <p className="text-white/40">Your complete transaction history</p>
        </motion.section>

        {/* Activity Feed */}
        {activity.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="bg-white/5 rounded-2xl p-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-white/60 font-medium">No activity yet</p>
            <p className="text-sm text-white/30 mt-1">Your transactions will appear here</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {activity.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.03, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`p-5 sm:p-6 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer ${
                  entry.isHighlight
                    ? "bg-[#004BAD]/30"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      entry.isHighlight
                        ? "bg-[#004BAD]/50"
                        : entry.category === "received"
                        ? "bg-[#004BAD]/20"
                        : entry.category === "sent"
                        ? "bg-white/10"
                        : entry.category === "added"
                        ? "bg-emerald-500/20"
                        : entry.category === "withdrawn"
                        ? "bg-white/10"
                        : "bg-[#004BAD]/20"
                    }`}
                  >
                    <div
                      className={
                        entry.isHighlight 
                          ? "text-white" 
                          : entry.category === "added" 
                          ? "text-emerald-400" 
                          : entry.category === "received"
                          ? "text-[#004BAD]"
                          : "text-white/60"
                      }
                    >
                      {getActivityIcon(entry.category)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium mb-0.5 truncate ${
                        entry.isHighlight ? "text-white" : "text-white"
                      }`}
                    >
                      {entry.description}
                    </p>
                    <p
                      className={`text-sm truncate ${
                        entry.isHighlight ? "text-white/50" : "text-white/40"
                      }`}
                    >
                      {formatDate(entry.date)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div
                    className={`text-lg font-display flex-shrink-0 ${
                      entry.isHighlight
                        ? "text-white"
                        : entry.amount > 0
                        ? "text-emerald-400"
                        : "text-white/60"
                    }`}
                  >
                    {entry.amount > 0 ? "+" : ""}${Math.abs(entry.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-white/30">
            Showing all activity · Sorted by most recent
          </p>
        </motion.div>
      </div>
    </div>
  );
}
