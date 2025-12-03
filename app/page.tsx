"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Simulated data
const mockChartData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: 1000 * (1 + (0.15 / 365) * (i + 1)), // 15% APY curve
}));

const activeVaults = [
  {
    id: "yuki-stable",
    name: "Yuki Stable Vault",
    asset: "USDC",
    apy: "15.4%",
    earned: "$1.24",
    status: "Active",
  },
  {
    id: "eth-yield",
    name: "ETH Yield Strategy",
    asset: "ETH",
    apy: "4.2%",
    earned: "0.00 ETH",
    status: "Inactive",
  },
];

const recentActivity = [
  {
    id: 1,
    type: "Deposit",
    asset: "USDC",
    amount: "+$1,000.00",
    date: "Today, 10:23 AM",
    status: "Completed",
  },
  {
    id: 2,
    type: "Interest",
    asset: "USDC",
    amount: "+$1.24",
    date: "Today, 09:00 AM",
    status: "Completed",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

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

  // Simple SVG Chart Component
  const Chart = () => {
    const maxVal = Math.max(...mockChartData.map((d) => d.value));
    const minVal = Math.min(...mockChartData.map((d) => d.value));
    // Scale values to fit SVG height (100px)
    const points = mockChartData
      .map((d, i) => {
        const x = (i / (mockChartData.length - 1)) * 100;
        const y = 100 - ((d.value - minVal) / (maxVal - minVal || 1)) * 80 - 10; // Leave margin
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div className="w-full h-32 mt-4 relative overflow-hidden rounded-md bg-gradient-to-b from-accent-primary/5 to-transparent border border-white/5">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Gradient fill area */}
          <path
            d={`M0,100 L0,${100 - ((mockChartData[0].value - minVal) / (maxVal - minVal || 1)) * 80 - 10} ${points.replace(/,/g, " ")} L100,100 Z`}
            fill="url(#chartGradient)"
            className="opacity-20"
          />
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#0F52FB"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0F52FB" />
              <stop offset="100%" stopColor="#0F52FB" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  const handleDeposit = () => {
      // Just simulate adding 100 to Yuki Stable Vault for demo
      const newBalances = { ...balances, "yuki-stable": (balances["yuki-stable"] || 0) + 100 };
      setBalances(newBalances);
      localStorage.setItem("yuki_balances", JSON.stringify(newBalances));
      setShowDepositModal(false);
      window.dispatchEvent(new Event("yuki_login_update"));
  };

  const handleWithdraw = () => {
      // Just simulate removing 100
      if ((balances["yuki-stable"] || 0) >= 100) {
          const newBalances = { ...balances, "yuki-stable": (balances["yuki-stable"] || 0) - 100 };
          setBalances(newBalances);
          localStorage.setItem("yuki_balances", JSON.stringify(newBalances));
          window.dispatchEvent(new Event("yuki_login_update"));
      } else {
          alert("Insufficient funds for mock withdrawal.");
      }
      setShowWithdrawModal(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-4 shadow-lg backdrop-blur-sm">
          <svg
            className="w-10 h-10 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-medium text-fdfffc">
          Connect to start earning
        </h1>
        <p className="text-gray-400 max-w-md">
          Access institutional-grade yields with full self-custody. Connect your
          wallet or create a new one instantly.
        </p>
        <div className="flex gap-4">
          <Link
            href="/onboarding"
            className="px-6 py-3 bg-accent-primary text-white rounded-md text-sm font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all"
          >
            Start with Card
          </Link>
          <button className="px-6 py-3 bg-white/5 text-fdfffc rounded-md text-sm font-medium border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12 animate-fade-in">
      {/* Header Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Balance Card */}
        <div className="lg:col-span-2 glass p-6 rounded-md border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 transition-opacity group-hover:opacity-20">
             <svg className="w-32 h-32 text-accent-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12.5 7H11v4.17l-3.2 1.9 1 1.5 3.7-2.1V7z"/></svg>
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Balance</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                +15.4% APY
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl sm:text-5xl font-medium text-fdfffc tracking-tight">
                ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-gray-500 font-mono">USD</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDepositModal(true)}
                className="px-4 py-2 bg-white text-dark-900 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Deposit
              </button>
              <button 
                onClick={() => setShowWithdrawModal(true)}
                className="px-4 py-2 bg-white/5 text-fdfffc border border-white/10 rounded-md text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m8-8l-8 8 8 8" /></svg>
                Withdraw
              </button>
            </div>
            
            <Chart />
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="space-y-6">
           {/* Earnings Card */}
          <div className="glass p-6 rounded-md border border-white/5 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Lifetime Earnings</h3>
              <div className="text-3xl font-medium text-accent-primary mb-1">+$1.24</div>
              <p className="text-xs text-gray-500">Accumulated from yield strategies</p>
            </div>
            <div className="mt-6 pt-6 border-t border-white/5">
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-gray-400">Next Payout</span>
                 <span className="text-fdfffc">~12 hours</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-gray-400">Est. Monthly</span>
                 <span className="text-green-400">+$12.50</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Vaults */}
        <div className="lg:col-span-2">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-fdfffc">Active Strategies</h3>
              <button onClick={() => router.push('/vaults')} className="text-sm text-accent-primary hover:text-white transition-colors cursor-pointer">View All</button>
           </div>
           <div className="space-y-3">
              {activeVaults.map((vault) => (
                <div 
                    key={vault.id} 
                    onClick={() => router.push('/vaults')}
                    className="glass p-4 rounded-md border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                >
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-md flex items-center justify-center ${vault.asset === 'USDC' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            <span className="font-bold text-xs">{vault.asset}</span>
                         </div>
                         <div>
                            <h4 className="text-fdfffc font-medium group-hover:text-accent-primary transition-colors">{vault.name}</h4>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                               <span className={`w-1.5 h-1.5 rounded-full ${vault.status === 'Active' ? 'bg-green-500' : 'bg-gray-600'}`}></span>
                               {vault.status}
                            </span>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-fdfffc font-medium">{balances[vault.id] ? `$${balances[vault.id].toLocaleString()}` : '$0.00'}</div>
                         <div className="text-xs text-green-400">+{vault.earned} earned</div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Recent Activity */}
        <div>
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-fdfffc">Recent Activity</h3>
           </div>
           <div className="glass rounded-md border border-white/5 divide-y divide-white/5">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                   <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-fdfffc">{activity.type}</span>
                      <span className="text-sm font-medium text-green-400">{activity.amount}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{activity.date}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{activity.status}</span>
                   </div>
                </div>
              ))}
              <button onClick={() => router.push('/portfolio')} className="w-full p-3 text-xs text-center text-gray-400 hover:text-fdfffc transition-colors cursor-pointer">
                 View Full History
              </button>
           </div>
        </div>
      </div>

      {/* Deposit Modal Mock */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-dark-800 p-6 rounded-lg border border-white/10 w-full max-w-sm shadow-xl">
                <h3 className="text-lg font-medium text-fdfffc mb-4">Deposit Mock Funds</h3>
                <p className="text-gray-400 text-sm mb-6">Add $100.00 to Yuki Stable Vault?</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowDepositModal(false)} className="flex-1 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleDeposit} className="flex-1 py-2 bg-accent-primary text-white rounded-md font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all">Confirm</button>
                </div>
            </div>
        </div>
      )}

      {/* Withdraw Modal Mock */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-dark-800 p-6 rounded-lg border border-white/10 w-full max-w-sm shadow-xl">
                <h3 className="text-lg font-medium text-fdfffc mb-4">Withdraw Mock Funds</h3>
                <p className="text-gray-400 text-sm mb-6">Withdraw $100.00 from Yuki Stable Vault?</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowWithdrawModal(false)} className="flex-1 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleWithdraw} className="flex-1 py-2 bg-white/5 text-fdfffc border border-white/10 rounded-md font-medium hover:bg-white/10 transition-all">Confirm</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
