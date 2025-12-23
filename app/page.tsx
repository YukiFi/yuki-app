"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import SendFlow from "@/components/SendFlow";

// Savings profile definitions
const savingsProfiles = [
  {
    id: "yuki-stable",
    name: "Stable",
    description: "Capital preservation focused",
    // APY is informational only
    apyRange: "4–6%",
  },
  {
    id: "eth-yield",
    name: "Balanced",
    description: "Balanced exposure",
    apyRange: "6–9%",
  },
  {
    id: "sol-turbo",
    name: "Growth",
    description: "Higher volatility tolerance",
    apyRange: "8–12%",
  },
];

// Activity item component - Simplified for secondary focus
function ActivityItem({ 
  type, 
  amount, 
  date 
}: { 
  type: "deposit" | "withdrawal"; 
  amount: number; 
  date: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group">
      <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
        <div className={`w-2 h-2 rounded-full ${
          type === "deposit" ? "bg-emerald-500/50" : "bg-white/20"
        }`} />
        <div>
          <p className="text-sm font-medium text-gray-300 capitalize">{type}</p>
          <p className="text-[10px] text-gray-600">{date}</p>
        </div>
      </div>
      <span className="text-sm text-gray-400 font-mono">
        {type === "deposit" ? "+" : "-"}${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}

// Landing Hero for non-authenticated users
function LandingHero() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-8 max-w-2xl leading-[1.2]">
        Money, <span className="text-gray-500">simplified.</span>
      </h1>
      
      <p className="text-gray-500 max-w-md mb-12 text-lg">
        One balance. One view. Designed to be boring.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/signin"
          className="px-8 py-3 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSendOpen, setIsSendOpen] = useState(false);

  useEffect(() => {
    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      const loggedIn = status === "true";
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        const storedBalances = localStorage.getItem("yuki_balances");
        if (storedBalances) {
          setBalances(JSON.parse(storedBalances));
        } else {
          // Default initial state
          const initial = { "yuki-stable": 8200, "eth-yield": 4238.72 };
          setBalances(initial);
          localStorage.setItem("yuki_balances", JSON.stringify(initial));
        }
      } else {
        setBalances({});
      }
      setIsLoading(false);
    };

    checkLoginStatus();
    window.addEventListener("yuki_login_update", checkLoginStatus);
    return () => window.removeEventListener("yuki_login_update", checkLoginStatus);
  }, []);

  const totalBalance = Object.values(balances).reduce((acc, val) => acc + val, 0);

  // Calculate allocation percentages
  const allocations = savingsProfiles.map(profile => {
    const amount = balances[profile.id] || 0;
    const percentage = totalBalance > 0 ? (amount / totalBalance) * 100 : 0;
    return { ...profile, amount, percentage };
  }).filter(a => a.percentage > 0);

  // Mock activity data
  const recentActivity = [
    { type: "deposit" as const, amount: 2000, date: "Dec 15" },
    { type: "deposit" as const, amount: 5000, date: "Nov 28" },
    { type: "withdrawal" as const, amount: 500, date: "Nov 10" },
  ];

  const handleUpdateBalances = (newBalances: Record<string, number>) => {
    setBalances(newBalances);
    localStorage.setItem("yuki_balances", JSON.stringify(newBalances));
    window.dispatchEvent(new Event("yuki_login_update"));
  };

  if (isLoading) return null;
  if (!isLoggedIn) return <LandingHero />;

  return (
    <div className="w-full max-w-xl mx-auto px-6 py-12 animate-fade-in text-center md:text-left">
      
      {/* 1. The Primary Truth: Total Balance */}
      <section className="mb-16 mt-8">
        <p className="text-sm text-gray-500 mb-2 font-medium">Total Balance</p>
        <h1 className="text-6xl font-medium text-white tracking-tighter mb-2">
          ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h1>
        <p className="text-sm text-emerald-500/80 flex items-center gap-2 justify-center md:justify-start">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Available to use
        </p>
      </section>

      {/* 2. Actions (Usability is Global) */}
      <section className="grid grid-cols-2 gap-3 mb-16">
        <Link
          href="/vaults" 
          className="py-3 px-4 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors text-center"
        >
          Add Funds
        </Link>
        <button
          onClick={() => setIsSendOpen(true)}
          className="py-3 px-4 bg-white/5 text-white rounded-lg text-sm font-medium hover:bg-white/10 transition-colors border border-white/5 cursor-pointer"
        >
          Send / Withdraw
        </button>
      </section>

      {/* 3. Allocation (Savings as Behavior/Configuration) */}
      {allocations.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">Allocation Strategy</h2>
            <Link href="/vaults" className="text-xs text-gray-500 hover:text-white transition-colors">
              Configure
            </Link>
          </div>
          
          <div className="space-y-4">
            {/* Visual Bar */}
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-white/5">
              {allocations.map((alloc, i) => (
                <div 
                  key={alloc.id}
                  style={{ width: `${alloc.percentage}%` }}
                  className={`h-full ${
                    i === 0 ? "bg-white/40" : i === 1 ? "bg-white/20" : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            {/* Legend / Details */}
            <div className="grid gap-4">
              {allocations.map((alloc, i) => (
                <div key={alloc.id} className="flex items-center justify-between text-sm group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      i === 0 ? "bg-white/40" : i === 1 ? "bg-white/20" : "bg-white/10"
                    }`} />
                    <span className="text-gray-300">{alloc.name}</span>
                    <span className="text-xs text-gray-600 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      ~{alloc.apyRange} yield
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">{Math.round(alloc.percentage)}%</span>
                    <span className="text-gray-400 w-24 text-right">
                      ${alloc.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Activity (Secondary & Confirmational) */}
      <section>
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-6">Recent Activity</h2>
        <div className="">
          {recentActivity.map((activity, index) => (
            <ActivityItem
              key={index}
              type={activity.type}
              amount={activity.amount}
              date={activity.date}
            />
          ))}
        </div>
      </section>

      {/* Send Flow Modal */}
      <SendFlow 
        isOpen={isSendOpen} 
        onClose={() => setIsSendOpen(false)}
        balances={balances}
        onUpdateBalances={handleUpdateBalances}
      />
    </div>
  );
}
