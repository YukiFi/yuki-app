"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Mock activity data
const mockActivity = [
  { id: 1, type: "deposit", amount: 2000, profile: "Stable", date: "Dec 15, 2024" },
  { id: 2, type: "deposit", amount: 5000, profile: "Balanced", date: "Nov 28, 2024" },
  { id: 3, type: "withdrawal", amount: 500, profile: "Stable", date: "Nov 10, 2024" },
  { id: 4, type: "deposit", amount: 6000, profile: "Stable", date: "Oct 1, 2024" },
  { id: 5, type: "deposit", amount: 1500, profile: "Balanced", date: "Sep 15, 2024" },
];

export default function ActivityPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      setIsLoggedIn(status === "true");
      
      if (status !== "true") {
        router.push("/signin");
      }
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

  return (
    <div className="w-full mx-auto px-4 pb-24 animate-fade-in">
      {/* Back link */}
      <div className="pt-8 pb-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {/* Header */}
      <section className="pb-10">
        <h1 className="text-2xl font-medium text-white mb-2">Activity</h1>
        <p className="text-gray-500 text-sm">Your transaction history</p>
      </section>

      {/* Activity List */}
      <section>
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
          {mockActivity.map((activity, index) => (
            <div 
              key={activity.id}
              className={`px-6 py-5 ${index !== mockActivity.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white capitalize">{activity.type}</span>
                <span className={`font-medium ${activity.type === 'deposit' ? 'text-green-500/80' : 'text-white'}`}>
                  {activity.type === 'deposit' ? '+' : '-'}${activity.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{activity.profile} Savings</span>
                <span className="text-xs text-gray-500">{activity.date}</span>
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-gray-600 text-center mt-6">
          Need transaction details? Contact support.
        </p>
      </section>
    </div>
  );
}
