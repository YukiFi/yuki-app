"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Vault definitions
const vaultDefinitions = [
  {
    id: "yuki-stable",
    name: "Safe Vault",
    asset: "USDC",
    apy: "15.4%",
    risk: "Low",
  },
  {
    id: "eth-yield",
    name: "Moderate Vault",
    asset: "ETH",
    apy: "4.2%",
    risk: "Medium",
  },
  {
    id: "sol-turbo",
    name: "Aggressive Vault",
    asset: "SOL",
    apy: "18.9%",
    risk: "High",
  },
];

type TimeRange = "7D" | "30D" | "90D" | "1Y";

// Generate historical data based on current balances and APYs
const generateHistoricalData = (
  balances: Record<string, number>,
  timeRange: TimeRange
) => {
  const days = timeRange === "7D" ? 7 : timeRange === "30D" ? 30 : timeRange === "90D" ? 90 : 365;
  const data: { date: string; balance: number; earnings: number }[] = [];
  
  const totalBalance = Object.values(balances).reduce((acc, val) => acc + val, 0);
  
  // Calculate weighted average APY
  const weightedAPY = vaultDefinitions.reduce((acc, vault) => {
    const balance = balances[vault.id] || 0;
    if (balance === 0) return acc;
    const apyPercent = parseFloat(vault.apy) / 100;
    return acc + (balance / totalBalance) * apyPercent;
  }, 0);

  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Calculate balance at this point (working backwards from current)
    const daysFromNow = i;
    const earningsSoFar = totalBalance * weightedAPY * (daysFromNow / 365);
    const historicalBalance = Math.max(0, totalBalance - earningsSoFar);
    const earnings = totalBalance - historicalBalance;
    
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      balance: historicalBalance,
      earnings: earnings,
    });
  }
  
  return data;
};

// Chart Component
function BalanceChart({ 
  data, 
  timeRange, 
  onTimeRangeChange 
}: { 
  data: { date: string; balance: number; earnings: number }[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const { maxValue, minValue, points, earningsPoints } = useMemo(() => {
    if (data.length === 0) return { maxValue: 0, minValue: 0, points: "", earningsPoints: "" };
    
    const values = data.map(d => d.balance);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    // Generate points for balance line
    const balancePoints = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.balance - min) / range) * 80 - 10;
      return `${x},${y}`;
    }).join(" ");

    // Generate points for earnings area
    const earningsPointsStr = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.earnings) / max) * 30;
      return `${x},${y}`;
    }).join(" ");

    return {
      maxValue: max,
      minValue: min,
      points: balancePoints,
      earningsPoints: earningsPointsStr,
    };
  }, [data]);

  const currentData = hoveredPoint !== null ? data[hoveredPoint] : data[data.length - 1];
  const previousBalance = hoveredPoint !== null && hoveredPoint > 0 ? data[hoveredPoint - 1].balance : data[0].balance;
  const change = currentData.balance - previousBalance;
  const changePercent = previousBalance > 0 ? (change / previousBalance) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            {hoveredPoint !== null ? currentData.date : "Current Balance"}
          </p>
          <p className="text-3xl font-medium text-fdfffc">
            ${currentData.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {change !== 0 && (
            <p className={`text-sm mt-1 ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {change >= 0 ? "+" : ""}${change.toFixed(2)} ({changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%)
            </p>
          )}
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/5">
          {(["7D", "30D", "90D", "1Y"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                timeRange === range
                  ? "bg-accent-primary text-white"
                  : "text-gray-400 hover:text-fdfffc"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48 rounded-lg bg-gradient-to-b from-accent-primary/5 to-transparent border border-white/5 overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeWidth="0.1" className="text-white/5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.1" className="text-white/5" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" strokeWidth="0.1" className="text-white/5" />

          {/* Earnings area (subtle background) */}
          {earningsPoints && (
            <path
              d={`M0,100 ${earningsPoints} L100,100 Z`}
              fill="url(#earningsGradient)"
              className="opacity-30"
            />
          )}

          {/* Balance gradient area */}
          {points && (
            <>
              <path
                d={`M0,100 L${points.split(" ")[0]} ${points} L100,100 Z`}
                fill="url(#chartGradient)"
                className="opacity-20"
              />
              
              {/* Balance line */}
              <polyline
                points={points}
                fill="none"
                stroke="#0F52FB"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                className="drop-shadow-lg"
              />
            </>
          )}

          {/* Hover points */}
          {points && data.map((d, i) => {
            const [x, y] = points.split(" ")[i].split(",").map(Number);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="0.8"
                  fill="#0F52FB"
                  className={`transition-all ${hoveredPoint === i ? "opacity-100" : "opacity-0"}`}
                />
                <rect
                  x={x - 2}
                  y="0"
                  width="4"
                  height="100"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(i)}
                />
              </g>
            );
          })}

          {/* Gradients */}
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0F52FB" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0F52FB" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="earningsGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Chart Legend */}
      <div className="flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-accent-primary"></div>
          <span className="text-gray-400">Balance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-400 opacity-50"></div>
          <span className="text-gray-400">Earnings</span>
        </div>
      </div>
    </div>
  );
}

// APY Distribution Chart
function APYDistribution({ balances }: { balances: Record<string, number> }) {
  const totalBalance = Object.values(balances).reduce((acc, val) => acc + val, 0);
  
  const distribution = vaultDefinitions
    .map(vault => ({
      ...vault,
      balance: balances[vault.id] || 0,
      percentage: totalBalance > 0 ? ((balances[vault.id] || 0) / totalBalance) * 100 : 0,
    }))
    .filter(v => v.balance > 0);

  if (distribution.length === 0) return null;

  const colors = {
    "yuki-stable": "#3B82F6",
    "eth-yield": "#A855F7", 
    "sol-turbo": "#14B8A6",
  };

  let currentAngle = -90;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-400">Asset Allocation</h3>
      
      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div className="relative w-32 h-32 shrink-0">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {distribution.map((vault, index) => {
              const angle = (vault.percentage / 100) * 360;
              const radius = 40;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (vault.percentage / 100) * circumference;
              
              const segment = (
                <circle
                  key={vault.id}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={colors[vault.id as keyof typeof colors]}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{
                    transformOrigin: "center",
                    transform: `rotate(${currentAngle}deg)`,
                  }}
                  className="transition-all duration-300"
                />
              );
              
              currentAngle += angle;
              return segment;
            })}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-medium text-fdfffc">{distribution.length}</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3 flex-1">
          {distribution.map(vault => (
            <div key={vault.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[vault.id as keyof typeof colors] }}
                ></div>
                <span className="text-sm text-gray-400">{vault.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-fdfffc">
                  ${vault.balance.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{vault.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [timeRange, setTimeRange] = useState<TimeRange>("30D");

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
              const initial = { "yuki-stable": 1000 };
              setBalances(initial);
              localStorage.setItem("yuki_balances", JSON.stringify(initial));
          }
      } else {
          setBalances({});
      }
    };

    checkLoginStatus();
    window.addEventListener("yuki_login_update", checkLoginStatus);
    return () =>
      window.removeEventListener("yuki_login_update", checkLoginStatus);
  }, []);

  const totalBalance = Object.values(balances).reduce((acc, val) => acc + val, 0);
  const activeVaults = vaultDefinitions.filter(vault => (balances[vault.id] || 0) > 0);
  const dailyEarnings = vaultDefinitions.reduce((acc, vault) => {
    const balance = balances[vault.id] || 0;
    const apyPercent = parseFloat(vault.apy) / 100;
    return acc + (balance * apyPercent / 365);
  }, 0);

  const historicalData = useMemo(
    () => generateHistoricalData(balances, timeRange),
    [balances, timeRange]
  );

  if (!isLoggedIn) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-medium text-fdfffc tracking-tight">
            Start earning today
          </h1>
          <p className="text-lg text-gray-400 max-w-md">
            Secure, transparent yields on your digital assets.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/signin"
            className="px-8 py-3.5 bg-accent-primary text-white rounded-lg text-sm font-medium shadow-lg shadow-accent-primary/20 hover:shadow-xl hover:shadow-accent-primary/30 transition-all"
          >
            Get Started
          </Link>
          <Link
            href="/vaults"
            className="px-8 py-3.5 bg-white/5 text-fdfffc rounded-lg text-sm font-medium border border-white/10 hover:bg-white/10 transition-all"
          >
            View Vaults
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-16 animate-fade-in">
      {/* Performance Chart */}
      {totalBalance > 0 && (
        <div className="glass rounded-2xl border border-white/5 p-6 md:p-8">
          <BalanceChart 
            data={historicalData}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl border border-white/5 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Balance</p>
          <p className="text-3xl font-medium text-fdfffc">
            ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="glass rounded-xl border border-white/5 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Daily Earnings</p>
          <p className="text-3xl font-medium text-green-400">
            +${dailyEarnings.toFixed(2)}
          </p>
        </div>
        
        <div className="glass rounded-xl border border-white/5 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Monthly Projection</p>
          <p className="text-3xl font-medium text-accent-primary">
            +${(dailyEarnings * 30).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Allocation Chart */}
      {activeVaults.length > 0 && (
        <div className="glass rounded-2xl border border-white/5 p-6 md:p-8">
          <APYDistribution balances={balances} />
        </div>
      )}

      {/* Active Positions */}
      {activeVaults.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-fdfffc">Your Vaults</h2>
            <Link 
              href="/vaults" 
              className="text-sm text-gray-400 hover:text-fdfffc transition-colors"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-2">
            {activeVaults.map((vault) => {
              const balance = balances[vault.id] || 0;
              const apyPercent = parseFloat(vault.apy) / 100;
              const dailyEarn = balance * apyPercent / 365;

              return (
                <div
                  key={vault.id}
                  onClick={() => router.push(`/vaults/${vault.id}`)}
                  className="glass rounded-xl border border-white/5 p-5 hover:border-white/10 hover:bg-white/[0.02] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-medium text-fdfffc group-hover:text-accent-primary transition-colors">
                          {vault.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {vault.asset}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Balance: </span>
                          <span className="text-fdfffc font-medium">${balance.toLocaleString()}</span>
                        </div>
                        <div className="h-3 w-px bg-white/10"></div>
                        <div>
                          <span className="text-gray-500">APY: </span>
                          <span className="text-green-400 font-medium">{vault.apy}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Daily</p>
                      <p className="text-base font-medium text-accent-primary">+${dailyEarn.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeVaults.length === 0 && (
        <div className="glass rounded-xl border border-white/5 p-10 text-center">
          <div className="max-w-sm mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-medium text-fdfffc mb-2">Start Earning</h3>
              <p className="text-sm text-gray-400 mb-6">
                Choose a vault to deposit your funds and start earning yield automatically.
              </p>
              <Link
                href="/vaults"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 transition-colors"
              >
                Browse Vaults
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/vaults"
          className="glass rounded-xl border border-white/5 p-5 hover:border-white/10 hover:bg-white/[0.02] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-fdfffc group-hover:text-accent-primary transition-colors">Vaults</p>
              <p className="text-xs text-gray-500">Explore strategies</p>
            </div>
          </div>
        </Link>

        <Link
          href="/portfolio"
          className="glass rounded-xl border border-white/5 p-5 hover:border-white/10 hover:bg-white/[0.02] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-fdfffc group-hover:text-accent-primary transition-colors">History</p>
              <p className="text-xs text-gray-500">View transactions</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
