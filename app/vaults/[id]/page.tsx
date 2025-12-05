"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Vault {
  id: string;
  name: string;
  description: string;
  asset: string;
  apy: string;
  tvl: string;
  risk: "Low" | "Medium" | "High";
  longDescription: string;
  strategy: string[];
  fees: {
    deposit: string;
    withdrawal: string;
    performance: string;
  };
}

const vaultsData: Record<string, Vault> = {
  "yuki-stable": {
    id: "yuki-stable",
    name: "Safe Vault",
    description: "Low-risk automated yield farming on stablecoin pools.",
    longDescription: "Our Safe Vault provides stable, predictable returns by automatically optimizing yields across multiple battle-tested DeFi protocols. Perfect for risk-averse investors seeking consistent returns.",
    asset: "USDC",
    apy: "15.4%",
    tvl: "$12.4M",
    risk: "Low",
    strategy: [
      "Automated rebalancing across Aave, Compound, and other lending protocols",
      "Smart contract insurance coverage",
      "Real-time risk monitoring and automated position adjustments",
      "Optimized gas efficiency with batch transactions"
    ],
    fees: {
      deposit: "0%",
      withdrawal: "0.1%",
      performance: "10%"
    }
  },
  "eth-yield": {
    id: "eth-yield",
    name: "Moderate Vault",
    description: "Balanced risk with leveraged staking strategies.",
    longDescription: "The Moderate Vault strikes the perfect balance between risk and reward, utilizing leveraged staking strategies to amplify yields while maintaining prudent risk management.",
    asset: "ETH",
    apy: "4.2%",
    tvl: "$8.1M",
    risk: "Medium",
    strategy: [
      "Leveraged ETH staking via Lido and RocketPool",
      "Dynamic leverage ratio optimization (1.5x - 2.5x)",
      "Automated liquidation protection mechanisms",
      "Multi-layer security audits and monitoring"
    ],
    fees: {
      deposit: "0%",
      withdrawal: "0.2%",
      performance: "15%"
    }
  },
  "sol-turbo": {
    id: "sol-turbo",
    name: "Aggressive Vault",
    description: "High-risk, high-reward liquidity provision strategies.",
    longDescription: "For experienced DeFi users seeking maximum returns. Our Aggressive Vault employs sophisticated high-frequency strategies and concentrated liquidity positions.",
    asset: "SOL",
    apy: "18.9%",
    tvl: "$3.2M",
    risk: "High",
    strategy: [
      "Concentrated liquidity provision on top Solana DEXs",
      "High-frequency rebalancing for optimal fee capture",
      "MEV-protected transaction routing",
      "Advanced impermanent loss hedging strategies"
    ],
    fees: {
      deposit: "0%",
      withdrawal: "0.3%",
      performance: "20%"
    }
  }
};

export default function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<"deposit" | "withdraw">("deposit");
  const [vaultId, setVaultId] = useState<string | null>(null);

  // Unwrap params in useEffect
  useEffect(() => {
    params.then((p) => setVaultId(p.id));
  }, [params]);

  const vault = vaultId ? vaultsData[vaultId] : null;

  useEffect(() => {
    if (!vaultId) return;
    
    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      setIsLoggedIn(status === "true");
      
      const storedBalances = localStorage.getItem("yuki_balances");
      if (storedBalances) {
        const balances = JSON.parse(storedBalances);
        setBalance(balances[vaultId] || 0);
      }
    };

    checkLoginStatus();
    window.addEventListener("yuki_login_update", checkLoginStatus);
    return () => window.removeEventListener("yuki_login_update", checkLoginStatus);
  }, [vaultId]);

  // Loading state while params are being resolved
  if (!vaultId) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center text-center animate-fade-in">
        <h1 className="text-2xl font-medium text-fdfffc mb-4">Vault Not Found</h1>
        <Link href="/vaults" className="text-accent-primary hover:text-white transition-colors">
          ← Back to Vaults
        </Link>
      </div>
    );
  }

  const handleDeposit = () => {
    if (!isLoggedIn) {
      router.push(`/signin?redirect=/vaults/${vaultId}`);
      return;
    }

    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!vaultId) return;
    
    setLoading(true);
    setTimeout(() => {
      const storedBalances = localStorage.getItem("yuki_balances");
      const balances = storedBalances ? JSON.parse(storedBalances) : {};
      const newBalances = { ...balances, [vaultId]: (balances[vaultId] || 0) + amount };
      
      setBalance(newBalances[vaultId]);
      localStorage.setItem("yuki_balances", JSON.stringify(newBalances));
      window.dispatchEvent(new Event("yuki_login_update"));
      
      setDepositAmount("");
      setLoading(false);
    }, 1000);
  };

  const handleWithdraw = () => {
    if (!vaultId) return;
    
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (amount > balance) {
      alert("Insufficient balance");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const storedBalances = localStorage.getItem("yuki_balances");
      const balances = storedBalances ? JSON.parse(storedBalances) : {};
      const newBalances = { ...balances, [vaultId]: Math.max(0, (balances[vaultId] || 0) - amount) };
      
      setBalance(newBalances[vaultId]);
      localStorage.setItem("yuki_balances", JSON.stringify(newBalances));
      window.dispatchEvent(new Event("yuki_login_update"));
      
      setWithdrawAmount("");
      setLoading(false);
    }, 1000);
  };

  const getRiskColor = () => {
    switch (vault.risk) {
      case "Low": return "text-green-400 bg-green-500/10";
      case "Medium": return "text-yellow-400 bg-yellow-500/10";
      case "High": return "text-orange-400 bg-orange-500/10";
    }
  };

  const getAssetColor = () => {
    switch (vault.asset) {
      case "USDC": return "bg-blue-500/20 text-blue-400";
      case "ETH": return "bg-purple-500/20 text-purple-400";
      case "SOL": return "bg-teal-500/20 text-teal-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/vaults" className="hover:text-fdfffc transition-colors">Vaults</Link>
        <span>/</span>
        <span className="text-fdfffc">{vault.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${getAssetColor()}`}>
            <span className="font-bold text-xl">{vault.asset}</span>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-medium text-fdfffc">{vault.name}</h1>
              <span className={`px-3 py-1 text-xs uppercase tracking-wider font-medium rounded-full ${getRiskColor()}`}>
                {vault.risk} Risk
              </span>
            </div>
            <p className="text-gray-400 mb-4">{vault.description}</p>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">APY</div>
                <div className="text-2xl font-medium text-green-400">{vault.apy}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">TVL</div>
                <div className="text-2xl font-medium text-fdfffc">{vault.tvl}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Balance</div>
                <div className="text-2xl font-medium text-accent-primary">
                  ${balance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="glass p-6 rounded-xl border border-white/5">
            <h2 className="text-lg font-medium text-fdfffc mb-4">About This Vault</h2>
            <p className="text-gray-400 leading-relaxed">{vault.longDescription}</p>
          </div>

          {/* Strategy */}
          <div className="glass p-6 rounded-xl border border-white/5">
            <h2 className="text-lg font-medium text-fdfffc mb-4">Strategy Details</h2>
            <div className="space-y-3">
              {vault.strategy.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fees */}
          <div className="glass p-6 rounded-xl border border-white/5">
            <h2 className="text-lg font-medium text-fdfffc mb-4">Fee Structure</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Deposit Fee</div>
                <div className="text-lg font-medium text-fdfffc">{vault.fees.deposit}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Withdrawal Fee</div>
                <div className="text-lg font-medium text-fdfffc">{vault.fees.withdrawal}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Performance Fee</div>
                <div className="text-lg font-medium text-fdfffc">{vault.fees.performance}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="lg:col-span-1">
          <div className="glass p-6 rounded-xl border border-white/5 sticky top-32">
            <h2 className="text-lg font-medium text-fdfffc mb-6">Manage Position</h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 p-1 bg-dark-800/50 rounded-lg border border-white/5">
              <button
                onClick={() => setActiveAction("deposit")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  activeAction === "deposit"
                    ? "bg-accent-primary text-white"
                    : "text-gray-400 hover:text-fdfffc"
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => setActiveAction("withdraw")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  activeAction === "withdraw"
                    ? "bg-accent-primary text-white"
                    : "text-gray-400 hover:text-fdfffc"
                }`}
              >
                Withdraw
              </button>
            </div>

            {/* Deposit Form */}
            {activeAction === "deposit" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                    Amount ({vault.asset})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors"
                    />
                    <button
                      onClick={() => setDepositAmount("100")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-accent-primary hover:text-white transition-colors cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {!isLoggedIn ? (
                  <button
                    onClick={() => router.push(`/signin?redirect=/vaults/${vaultId}`)}
                    className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all cursor-pointer"
                  >
                    Sign In to Deposit
                  </button>
                ) : (
                  <button
                    onClick={handleDeposit}
                    disabled={loading || !depositAmount}
                    className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Deposit"
                    )}
                  </button>
                )}

                <p className="text-xs text-gray-500 text-center">
                  Funds are deposited instantly and start earning immediately
                </p>
              </div>
            )}

            {/* Withdraw Form */}
            {activeAction === "withdraw" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                    Amount ({vault.asset})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors"
                    />
                    <button
                      onClick={() => setWithdrawAmount(balance.toString())}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-accent-primary hover:text-white transition-colors cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount || balance === 0}
                  className="w-full py-3 bg-white/5 text-fdfffc border border-white/10 rounded-lg font-medium hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Withdraw"
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Withdrawals are processed instantly. {vault.fees.withdrawal} fee applies
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

