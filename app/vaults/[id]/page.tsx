"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Profile {
  id: string;
  name: string;
  tagline: string;
  volatility: string;
  yieldRange: string;
  asset: string;
  liquidity: string;
  management: string;
  howItWorks: {
    strategy: string;
    protocols: string;
    rebalancing: string;
    risks: string;
  };
  advanced: {
    allocations: { name: string; percentage: string }[];
    contractAddress: string;
  };
}

const profilesData: Record<string, Profile> = {
  "yuki-stable": {
    id: "yuki-stable",
    name: "Stable",
    tagline: "Conservative on-chain yield with a focus on capital preservation.",
    volatility: "Low volatility",
    yieldRange: "~3–6%",
    asset: "USDC",
    liquidity: "Withdraw anytime",
    management: "Automated, rule-based",
    howItWorks: {
      strategy: "This profile allocates your funds across established lending protocols that have been battle-tested over years. The focus is on large, liquid markets with proven track records.",
      protocols: "Funds may be deployed across Aave, Compound, and other established lending markets. Allocation is dynamic and adjusts based on rates and utilization.",
      rebalancing: "Positions are monitored continuously and rebalanced daily to optimize yield while staying within conservative risk parameters.",
      risks: "While this profile prioritizes safety, all on-chain activity carries inherent smart contract risk. No guarantees are made about returns or principal protection.",
    },
    advanced: {
      allocations: [
        { name: "Aave v3 USDC", percentage: "45%" },
        { name: "Compound v3 USDC", percentage: "35%" },
        { name: "Reserve (liquid)", percentage: "20%" },
      ],
      contractAddress: "0x1234...5678",
    },
  },
  "eth-yield": {
    id: "eth-yield",
    name: "Balanced",
    tagline: "A blend of stability and growth for moderate risk tolerance.",
    volatility: "Moderate volatility",
    yieldRange: "~5–9%",
    asset: "USDC",
    liquidity: "Withdraw anytime",
    management: "Automated, rule-based",
    howItWorks: {
      strategy: "This profile combines conservative lending strategies with higher-yielding opportunities. A portion of funds is allocated to strategies that offer enhanced returns.",
      protocols: "Funds are deployed across a mix of lending protocols and yield-bearing positions including staking derivatives and liquidity provision.",
      rebalancing: "Daily rebalancing with more active management to capture yield opportunities while maintaining a moderate risk profile.",
      risks: "This profile carries higher risk than Stable. Returns may vary more significantly, and temporary drawdowns are possible during market volatility.",
    },
    advanced: {
      allocations: [
        { name: "Aave v3 USDC", percentage: "30%" },
        { name: "Curve stETH/ETH LP", percentage: "25%" },
        { name: "Lido stETH", percentage: "25%" },
        { name: "Reserve (liquid)", percentage: "20%" },
      ],
      contractAddress: "0xabcd...efgh",
    },
  },
  "sol-turbo": {
    id: "sol-turbo",
    name: "Growth",
    tagline: "Maximizing yield potential with higher volatility acceptance.",
    volatility: "Higher volatility",
    yieldRange: "~8–15%",
    asset: "USDC",
    liquidity: "Withdraw anytime",
    management: "Automated, rule-based",
    howItWorks: {
      strategy: "This profile pursues higher yields through concentrated positions in higher-returning opportunities. Suitable for users comfortable with variability.",
      protocols: "Allocation includes concentrated liquidity positions, yield farming opportunities, and leveraged strategies across multiple DeFi protocols.",
      rebalancing: "More frequent rebalancing to actively manage positions and capture yield spikes while managing downside.",
      risks: "This profile carries significant risk. Returns can vary widely, and principal loss is possible during adverse market conditions. Only allocate funds you can afford to have fluctuate.",
    },
    advanced: {
      allocations: [
        { name: "Uniswap v3 Concentrated LP", percentage: "30%" },
        { name: "Pendle PT-stETH", percentage: "25%" },
        { name: "Convex/Curve Pools", percentage: "25%" },
        { name: "Reserve (liquid)", percentage: "20%" },
      ],
      contractAddress: "0x9876...5432",
    },
  },
};

export default function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(0);
  const [walletBalance] = useState(10000); // Simulated wallet balance
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setProfileId(p.id));
  }, [params]);

  const profile = profileId ? profilesData[profileId] : null;

  useEffect(() => {
    if (!profileId) return;
    
    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      setIsLoggedIn(status === "true");
      
      const storedBalances = localStorage.getItem("yuki_balances");
      if (storedBalances) {
        const balances = JSON.parse(storedBalances);
        setBalance(balances[profileId] || 0);
      }
    };

    checkLoginStatus();
    window.addEventListener("yuki_login_update", checkLoginStatus);
    return () => window.removeEventListener("yuki_login_update", checkLoginStatus);
  }, [profileId]);

  if (!profileId) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-gray-500 mb-4">Profile not found</p>
        <Link href="/vaults" className="text-sm text-white hover:text-gray-300 transition-colors">
          ← Back to Strategy
        </Link>
      </div>
    );
  }

  const handleDeposit = () => {
    if (!isLoggedIn) {
      router.push(`/signin?redirect=/vaults/${profileId}`);
      return;
    }

    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;
    if (!profileId) return;
    
    setLoading(true);
    setLoadingMessage("Deploying funds on-chain…");
    
    setTimeout(() => {
      const storedBalances = localStorage.getItem("yuki_balances");
      const balances = storedBalances ? JSON.parse(storedBalances) : {};
      const newBalances = { ...balances, [profileId]: (balances[profileId] || 0) + amount };
      
      setBalance(newBalances[profileId]);
      localStorage.setItem("yuki_balances", JSON.stringify(newBalances));
      window.dispatchEvent(new Event("yuki_login_update"));
      
      setDepositAmount("");
      setLoading(false);
      setLoadingMessage("");
      setSuccess(true);
      setSuccessMessage(`Allocation updated for ${profile.name}`);
      
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  const handleWithdraw = () => {
    if (!profileId) return;
    
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || amount > balance) return;

    setLoading(true);
    setLoadingMessage("Withdrawing funds…");
    
    setTimeout(() => {
      const storedBalances = localStorage.getItem("yuki_balances");
      const balances = storedBalances ? JSON.parse(storedBalances) : {};
      const newBalances = { ...balances, [profileId]: Math.max(0, (balances[profileId] || 0) - amount) };
      
      setBalance(newBalances[profileId]);
      localStorage.setItem("yuki_balances", JSON.stringify(newBalances));
      window.dispatchEvent(new Event("yuki_login_update"));
      
      setWithdrawAmount("");
      setLoading(false);
      setLoadingMessage("");
      setSuccess(true);
      setSuccessMessage("Funds returned to your wallet");
      
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="w-full mx-auto px-4 pb-24 animate-fade-in">
      {/* Back link */}
      <div className="pt-8 pb-4">
        <Link 
          href="/vaults" 
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Strategy
        </Link>
      </div>

      {/* Header Section */}
      <section className="pb-8">
        <h1 className="text-3xl font-medium text-white mb-2">{profile.name} Strategy</h1>
        <p className="text-gray-500 mb-6">{profile.tagline}</p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 text-xs text-gray-400 bg-white/5 rounded-full">
            {profile.volatility}
          </span>
          <span className="px-3 py-1.5 text-xs text-gray-400 bg-white/5 rounded-full">
            Non-custodial
          </span>
          <span className="px-3 py-1.5 text-xs text-gray-400 bg-white/5 rounded-full">
            Fully on-chain
          </span>
        </div>
      </section>

      {/* Key Stats */}
      <section className="pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current range</p>
            <p className="text-lg text-white">{profile.yieldRange}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Asset</p>
            <p className="text-lg text-white">{profile.asset}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Liquidity</p>
            <p className="text-lg text-white">{profile.liquidity}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Management</p>
            <p className="text-lg text-white">{profile.management}</p>
          </div>
        </div>
      </section>

      {/* Your Position (if any) */}
      {balance > 0 && (
        <section className="pb-10">
          <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your balance</p>
            <p className="text-3xl font-medium text-white">
              ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </section>
      )}

      {/* Deposit / Withdraw Module */}
      <section className="pb-10">
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setActiveTab("deposit")}
              className={`flex-1 py-4 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "deposit" 
                  ? "text-white border-b-2 border-white" 
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className={`flex-1 py-4 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "withdraw" 
                  ? "text-white border-b-2 border-white" 
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              Withdraw
            </button>
          </div>

          <div className="p-6">
            {/* Success message */}
            {success && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-400 text-center">
                {successMessage}
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-400">{loadingMessage}</p>
              </div>
            )}

            {/* Deposit Tab */}
            {activeTab === "deposit" && !loading && (
              <div className="space-y-6">
                {/* Amount input */}
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Amount (USD)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-4 text-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Wallet balance: ${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Confirmation text */}
                <p className="text-sm text-gray-500 leading-relaxed">
                  Funds remain in your wallet and are deployed on-chain via this profile.
                </p>

                {/* Checklist */}
                <div className="space-y-2">
                  {["No lockup", "No guarantees", "Withdraw anytime"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-400">
                      <svg className="w-4 h-4 text-green-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>

                {/* Deposit button */}
                {!isLoggedIn ? (
                  <button
                    onClick={() => router.push(`/signin?redirect=/vaults/${profileId}`)}
                    className="w-full py-4 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    Sign in to deposit
                  </button>
                ) : (
                  <button
                    onClick={handleDeposit}
                    disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                    className="w-full py-4 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Deposit
                  </button>
                )}
              </div>
            )}

            {/* Withdraw Tab */}
            {activeTab === "withdraw" && !loading && (
              <div className="space-y-6">
                {/* Amount input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-500">Amount (USD)</label>
                    <button
                      onClick={() => setWithdrawAmount(balance.toString())}
                      className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Max
                    </button>
                  </div>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-4 text-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Available: ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Confirmation text */}
                <p className="text-sm text-gray-500 leading-relaxed">
                  Funds return to your wallet. You can convert to fiat anytime.
                </p>

                {/* Timeline */}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-green-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Available immediately
                </div>

                {/* Withdraw button */}
                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > balance || balance === 0}
                  className="w-full py-4 bg-white/5 text-white rounded-full font-medium border border-white/10 hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Withdraw
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How This Profile Works */}
      <section className="pb-6">
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full bg-white/[0.02] rounded-2xl border border-white/5 p-6 text-left cursor-pointer hover:border-white/10 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">How this profile works</span>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${showHowItWorks ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {showHowItWorks && (
          <div className="mt-2 bg-white/[0.02] rounded-2xl border border-white/5 p-6 space-y-6">
            <div>
              <h4 className="text-sm text-gray-400 mb-2">Strategy</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{profile.howItWorks.strategy}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-400 mb-2">Protocols used</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{profile.howItWorks.protocols}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-400 mb-2">Rebalancing</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{profile.howItWorks.rebalancing}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-400 mb-2">Risks</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{profile.howItWorks.risks}</p>
            </div>
          </div>
        )}
      </section>

      {/* Advanced / On-chain Details */}
      <section>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full bg-white/[0.02] rounded-2xl border border-white/5 p-6 text-left cursor-pointer hover:border-white/10 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium">On-chain details</span>
              <span className="text-xs text-gray-600 ml-2">Advanced</span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {showAdvanced && (
          <div className="mt-2 bg-white/[0.02] rounded-2xl border border-white/5 p-6 space-y-6">
            <div>
              <h4 className="text-sm text-gray-400 mb-3">Allocation breakdown</h4>
              <div className="space-y-2">
                {profile.advanced.allocations.map((alloc, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{alloc.name}</span>
                    <span className="text-white">{alloc.percentage}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm text-gray-400 mb-2">Contract</h4>
              <a 
                href="#" 
                className="text-sm text-gray-500 hover:text-white transition-colors font-mono"
              >
                {profile.advanced.contractAddress}
              </a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
