"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

// Savings profile definitions - using friendly names and ranges, not exact APYs
const savingsProfiles = [
  {
    id: "yuki-stable",
    name: "Stable",
    description: "Currently earning ~4–6%",
    asset: "USDC",
    apyRange: "4–6%",
    apyValue: 5,
  },
  {
    id: "eth-yield",
    name: "Balanced",
    description: "Currently earning ~6–9%",
    asset: "USDC",
    apyRange: "6–9%",
    apyValue: 7.5,
  },
  {
    id: "sol-turbo",
    name: "Growth",
    description: "Currently earning ~8–12%",
    asset: "USDC",
    apyRange: "8–12%",
    apyValue: 10,
  },
];

type TimeRange = "1W" | "1M" | "3M" | "All";

const generateHistoricalData = (
  balances: Record<string, number>,
  timeRange: TimeRange
) => {
  const days = timeRange === "1W" ? 7 : timeRange === "1M" ? 30 : timeRange === "3M" ? 90 : 365;
  const data: { date: string; value: number }[] = [];
  
  const totalBalance = Object.values(balances).reduce((acc, val) => acc + val, 0);
  
  const weightedAPY = savingsProfiles.reduce((acc, profile) => {
    const balance = balances[profile.id] || 0;
    if (balance === 0 || totalBalance === 0) return acc;
    return acc + (balance / totalBalance) * (profile.apyValue / 100);
  }, 0);

  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const earningsSoFar = totalBalance * weightedAPY * (i / 365);
    const historicalBalance = Math.max(0, totalBalance - earningsSoFar);
    
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: historicalBalance,
    });
  }
  
  return data;
};

// Simple, calm line chart
function GrowthChart({ 
  data, 
  timeRange, 
  onTimeRangeChange,
}: { 
  data: { date: string; value: number }[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (data.length === 0) return { points: "", areaPath: "", pointsArray: [] as { x: number; y: number; data: typeof data[0] }[] };
    
    const values = data.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const padding = range * 0.15;

    const pointsArray = data.map((d, i) => {
      const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100;
      const y = 100 - (((d.value) - min + padding) / (range + padding * 2)) * 100;
      return { x, y, data: d };
    });

    const pointsStr = pointsArray.map(p => `${p.x},${p.y}`).join(" ");
    const areaPath = `M${pointsArray[0].x},100 L${pointsArray.map(p => `${p.x},${p.y}`).join(" L")} L${pointsArray[pointsArray.length - 1].x},100 Z`;

    return { points: pointsStr, areaPath, pointsArray };
  }, [data]);

  return (
    <div className="relative">
      {/* Chart */}
      <div className="relative h-48 md:h-56">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="chartAreaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1148D0" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#1148D0" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          {chartData.areaPath && chartData.areaPath.length > 10 && (
            <path d={chartData.areaPath} fill="url(#chartAreaGradient)" />
          )}

          {/* Line */}
          {chartData.points && chartData.points.length > 0 && (
            <polyline
              points={chartData.points}
              fill="none"
              stroke="#1148D0"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          )}

          {/* Hover areas */}
          {data.map((_, i) => (
            <rect
              key={i}
              x={(i / data.length) * 100}
              y="0"
              width={100 / data.length}
              height="100"
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHoveredIndex(i)}
            />
          ))}

          {/* Hover vertical line */}
          {hoveredIndex !== null && chartData.pointsArray[hoveredIndex] && (
            <line
              x1={chartData.pointsArray[hoveredIndex].x}
              y1="0"
              x2={chartData.pointsArray[hoveredIndex].x}
              y2="100"
              stroke="white"
              strokeOpacity="0.1"
              strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        
        {/* Hover dot - positioned absolutely to avoid SVG distortion */}
        {hoveredIndex !== null && chartData.pointsArray[hoveredIndex] && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${chartData.pointsArray[hoveredIndex].x}%`,
              top: `${chartData.pointsArray[hoveredIndex].y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#1148D0] border-2 border-white shadow-lg" />
          </div>
        )}
        
        {/* Hovered value tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="absolute top-2 left-2 text-xs text-gray-400">
            {data[hoveredIndex].date}: ${data[hoveredIndex].value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
      </div>

      {/* Time range toggles - understated */}
      <div className="flex items-center justify-center gap-1 mt-6">
        {(["1W", "1M", "3M", "All"] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => onTimeRangeChange(range)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              timeRange === range
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-gray-400"
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
}

// Savings card component
function SavingsCard({ 
  profile, 
  balance,
  isExpanded,
  onToggle,
}: { 
  profile: typeof savingsProfiles[0]; 
  balance: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-medium text-white">{profile.name}</h3>
          <span className="text-2xl font-medium text-white">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-sm text-gray-500">{profile.description}</p>
      </div>
      
      {/* View details toggle */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-3 text-xs text-gray-500 hover:text-gray-400 border-t border-white/5 transition-colors cursor-pointer flex items-center justify-between"
      >
        <span>View details</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Expanded details */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Yield range</span>
            <span className="text-gray-300">{profile.apyRange} annually</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Asset</span>
            <span className="text-gray-300">{profile.asset}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Strategy</span>
            <span className="text-gray-300">Automated allocation</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Rebalancing</span>
            <span className="text-gray-300">Daily</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Activity item component
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
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          type === "deposit" ? "bg-green-500/10" : "bg-white/5"
        }`}>
          {type === "deposit" ? (
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0-16l-4 4m4-4l4 4" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V4m0 16l-4-4m4 4l4-4" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-white capitalize">{type}</p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
      </div>
      <span className={`text-sm font-medium ${type === "deposit" ? "text-green-500" : "text-white"}`}>
        {type === "deposit" ? "+" : "-"}${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}

// Landing Hero for non-authenticated users
function LandingHero() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl md:text-6xl font-medium text-white tracking-tight mb-6 max-w-3xl leading-[1.15]">
        Your savings,{" "}
        <span className="text-gray-400">
          growing quietly
        </span>
      </h1>
      
      <p className="text-lg text-gray-500 max-w-lg mb-12 leading-relaxed">
        Deposit your savings. Watch them grow. Withdraw anytime.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/signin"
          className="px-8 py-4 bg-white text-black rounded-full text-base font-medium hover:bg-gray-100 transition-all"
        >
          Get started
        </Link>
        <Link
          href="/vaults"
          className="px-8 py-4 text-gray-400 rounded-full text-base font-medium hover:text-white transition-all"
        >
          Learn more
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [timeRange, setTimeRange] = useState<TimeRange>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

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
  const activeProfiles = savingsProfiles.filter(profile => (balances[profile.id] || 0) > 0);
  
  // Calculate all-time earnings (simulated)
  const allTimeEarnings = totalBalance * 0.035; // ~3.5% earned so far
  
  const historicalData = useMemo(
    () => generateHistoricalData(balances, timeRange),
    [balances, timeRange]
  );

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Mock activity data
  const recentActivity = [
    { type: "deposit" as const, amount: 2000, date: "Dec 15, 2024" },
    { type: "deposit" as const, amount: 5000, date: "Nov 28, 2024" },
    { type: "withdrawal" as const, amount: 500, date: "Nov 10, 2024" },
    { type: "deposit" as const, amount: 6000, date: "Oct 1, 2024" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LandingHero />;
  }

  return (
    <div className="w-full mx-auto px-4 pb-24 animate-fade-in">
      {/* Hero: Portfolio Value */}
      <section className="pt-12 pb-8 text-center">
        <p className="text-sm text-gray-500 mb-3">Total Savings</p>
        <h1 className="text-5xl md:text-6xl font-medium text-white tracking-tight mb-4">
          ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h1>
        {allTimeEarnings > 0 && (
          <p className="text-sm text-blue-500">
            +${allTimeEarnings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} all-time
          </p>
        )}
      </section>

      {/* Growth Graph */}
      {totalBalance > 0 && (
        <section className="mb-12">
          <GrowthChart 
            data={historicalData}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </section>
      )}

      {/* Primary Actions */}
      <section className="flex gap-3 mb-16">
        <Link
          href="/vaults"
          className="flex-1 py-4 bg-white text-black rounded-full text-center font-medium hover:bg-gray-100 transition-all"
        >
          Deposit
        </Link>
        <button
          className="flex-1 py-4 bg-white/5 text-white rounded-full text-center font-medium hover:bg-white/10 transition-all border border-white/10 cursor-pointer"
        >
          Withdraw
        </button>
      </section>

      {/* Your Savings */}
      {activeProfiles.length > 0 && (
        <section className="mb-16">
          <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Your Savings</h2>
          <div className="space-y-3">
            {activeProfiles.map((profile) => (
              <SavingsCard
                key={profile.id}
                profile={profile}
                balance={balances[profile.id] || 0}
                isExpanded={expandedCards[profile.id] || false}
                onToggle={() => toggleCard(profile.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Assets */}
      <section className="mb-16">
        <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Assets</h2>
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="text-xs font-medium text-blue-400">$</span>
              </div>
              <span className="text-white font-medium">USDC</span>
            </div>
            <span className="text-gray-400">100%</span>
          </div>
        </div>
      </section>

      {/* Activity */}
      <section>
        <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Activity</h2>
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 px-6">
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

      {/* Empty State */}
      {activeProfiles.length === 0 && (
        <section className="text-center py-16">
          <p className="text-gray-500 mb-6">You haven&apos;t deposited any savings yet.</p>
          <Link
            href="/vaults"
            className="inline-block px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-all"
          >
            Make your first deposit
          </Link>
        </section>
      )}
    </div>
  );
}
