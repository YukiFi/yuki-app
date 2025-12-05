"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const vaults = [
  {
    id: "yuki-stable",
    name: "Safe Vault",
    description: "Low-risk automated yield farming on stablecoin pools.",
    asset: "USDC",
    apy: "15.4%",
    tvl: "$12.4M",
    risk: "Low",
  },
  {
    id: "eth-yield",
    name: "Moderate Vault",
    description: "Balanced risk with leveraged staking strategies.",
    asset: "ETH",
    apy: "4.2%",
    tvl: "$8.1M",
    risk: "Medium",
  },
  {
    id: "sol-turbo",
    name: "Aggressive Vault",
    description: "High-risk, high-reward liquidity provision strategies.",
    asset: "SOL",
    apy: "18.9%",
    tvl: "$3.2M",
    risk: "High",
  },
];

export default function Vaults() {
  const router = useRouter();
  const [balances, setBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      
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
    window.addEventListener("yuki_login_update", checkLoginStatus);
    return () => window.removeEventListener("yuki_login_update", checkLoginStatus);
  }, []);

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
            onClick={() => router.push(`/vaults/${vault.id}`)}
            className="glass p-6 rounded-xl border border-white/5 hover:border-accent-primary/30 hover:shadow-lg hover:shadow-accent-primary/5 transition-all cursor-pointer group"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                    vault.asset === "USDC"
                      ? "bg-blue-500/20 text-blue-400"
                      : vault.asset === "ETH"
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-teal-500/20 text-teal-400"
                  }`}
                >
                  <span className="font-bold text-base">{vault.asset}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-medium text-fdfffc group-hover:text-accent-primary transition-colors">
                      {vault.name}
                    </h3>
                    <span
                      className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-medium rounded-full ${
                        vault.risk === "Low"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : vault.risk === "Medium"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      }`}
                    >
                      {vault.risk} Risk
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
                    {vault.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 md:justify-end">
                 <div className="flex flex-col items-start md:items-end min-w-[90px]">
                    <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">APY</span>
                    <span className="text-2xl font-medium text-green-400">{vault.apy}</span>
                 </div>
                 <div className="flex flex-col items-start md:items-end min-w-[90px]">
                    <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">TVL</span>
                    <span className="text-xl font-medium text-fdfffc">{vault.tvl}</span>
                 </div>
                 <div className="flex flex-col items-start md:items-end min-w-[110px]">
                    <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Balance</span>
                    <span className="text-xl font-medium text-accent-primary">
                        {balances[vault.id] 
                            ? `$${balances[vault.id].toLocaleString()}` 
                            : "$0.00"}
                    </span>
                 </div>
                 
                 {/* Arrow indicator */}
                 <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 group-hover:bg-accent-primary/10 transition-colors">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-accent-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

