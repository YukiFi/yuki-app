"use client";

import { useState, useEffect } from "react";

const vaults = [
  {
    id: "yuki-stable",
    name: "Yuki Stable Vault",
    description: "Automated yield farming on Aave & Compound stablecoin pools.",
    asset: "USDC",
    apy: "15.4%",
    tvl: "$12.4M",
    risk: "Low",
  },
  {
    id: "eth-yield",
    name: "ETH Yield Strategy",
    description: "Leveraged staking yields via Lido & RocketPool.",
    asset: "ETH",
    apy: "4.2%",
    tvl: "$8.1M",
    risk: "Medium",
  },
  {
    id: "sol-turbo",
    name: "SOL Turbo",
    description: "High-frequency LP provision on Solana DEXs.",
    asset: "SOL",
    apy: "18.9%",
    tvl: "$3.2M",
    risk: "High",
  },
];

export default function Vaults() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<string | null>(null); // vault id being processed

  useEffect(() => {
    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      setIsLoggedIn(status === "true");
      
      // Load balances
      const storedBalances = localStorage.getItem("yuki_balances");
      if (storedBalances) {
        setBalances(JSON.parse(storedBalances));
      } else if (status === "true") {
        // Default mock balance for logged in users
        const initial = { "yuki-stable": 1000 };
        setBalances(initial);
        localStorage.setItem("yuki_balances", JSON.stringify(initial));
      }
    };

    checkLoginStatus();
  }, []);

  const handleDeposit = (vaultId: string) => {
    if (!isLoggedIn) {
        alert("Please connect your wallet or start with a card first.");
        return;
    }
    setLoading(vaultId);
    setTimeout(() => {
        const newBalances = { ...balances, [vaultId]: (balances[vaultId] || 0) + 500 };
        setBalances(newBalances);
        localStorage.setItem("yuki_balances", JSON.stringify(newBalances));
        setLoading(null);
        
        // Trigger global update
        window.dispatchEvent(new Event("yuki_login_update"));
    }, 1000);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-medium text-fdfffc mb-2">Vaults</h1>
        <p className="text-gray-400 max-w-2xl">
          Choose from our curated selection of automated yield strategies.
          Deposits are non-custodial and can be withdrawn at any time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {vaults.map((vault) => (
          <div
            key={vault.id}
            className="glass p-6 rounded-md border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${
                    vault.asset === "USDC"
                      ? "bg-blue-500/20 text-blue-400"
                      : vault.asset === "ETH"
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-teal-500/20 text-teal-400"
                  }`}
                >
                  <span className="font-bold text-sm">{vault.asset}</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-medium text-fdfffc">
                      {vault.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium rounded ${
                        vault.risk === "Low"
                          ? "bg-green-500/10 text-green-400"
                          : vault.risk === "Medium"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-orange-500/10 text-orange-400"
                      }`}
                    >
                      {vault.risk} Risk
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 max-w-lg">
                    {vault.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 md:justify-end w-full md:w-auto">
                 <div className="flex flex-col items-start md:items-end min-w-[80px]">
                    <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">APY</span>
                    <span className="text-xl font-medium text-green-400">{vault.apy}</span>
                 </div>
                 <div className="flex flex-col items-start md:items-end min-w-[80px]">
                    <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">TVL</span>
                    <span className="text-lg font-medium text-fdfffc">{vault.tvl}</span>
                 </div>
                 <div className="flex flex-col items-start md:items-end min-w-[100px]">
                    <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Balance</span>
                    <span className="text-lg font-medium text-fdfffc">
                        {balances[vault.id] 
                            ? `$${balances[vault.id].toLocaleString()}` 
                            : "$0.00"}
                    </span>
                 </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                 <button 
                    onClick={() => handleDeposit(vault.id)}
                    disabled={loading === vault.id}
                    className="flex-1 md:flex-none px-6 py-2 bg-white text-dark-900 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                 >
                    {loading === vault.id ? (
                        <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                    ) : (
                        "Deposit"
                    )}
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

