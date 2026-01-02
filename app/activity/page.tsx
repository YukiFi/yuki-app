"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Activity categories with plain language descriptions
type ActivityCategory = "received" | "sent" | "added" | "withdrawn";

interface ActivityEntry {
  id: string;
  category: ActivityCategory;
  description: string;
  amount: number;
  date: Date;
  balanceAfter?: number;
}

// Mock activity data - in production this would come from an API
const generateMockActivity = (): ActivityEntry[] => {
  return [
    {
      id: "1",
      category: "sent",
      description: "Sent to @alex",
      amount: -250.00,
      date: new Date("2024-12-18T14:32:00"),
      balanceAfter: 12438.72,
    },
    {
      id: "2",
      category: "added",
      description: "Deposited",
      amount: 2000.00,
      date: new Date("2024-12-15T09:15:00"),
      balanceAfter: 12688.72,
    },
    {
      id: "3",
      category: "received",
      description: "Received from @mike",
      amount: 75.00,
      date: new Date("2024-12-10T18:45:00"),
      balanceAfter: 10688.72,
    },
    {
      id: "4",
      category: "added",
      description: "Deposited",
      amount: 5000.00,
      date: new Date("2024-11-28T11:20:00"),
      balanceAfter: 10613.72,
    },
    {
      id: "5",
      category: "withdrawn",
      description: "Withdrew",
      amount: -500.00,
      date: new Date("2024-11-10T16:08:00"),
      balanceAfter: 5613.72,
    },
    {
      id: "6",
      category: "received",
      description: "Received from @sarah",
      amount: 150.00,
      date: new Date("2024-10-25T20:30:00"),
      balanceAfter: 6113.72,
    },
    {
      id: "7",
      category: "sent",
      description: "Sent to @jordan",
      amount: -36.28,
      date: new Date("2024-10-15T12:55:00"),
      balanceAfter: 5963.72,
    },
    {
      id: "8",
      category: "added",
      description: "Deposited",
      amount: 6000.00,
      date: new Date("2024-10-01T10:00:00"),
      balanceAfter: 6000.00,
    },
  ];
};

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const time = date.toLocaleTimeString("en-US", { 
    hour: "numeric", 
    minute: "2-digit",
    hour12: true 
  });
  
  if (days === 0) return `Today at ${time}`;
  if (days === 1) return `Yesterday at ${time}`;
  
  const dateStr = date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
  });
  
  return `${dateStr} at ${time}`;
}

function getCategoryLabel(category: ActivityCategory): string {
  switch (category) {
    case "received": return "Received";
    case "sent": return "Sent";
    case "added": return "Deposited";
    case "withdrawn": return "Withdrew";
  }
}

function getCategoryColor(category: ActivityCategory): string {
  switch (category) {
    case "received":
    case "added":
      return "text-emerald-500/80";
    case "sent":
    case "withdrawn":
      return "text-white";
  }
}

export default function ActivityPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      setIsLoggedIn(status === "true");
      
      if (status !== "true") {
        router.push("/signin");
        return;
      }
      
      // Load mock activity
      setActivity(generateMockActivity());
    };

    checkLoginStatus();
    window.addEventListener("yuki_login_update", checkLoginStatus);
    return () => window.removeEventListener("yuki_login_update", checkLoginStatus);
  }, [router]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
      </div>
    );
  }

  // Group activities by month
  const groupedActivity = activity.reduce((groups, entry) => {
    const monthKey = entry.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(entry);
    return groups;
  }, {} as Record<string, ActivityEntry[]>);

  return (
    <div className="w-full py-12 animate-fade-in">
      {/* Header */}
      <section className="mb-8 mt-4">
        <p className="text-sm text-gray-500 mb-2 font-medium">Activity</p>
        <h1 className="text-4xl font-medium text-white tracking-tight">
          Transaction History
        </h1>
      </section>

      {/* Activity List */}
      {activity.length === 0 ? (
        <div className="bg-white/[0.03] rounded-lg p-12 text-center">
          <p className="text-gray-500">No activity yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivity).map(([month, entries]) => (
            <section key={month}>
              <div className="bg-white/[0.03] rounded-lg overflow-hidden">
                <div className="px-5 py-3 bg-white/[0.02]">
                  <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">{month}</h2>
                </div>
                <div className="px-5">
                  {entries.map((entry) => (
                    <div 
                      key={entry.id}
                      className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full ${
                          entry.amount > 0 ? "bg-emerald-500/50" : "bg-white/20"
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{entry.description}</p>
                          <p className="text-[10px] text-gray-600">{formatDate(entry.date)}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-sm font-mono ${getCategoryColor(entry.category)}`}>
                          {entry.amount > 0 ? "+" : ""}${Math.abs(entry.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                        {entry.balanceAfter !== undefined && (
                          <p className="text-[10px] text-gray-600">
                            balance: ${entry.balanceAfter.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-gray-600 text-center mt-8">
        All times in your local timezone.
      </p>
    </div>
  );
}
