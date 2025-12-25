"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

type ComfortLevel = "steady" | "balanced" | "flexible";

const allocationProfiles = [
  { id: "yuki-stable", name: "Stable", key: "stable" },
  { id: "eth-yield", name: "Balanced", key: "balanced" },
  { id: "sol-turbo", name: "Growth", key: "growth" },
];

// Minimal balance chart component
function BalanceChart({ data }: { data: { value: number; date: string }[] }) {
  if (data.length < 2) return null;
  
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  const width = 100;
  const height = 40;
  const padding = 2;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");
  
  const lastPoint = data[data.length - 1];
  const firstPoint = data[0];
  const isUp = lastPoint.value >= firstPoint.value;
  
  return (
    <div className="w-full h-12">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Gradient fill */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0F52FB" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0F52FB" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#chartGradient)"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#0F52FB"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

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
  const [comfortLevel, setComfortLevel] = useState<ComfortLevel>("balanced");

  useEffect(() => {
    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      const loggedIn = status === "true";
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        const storedBalances = localStorage.getItem("yuki_balances");
        const storedComfort = localStorage.getItem("yuki_comfort_level") as ComfortLevel | null;
        
        if (storedComfort) {
          setComfortLevel(storedComfort);
        }
        
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

  // Calculate allocation percentages based on actual balances
  const allocations = allocationProfiles.map(profile => {
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

  // Mock balance history (last 30 days)
  const balanceHistory = [
    { value: 10200, date: "Nov 23" },
    { value: 10350, date: "Nov 26" },
    { value: 10280, date: "Nov 29" },
    { value: 10450, date: "Dec 2" },
    { value: 10520, date: "Dec 5" },
    { value: 10680, date: "Dec 8" },
    { value: 10590, date: "Dec 11" },
    { value: 10820, date: "Dec 14" },
    { value: 12820, date: "Dec 17" },
    { value: 12650, date: "Dec 20" },
    { value: totalBalance, date: "Today" },
  ];

  if (isLoading) return null;
  if (!isLoggedIn) return <LandingHero />;

  return (
    <div className="w-full py-12 animate-fade-in text-center md:text-left">
      
      {/* 1. The Primary Truth: Total Balance */}
      <section className="mb-10 mt-4">
        <p className="text-sm text-gray-500 mb-2 font-medium">Total Balance</p>
        <h1 className="text-6xl font-medium text-white tracking-tighter mb-1">
          ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h1>
        
        {/* Balance trend */}
        <div className="mt-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">Last 30 days</span>
          </div>
          <BalanceChart data={balanceHistory} />
        </div>
      </section>

      {/* 2. Actions */}
      <section className="grid grid-cols-2 gap-3 mb-12">
        <Link
          href="/send"
          className="py-3 px-4 bg-[#0F52FB] text-white rounded-lg text-sm font-medium hover:bg-[#0F52FB]/90 transition-colors text-center"
        >
          Pay or Request
        </Link>
        <Link
          href="/funds"
          className="py-3 px-4 bg-white/5 text-white rounded-lg text-sm font-medium hover:bg-white/10 transition-colors border border-white/10 text-center"
        >
          Add or Withdraw
        </Link>
      </section>

      {/* 3. Allocation (Savings as Behavior/Configuration) */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">
            {comfortLevel === "steady" ? "Steady" : comfortLevel === "balanced" ? "Balanced" : "Flexible"}
          </h2>
          <Link 
            href="/configure"
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Configure
          </Link>
        </div>
        
        {allocations.length > 0 ? (
          <div className="space-y-4">
            {/* Visual Bar */}
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-[#0F52FB]/10">
              {allocations.map((alloc, i) => (
                <div 
                  key={alloc.id}
                  style={{ width: `${alloc.percentage}%` }}
                  className={`h-full ${
                    i === 0 ? "bg-[#0F52FB]" : i === 1 ? "bg-[#0F52FB]/60" : "bg-[#0F52FB]/30"
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
                      i === 0 ? "bg-[#0F52FB]" : i === 1 ? "bg-[#0F52FB]/60" : "bg-[#0F52FB]/30"
                    }`} />
                    <span className="text-gray-300">{alloc.name}</span>
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
        ) : (
          <p className="text-sm text-gray-600">Add funds to get started.</p>
        )}
      </section>

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

    </div>
  );
}
