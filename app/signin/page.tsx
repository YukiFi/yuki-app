"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useWalletContext } from "@/lib/context/WalletContext";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

type AuthTab = "signin" | "signup" | "wallet";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  
  const { address, isConnected } = useAccount();
  const { signup, login, isAuthLoading, isAuthenticated, authError } = useWalletContext();
  
  const [activeTab, setActiveTab] = useState<AuthTab>("signup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for email/password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Track if user explicitly connected wallet during this session
  const [hasUserConnected, setHasUserConnected] = useState(false);
  const [prevConnected, setPrevConnected] = useState<boolean | null>(null);
  
  // Passkey states
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [isEnablingPasskey, setIsEnablingPasskey] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [hasPasskeyAvailable, setHasPasskeyAvailable] = useState(false);

  // Redirect if already authenticated (via email/password)
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isAuthLoading, router, redirectUrl]);

  // Track wallet connection changes - only redirect on NEW connections
  useEffect(() => {
    // On first render, just record the initial state
    if (prevConnected === null) {
      setPrevConnected(isConnected);
      return;
    }
    
    // Detect when user explicitly connects (transition from disconnected to connected)
    if (!prevConnected && isConnected && address) {
      setHasUserConnected(true);
    }
    
    setPrevConnected(isConnected);
  }, [isConnected, address, prevConnected]);

  // Redirect when user explicitly connects wallet during this session
  useEffect(() => {
    if (hasUserConnected && isConnected && address) {
      localStorage.setItem("yuki_onboarding_complete", "true");
      localStorage.setItem("yuki_auth_method", "wallet");
      localStorage.setItem("yuki_wallet_address", address);
      window.dispatchEvent(new Event("yuki_login_update"));
      router.push(redirectUrl);
    }
  }, [hasUserConnected, isConnected, address, router, redirectUrl]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (activeTab === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords don't match!");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
    }

    setLoading(true);
    
    try {
      const result = activeTab === "signup" 
        ? await signup(email, password)
        : await login(email, password);
      
      if (result.success) {
        // Trigger legacy update for compatibility
        localStorage.setItem("yuki_onboarding_complete", "true");
        localStorage.setItem("yuki_auth_method", "email");
        localStorage.setItem("yuki_user_email", email);
        window.dispatchEvent(new Event("yuki_login_update"));
        
        // Show passkey prompt after signup
        if (activeTab === "signup") {
          setShowPasskeyPrompt(true);
        } else {
          router.push(redirectUrl);
        }
      } else {
        setError(result.error || "Authentication failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle passkey signin
  const handlePasskeySignin = async () => {
    if (!email) {
      setError("Please enter your email first");
      return;
    }
    
    setPasskeyLoading(true);
    setError(null);
    
    try {
      // Get authentication options
      const optionsRes = await fetch("/api/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        if (data.error === "Passkey not enabled for this account") {
          setError("Passkey not enabled for this account. Please sign in with password.");
        } else {
          setError(data.error || "Failed to get passkey options");
        }
        return;
      }
      
      const options = await optionsRes.json();
      
      // Authenticate with passkey
      const credential = await startAuthentication({ optionsJSON: options });
      
      // Verify with server
      const verifyRes = await fetch("/api/passkey/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      
      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setError(data.error || "Passkey verification failed");
        return;
      }
      
      // Success! Update local storage and redirect
      localStorage.setItem("yuki_onboarding_complete", "true");
      localStorage.setItem("yuki_auth_method", "email");
      localStorage.setItem("yuki_user_email", email);
      window.dispatchEvent(new Event("yuki_login_update"));
      router.push(redirectUrl);
    } catch (err) {
      console.error("Passkey signin error:", err);
      setError("Passkey authentication failed. Try using your password.");
    } finally {
      setPasskeyLoading(false);
    }
  };

  // Handle passkey setup after signup
  const handleEnablePasskey = async () => {
    setIsEnablingPasskey(true);
    setError(null);
    
    try {
      // Get registration options
      const optionsRes = await fetch("/api/passkey/register", {
        method: "POST",
      });
      
      if (!optionsRes.ok) {
        throw new Error("Failed to get registration options");
      }
      
      const options = await optionsRes.json();
      
      // Create passkey with browser
      const credential = await startRegistration({ optionsJSON: options });
      
      // Verify with server
      const verifyRes = await fetch("/api/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      
      if (!verifyRes.ok) {
        throw new Error("Failed to verify passkey");
      }
      
      // Success! Continue to redirect
      router.push(redirectUrl);
    } catch (err) {
      console.error("Passkey setup error:", err);
      // Don't show error, just skip - passkey is optional
      router.push(redirectUrl);
    } finally {
      setIsEnablingPasskey(false);
    }
  };

  const skipPasskey = () => {
    router.push(redirectUrl);
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
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === "signup"
                ? "bg-accent-primary text-white shadow-lg"
                : "text-gray-400 hover:text-fdfffc"
            }`}
          >
            Sign Up
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
            onClick={() => setActiveTab("wallet")}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === "wallet"
                ? "bg-accent-primary text-white shadow-lg"
                : "text-gray-400 hover:text-fdfffc"
            }`}
          >
            Wallet
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
                  Connect External Wallet
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-fdfffc mb-2">
                  Embedded Wallet
                </h3>
                <p className="text-gray-400 text-sm">
                  Sign in with your email and password
                </p>
              </div>

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

              {(error || authError) && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-400">{error || authError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || passkeyLoading}
                className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In with Password
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

              {/* Passkey Sign In */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-dark-900 px-2 text-gray-500">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePasskeySignin}
                disabled={loading || passkeyLoading || !email}
                className="w-full py-3 bg-white/5 text-fdfffc border border-white/10 rounded-lg font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passkeyLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    Sign In with Passkey
                  </>
                )}
              </button>

              {/* Security note */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                  </svg>
                  <span>Non-custodial • Your keys, your crypto</span>
                </div>
              </div>
            </form>
          )}

          {/* Sign Up Tab */}
          {activeTab === "signup" && (
            <form onSubmit={handleEmailAuth} className="animate-fade-in space-y-4">
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
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-fdfffc mb-2">
                  Create Embedded Wallet
                </h3>
                <p className="text-gray-400 text-sm">
                  Create an account with email and password
                </p>
              </div>

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

              {/* Password requirements */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Password requirements:</p>
                <ul className="text-xs space-y-1">
                  <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-400' : 'text-gray-500'}`}>
                    <span>{password.length >= 8 ? '✓' : '○'}</span>
                    At least 8 characters
                  </li>
                </ul>
              </div>

              {(error || authError) && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-400">{error || authError}</p>
                </div>
              )}

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
                className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-50"
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

              {/* Security note */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                  </svg>
                  <span>Non-custodial • Your keys, your crypto</span>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Info box */}
        <div className="mt-6 p-4 bg-accent-primary/5 border border-accent-primary/20 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-fdfffc mb-1">What's an embedded wallet?</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                An embedded wallet is created and encrypted in your browser. Only you can access it with your password. 
                We never see your private keys - they're stored encrypted and only decrypted locally when you need to sign transactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Passkey Setup Prompt Modal */}
      {showPasskeyPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-dark-800 border border-white/10 rounded-2xl p-8 max-w-md w-full animate-fade-in shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-accent-primary/10 rounded-full border border-accent-primary/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <h2 className="text-2xl font-medium text-fdfffc mb-2">Secure Your Account</h2>
              <p className="text-gray-400 text-sm">
                Add a passkey for faster, more secure sign-ins using Face ID, Touch ID, Windows Hello, or your password manager.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-300">Sign in instantly with biometrics</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-300">Phishing-resistant authentication</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-300">Works with iCloud, Google, 1Password & more</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleEnablePasskey}
                disabled={isEnablingPasskey}
                className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isEnablingPasskey ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    Set Up Passkey
                  </>
                )}
              </button>
              
              <button
                onClick={skipPasskey}
                disabled={isEnablingPasskey}
                className="w-full py-3 text-gray-400 hover:text-fdfffc text-sm font-medium transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
              You can always set this up later in Settings
            </p>
          </div>
        </div>
      )}
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
