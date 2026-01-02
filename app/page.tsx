"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

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
  const [totalBalance, setTotalBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      const loggedIn = status === "true";
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        const storedBalance = localStorage.getItem("yuki_balance");
        
        if (storedBalance) {
          setTotalBalance(parseFloat(storedBalance));
        } else {
          // Default initial state
          const initial = 12438.72;
          setTotalBalance(initial);
          localStorage.setItem("yuki_balance", initial.toString());
        }
      } else {
        setTotalBalance(0);
      }
      setIsLoading(false);
    };

    checkLoginStatus();
    window.addEventListener("yuki_login_update", checkLoginStatus);
    return () => window.removeEventListener("yuki_login_update", checkLoginStatus);
  }, []);

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

  // Calculate earnings
  const thirtyDayChange = totalBalance - balanceHistory[0].value;
  const thirtyDayPercent = ((thirtyDayChange / balanceHistory[0].value) * 100);
  const estimatedAPY = 7.8; // Mock APY
  const estimatedYearlyEarnings = totalBalance * (estimatedAPY / 100);
  const estimatedMonthlyEarnings = estimatedYearlyEarnings / 12;

  return (
    <div className="w-full py-12 animate-fade-in">
      
      {/* 1. The Primary Truth: Total Balance */}
      <section className="mb-8 mt-4">
        <p className="text-sm text-gray-500 mb-2 font-medium">Total Balance</p>
        <h1 className="text-6xl font-medium text-white tracking-tighter mb-1">
          ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h1>
        
        {/* Balance trend */}
        <div className="mt-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">Last 30 days</span>
            <span className={`text-xs font-medium ${thirtyDayChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {thirtyDayChange >= 0 ? '+' : ''}{thirtyDayPercent.toFixed(2)}%
            </span>
          </div>
          <BalanceChart data={balanceHistory} />
        </div>
      </section>

      {/* 2. Performance Stats */}
      <section className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white/[0.03] rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Current APY</p>
          <p className="text-2xl font-medium text-white">{estimatedAPY}%</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Est. Monthly</p>
          <p className="text-2xl font-medium text-white">
            ${estimatedMonthlyEarnings.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">30d Change</p>
          <p className={`text-2xl font-medium ${thirtyDayChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {thirtyDayChange >= 0 ? '+' : ''}${Math.abs(thirtyDayChange).toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        </div>
      </section>

      {/* 3. Actions */}
      <section className="grid grid-cols-2 gap-3 mb-8">
        <Link
          href="/send"
          className="py-4 px-4 bg-[#0F52FB] text-white rounded-lg text-sm font-medium hover:bg-[#0F52FB]/90 transition-colors text-center"
        >
          Send Money
        </Link>
        <Link
          href="/funds"
          className="py-4 px-4 bg-white/[0.03] text-white rounded-lg text-sm font-medium hover:bg-white/[0.05] transition-colors text-center"
        >
          Add / Withdraw
        </Link>
      </section>

      {/* 4. Holdings */}
      <section className="mb-8">
        <div className="bg-white/[0.03] rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-white/[0.02]">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">Holdings</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/yUSD.png"
                  alt="yUSD"
                  width={40}
                  height={40}
                  className="p-1 bg-white/[0.03] rounded-full"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-base font-medium text-white">yUSD</p>
                    <Link
                      href="/vaults/yuki-stable"
                      className="text-gray-500 hover:text-gray-300 transition-colors"
                      aria-label="Learn more about yUSD"
                    >
                      <svg 
                        className="w-3.5 h-3.5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500">Yuki USD Vault</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-medium text-white">
                  ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  {totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} yUSD
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Activity */}
      <section>
        <div className="bg-white/[0.03] rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-white/[0.02] flex items-center justify-between">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">Recent Activity</h2>
            <Link href="/activity" className="text-xs text-gray-500 hover:text-white transition-colors">
              View All
            </Link>
          </div>
          <div className="px-5">
            {recentActivity.map((activity, index) => (
              <ActivityItem
                key={index}
                type={activity.type}
                amount={activity.amount}
                date={activity.date}
              />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
