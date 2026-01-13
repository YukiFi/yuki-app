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
  variant = "default",
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
      <div
        className={`transition-transform group-hover:scale-110 ${
          variant === "primary" ? "text-black" : "text-white"
        }`}
      >
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

// Sparkline chart for balance history
function BalanceChart({
  data,
}: {
  data: { value: number; date: string }[];
}) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 100;
  const height = 50;
  const padding = 4;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y =
        height -
        padding -
        ((d.value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

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
          <linearGradient
            id="chartGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={isUp ? "#10b981" : "#ef4444"}
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor={isUp ? "#10b981" : "#ef4444"}
              stopOpacity="0"
            />
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
  const thirtyDayPercent = (thirtyDayChange / balanceHistory[0].value) * 100;
  const estimatedAPY = 7.8;
  const estimatedYearlyEarnings = totalBalance * (estimatedAPY / 100);
  const estimatedMonthlyEarnings = estimatedYearlyEarnings / 12;

  return (
    <div className="w-full min-h-screen mt-12 relative bg-[#15181A] rounded-3xl px-3 py-3">
      {/* Ambient glow */}
      <motion.div
        animate={{ opacity: [0.15, 0.25, 0.15], scale: [1, 1.05, 1] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#004BAD]/20 rounded-full blur-[150px] pointer-events-none"
      />

      <div className="mx-auto relative z-10 p-3">
        {/* Hero Balance Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <p className="">Balance</p>
          <div className="h-3" />
          <h1
            className="text-6xl mb-2 font-medium"
            style={{
              WebkitFontSmoothing: "antialiased",
              textRendering: "geometricPrecision",
            }}
          >
            <span className="">$</span>
            {totalBalance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h1>
        </motion.section>
      </div>

      {/* Two column layout for Portfolio and Activity */}
      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 bg-[#222529] rounded-3xl px-6 py-6">
        {/* Portfolio */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <h2 className="text-lg mb-2">
            Portfolio
          </h2>

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
                  $
                  {totalBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-sm text-white/40">
                  {totalBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  yUSD
                </p>
              </div>
            </div>

            {/* Mini chart */}
            <div className="pt-4 border-t border-white/10">
              <BalanceChart data={balanceHistory} />
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
