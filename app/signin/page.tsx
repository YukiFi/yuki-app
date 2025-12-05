"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

type AuthTab = "signin" | "signup" | "wallet";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<AuthTab>("wallet");
  const [loading, setLoading] = useState(false);

  // Form state for email/password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Redirect if wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem("yuki_onboarding_complete", "true");
      localStorage.setItem("yuki_auth_method", "wallet");
      localStorage.setItem("yuki_wallet_address", address);
      window.dispatchEvent(new Event("yuki_login_update"));
      router.push(redirectUrl);
    }
  }, [isConnected, address, router, redirectUrl]);

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === "signup" && password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    setLoading(true);
    
    // Simulate authentication
    setTimeout(() => {
      localStorage.setItem("yuki_onboarding_complete", "true");
      localStorage.setItem("yuki_auth_method", "email");
      localStorage.setItem("yuki_user_email", email);
      
      // Initialize default balance for demo
      const initial = { "yuki-stable": 1000 };
      localStorage.setItem("yuki_balances", JSON.stringify(initial));
      
      window.dispatchEvent(new Event("yuki_login_update"));
      setLoading(false);
      router.push(redirectUrl);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-dark-900 pt-28 pb-6 overflow-y-auto">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-5 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 px-6 my-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-fdfffc mb-2">
            Welcome to Yuki
          </h1>
          <p className="text-gray-400 text-sm">
            Sign in or create an account to start earning yields
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 mb-6 p-1 bg-dark-800/50 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveTab("wallet")}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === "wallet"
                ? "bg-accent-primary text-white shadow-lg"
                : "text-gray-400 hover:text-fdfffc"
            }`}
          >
            Wallet
          </button>
          <button
            onClick={() => setActiveTab("signin")}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === "signin"
                ? "bg-accent-primary text-white shadow-lg"
                : "text-gray-400 hover:text-fdfffc"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === "signup"
                ? "bg-accent-primary text-white shadow-lg"
                : "text-gray-400 hover:text-fdfffc"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="glass p-8 rounded-xl border border-white/5 shadow-2xl">
          {/* Wallet Tab */}
          {activeTab === "wallet" && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-accent-primary/10 rounded-2xl border border-accent-primary/20 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-accent-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-fdfffc mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-400 text-sm">
                  Connect with MetaMask, Phantom, WalletConnect, or any supported wallet
                </p>
              </div>

              <div className="flex justify-center">
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted,
                  }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button
                                onClick={openConnectModal}
                                type="button"
                                className="w-full px-6 py-3 bg-accent-primary text-white rounded-lg text-sm font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                  />
                                </svg>
                                Connect Wallet
                              </button>
                            );
                          }

                          return (
                            <div className="flex gap-3">
                              <button
                                onClick={openChainModal}
                                type="button"
                                className="px-4 py-2 bg-white/5 text-fdfffc border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-all cursor-pointer"
                              >
                                {chain.hasIcon && (
                                  <div
                                    style={{
                                      background: chain.iconBackground,
                                      width: 16,
                                      height: 16,
                                      borderRadius: 999,
                                      overflow: 'hidden',
                                      marginRight: 4,
                                      display: 'inline-block',
                                    }}
                                  >
                                    {chain.iconUrl && (
                                      <img
                                        alt={chain.name ?? 'Chain icon'}
                                        src={chain.iconUrl}
                                        style={{ width: 16, height: 16 }}
                                      />
                                    )}
                                  </div>
                                )}
                                {chain.name}
                              </button>

                              <button
                                onClick={openAccountModal}
                                type="button"
                                className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all cursor-pointer"
                              >
                                {account.displayName}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-dark-900 px-2 text-gray-500">
                    Supported Wallets
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { name: "MetaMask", icon: "🦊" },
                  { name: "WalletConnect", icon: "🔗" },
                  { name: "Coinbase", icon: "🔷" },
                  { name: "More", icon: "➕" },
                ].map((wallet) => (
                  <div
                    key={wallet.name}
                    className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 transition-all cursor-pointer"
                    title={wallet.name}
                  >
                    <span className="text-2xl mb-1">{wallet.icon}</span>
                    <span className="text-[10px] text-gray-400 text-center">
                      {wallet.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sign In Tab */}
          {activeTab === "signin" && (
            <form onSubmit={handleEmailAuth} className="animate-fade-in space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/10 bg-dark-800/50 text-accent-primary focus:ring-accent-primary/50"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-accent-primary hover:text-white transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Sign Up Tab */}
          {activeTab === "signup" && (
            <form onSubmit={handleEmailAuth} className="animate-fade-in space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                  className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                  className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors"
                />
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-0.5 rounded border-white/10 bg-dark-800/50 text-accent-primary focus:ring-accent-primary/50"
                />
                <label>
                  I agree to the{" "}
                  <span className="text-accent-primary cursor-pointer hover:underline">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-accent-primary cursor-pointer hover:underline">
                    Privacy Policy
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-dark-900">
        <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
