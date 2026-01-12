"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

// Quick action button
function QuickAction({ 
  href, 
  icon, 
  label, 
  variant = "default" 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  variant?: "default" | "primary";
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col items-center justify-center gap-3 p-5 sm:p-6 rounded-2xl transition-all cursor-pointer ${
        variant === "primary"
          ? "bg-white text-black hover:bg-white/90"
          : "bg-white/5 text-white hover:bg-white/10"
      }`}
    >
      <div className={`transition-transform group-hover:scale-110 ${
        variant === "primary" ? "text-black" : "text-white"
      }`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

// Sparkline chart for balance history
function BalanceChart({ data }: { data: { value: number; date: string }[] }) {
  if (data.length < 2) return null;
  
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  const width = 100;
  const height = 50;
  const padding = 4;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");
  
  const lastPoint = data[data.length - 1];
  const firstPoint = data[0];
  const isUp = lastPoint.value >= firstPoint.value;
  
  return (
    <div className="w-full h-16">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity="0" />
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
          stroke={isUp ? "#10b981" : "#ef4444"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    // Load balance from localStorage (UI state only)
    const storedBalance = localStorage.getItem("yuki_balance");
    if (storedBalance) {
      setTotalBalance(parseFloat(storedBalance));
    } else {
      const initial = 12438.72;
      setTotalBalance(initial);
      localStorage.setItem("yuki_balance", initial.toString());
    }
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

  // Calculate earnings
  const thirtyDayChange = totalBalance - balanceHistory[0].value;
  const thirtyDayPercent = ((thirtyDayChange / balanceHistory[0].value) * 100);
  const estimatedAPY = 7.8;
  const estimatedYearlyEarnings = totalBalance * (estimatedAPY / 100);
  const estimatedMonthlyEarnings = estimatedYearlyEarnings / 12;

  return (
    <div className="w-full min-h-screen pt-24 pb-12 relative">
      {/* Ambient glow */}
      <motion.div
        animate={{ opacity: [0.15, 0.25, 0.15], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#004BAD]/20 rounded-full blur-[150px] pointer-events-none"
      />

      <div className="px-4 sm:px-6 relative z-10">
        
        {/* Hero Balance Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 sm:mb-12"
        >
          <p className="text-white/40 text-sm uppercase tracking-widest">Total Balance</p>
          <div className='h-2 ' />
          <h1 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white mb-2 font-finder"
            style={{ 
              WebkitFontSmoothing: "antialiased",
              textRendering: "geometricPrecision",
            }}
          >
            ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h1>
          
          {/* Performance badge */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${thirtyDayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={thirtyDayChange >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
              </svg>
              <span className="text-sm font-semibold">
                {thirtyDayChange >= 0 ? '+' : ''}{thirtyDayPercent.toFixed(2)}%
              </span>
            </div>
            <span className="text-white/30 text-sm">Last 30 days</span>
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-4 gap-3 mb-10 sm:mb-12"
        >
          <QuickAction
            href="/send"
            variant="primary"
            icon={
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            }
            label="Send"
          />
          <QuickAction
            href="/funds"
            icon={
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
            label="Add"
          />
          <QuickAction
            href="/configure"
            icon={
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            }
            label="Configure"
          />
          <QuickAction
            href="/activity"
            icon={
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            label="Activity"
          />
        </motion.section>

        {/* Stats Grid */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-3 gap-3 sm:gap-4 mb-10 sm:mb-12"
        >
          <div className="bg-white/5 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#004BAD]" />
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">APY</p>
            </div>
            <p className="text-2xl sm:text-3xl font-finder text-white">{estimatedAPY}%</p>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Monthly</p>
            </div>
            <p className="text-2xl sm:text-3xl font-finder text-white">
              ${estimatedMonthlyEarnings.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </p>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${thirtyDayChange >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">30d</p>
            </div>
            <p className={`text-2xl sm:text-3xl font-finder ${thirtyDayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {thirtyDayChange >= 0 ? '+' : ''}${Math.abs(thirtyDayChange).toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </motion.section>

        {/* Two column layout for Portfolio and Activity */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Portfolio */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-white/40 text-sm uppercase tracking-widest mb-4">Portfolio</h2>
            
            <div className="bg-white/5 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Image
                      src="/images/yUSD.png"
                      alt="yUSD"
                      width={28}
                      height={28}
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-white">yUSD</p>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                        {estimatedAPY}% APY
                      </span>
                    </div>
                    <p className="text-sm text-white/40">Yuki USD Vault</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-finder text-white">
                    ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-white/40">
                    {totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} yUSD
                  </p>
                </div>
              </div>
              
              {/* Mini chart */}
              <div className="pt-4 border-t border-white/10">
                <BalanceChart data={balanceHistory} />
              </div>
            </div>
          </motion.section>

          {/* Recent Activity */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white/40 text-sm uppercase tracking-widest">Recent Activity</h2>
              <Link href="/activity" className="text-sm text-white/40 hover:text-white transition-colors font-medium">
                View All →
              </Link>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-5 sm:p-6 space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activity.type === "deposit" 
                        ? "bg-emerald-500/20" 
                        : "bg-white/10"
                    }`}>
                      <svg 
                        className={`w-5 h-5 ${
                          activity.type === "deposit" 
                            ? "text-emerald-400" 
                            : "text-white/60"
                        }`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        {activity.type === "deposit" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{activity.type}</p>
                      <p className="text-xs text-white/40">{activity.date}</p>
                    </div>
                  </div>
                  <p className={`text-base font-semibold ${
                    activity.type === "deposit" 
                      ? "text-emerald-400" 
                      : "text-white"
                  }`}>
                    {activity.type === "deposit" ? "+" : "-"}${activity.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

      </div>
    </div>
  );
}
