"use client";

import { useState, useEffect } from "react";

export default function Portfolio() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      setIsLoggedIn(status === "true");

      const storedBalances = localStorage.getItem("yuki_balances");
      if (storedBalances) {
        setBalances(JSON.parse(storedBalances));
      } else if (status === "true") {
        setBalances({ "yuki-stable": 1000 });
      }
    };

    checkLoginStatus();
  }, []);

  // Mock history based on balance
  const history = isLoggedIn ? [
     {
        id: 1,
        type: "Deposit",
        asset: "USDC",
        amount: "+$1,000.00",
        vault: "Yuki Stable Vault",
        date: "Today, 10:23 AM",
        status: "Completed",
        tx: "0x8f...2a9c"
     },
     ...Object.entries(balances).flatMap(([key, val], idx) => {
        // If user added extra funds via the vaults page, show dummy history
        if (key === "yuki-stable" && val > 1000) {
             return [{
                id: `extra-${idx}`,
                type: "Deposit",
                asset: "USDC",
                amount: `+$${(val - 1000).toLocaleString()}`,
                vault: "Yuki Stable Vault",
                date: "Today, 10:45 AM",
                status: "Completed",
                tx: `0x${Math.random().toString(16).substr(2, 8)}`
             }];
        }
        if (key !== "yuki-stable" && val > 0) {
             return [{
                id: `new-${idx}`,
                type: "Deposit",
                asset: key === 'eth-yield' ? 'ETH' : 'SOL',
                amount: `+$${val.toLocaleString()}`,
                vault: key === 'eth-yield' ? 'ETH Yield Strategy' : 'SOL Turbo',
                date: "Today, 10:50 AM",
                status: "Completed",
                tx: `0x${Math.random().toString(16).substr(2, 8)}`
             }];
        }
        return [];
     })
  ] : [];

  const totalBalance = Object.values(balances).reduce((acc, val) => acc + val, 0);

  if (!isLoggedIn) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center text-center animate-fade-in">
         <p className="text-gray-400">Connect your wallet to view portfolio.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-fdfffc mb-2">Portfolio</h1>
          <p className="text-gray-400">
            Track your assets and performance across all Yuki vaults.
          </p>
        </div>
        <div className="text-right">
            <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Net Worth</div>
            <div className="text-3xl font-medium text-fdfffc">${totalBalance.toLocaleString()}</div>
        </div>
      </div>

      {/* Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-1 glass p-6 rounded-md border border-white/5">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Asset Allocation</h3>
            <div className="flex items-center justify-center h-48 relative">
                {/* Simple CSS Donut Chart Representation */}
                <div className="w-32 h-32 rounded-full border-[16px] border-blue-500 border-t-purple-500 border-r-blue-500 border-b-blue-500 relative">
                   <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-400">Mixed</span>
                   </div>
                </div>
            </div>
            <div className="space-y-3 mt-6">
                {Object.entries(balances).map(([key, val]) => val > 0 && (
                    <div key={key} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${key.includes('eth') ? 'bg-purple-500' : key.includes('sol') ? 'bg-teal-500' : 'bg-blue-500'}`}></div>
                            <span className="text-gray-300 capitalize">{key.replace('-', ' ')}</span>
                        </div>
                        <span className="text-fdfffc font-medium">{((val / totalBalance) * 100).toFixed(1)}%</span>
                    </div>
                ))}
            </div>
         </div>

         <div className="lg:col-span-2 glass p-6 rounded-md border border-white/5">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Transaction History</h3>
                <button className="text-xs text-accent-primary hover:text-white transition-colors cursor-pointer">Export CSV</button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/5 text-gray-500 uppercase tracking-wider text-xs">
                            <th className="pb-3 font-medium">Type</th>
                            <th className="pb-3 font-medium">Asset</th>
                            <th className="pb-3 font-medium">Amount</th>
                            <th className="pb-3 font-medium">Vault</th>
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {history.map((tx) => (
                            <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="py-4 text-fdfffc">{tx.type}</td>
                                <td className="py-4 text-gray-400">{tx.asset}</td>
                                <td className="py-4 text-green-400 font-medium">{tx.amount}</td>
                                <td className="py-4 text-gray-400">{tx.vault}</td>
                                <td className="py-4 text-gray-500 text-xs">{tx.date}</td>
                                <td className="py-4 text-right">
                                    <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-medium">
                                        {tx.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {history.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No transactions found.</div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
}

