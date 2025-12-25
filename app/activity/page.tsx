"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Activity categories with plain language descriptions
type ActivityCategory = "received" | "sent" | "added" | "withdrawn" | "earned" | "adjusted";

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
      category: "earned",
      description: "Monthly yield",
      amount: 43.27,
      date: new Date("2024-12-20"),
      balanceAfter: 12481.99,
    },
    {
      id: "2",
      category: "sent",
      description: "Sent to @alex",
      amount: -250.00,
      date: new Date("2024-12-18"),
      balanceAfter: 12438.72,
    },
    {
      id: "3",
      category: "added",
      description: "Added funds",
      amount: 2000.00,
      date: new Date("2024-12-15"),
      balanceAfter: 12688.72,
    },
    {
      id: "4",
      category: "earned",
      description: "Monthly yield",
      amount: 38.72,
      date: new Date("2024-11-20"),
      balanceAfter: 10688.72,
    },
    {
      id: "5",
      category: "added",
      description: "Added funds",
      amount: 5000.00,
      date: new Date("2024-11-28"),
      balanceAfter: 10650.00,
    },
    {
      id: "6",
      category: "withdrawn",
      description: "Withdrew to bank",
      amount: -500.00,
      date: new Date("2024-11-10"),
      balanceAfter: 5650.00,
    },
    {
      id: "7",
      category: "received",
      description: "Received from @sarah",
      amount: 150.00,
      date: new Date("2024-10-25"),
      balanceAfter: 6150.00,
    },
    {
      id: "8",
      category: "added",
      description: "Added funds",
      amount: 6000.00,
      date: new Date("2024-10-01"),
      balanceAfter: 6000.00,
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

function getCategoryLabel(category: ActivityCategory): string {
  switch (category) {
    case "received": return "Received";
    case "sent": return "Sent";
    case "added": return "Added";
    case "withdrawn": return "Withdrew";
    case "earned": return "Earned";
    case "adjusted": return "Adjustment";
  }
}

function getCategoryColor(category: ActivityCategory): string {
  switch (category) {
    case "received":
    case "added":
    case "earned":
      return "text-emerald-500/80";
    case "sent":
    case "withdrawn":
      return "text-white";
    case "adjusted":
      return "text-gray-400";
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
      <section className="mb-10">
        <h1 className="text-2xl font-medium text-white mb-2">Activity</h1>
        <p className="text-gray-500 text-sm">Everything that affected your balance.</p>
      </section>

      {/* Activity List */}
      {activity.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No activity yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedActivity).map(([month, entries]) => (
            <section key={month}>
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">{month}</h2>
              <div className="space-y-1">
                {entries.map((entry) => (
                  <div 
                    key={entry.id}
                    className="flex items-center justify-between py-4 border-b border-white/5 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">{entry.description}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{formatDate(entry.date)}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-sm font-medium ${getCategoryColor(entry.category)}`}>
                        {entry.amount > 0 ? "+" : ""}${Math.abs(entry.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      {entry.balanceAfter !== undefined && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          ${entry.balanceAfter.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-gray-600 text-center mt-12">
        All times in your local timezone.
      </p>
    </div>
  );
}
