"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useWalletContext } from "@/lib/context/WalletContext";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import Link from "next/link";

type AuthMode = "signin" | "signup";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  
  const { address, isConnected } = useAccount();
  const { signup, login, isAuthLoading, isAuthenticated, authError } = useWalletContext();
  
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Wallet connection tracking
  const [hasUserConnected, setHasUserConnected] = useState(false);
  const [prevConnected, setPrevConnected] = useState<boolean | null>(null);
  
  // Passkey states
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [isEnablingPasskey, setIsEnablingPasskey] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [skipAutoRedirect, setSkipAutoRedirect] = useState(false);

  // Redirect if already authenticated (but not if showing passkey prompt)
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading && !skipAutoRedirect) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isAuthLoading, router, redirectUrl, skipAutoRedirect]);

  // Track wallet connection changes
  useEffect(() => {
    if (prevConnected === null) {
      setPrevConnected(isConnected);
      return;
    }
    
    if (!prevConnected && isConnected && address) {
      setHasUserConnected(true);
    }
    
    setPrevConnected(isConnected);
  }, [isConnected, address, prevConnected]);

  // Redirect when user connects wallet
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
    
    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
    }

    setLoading(true);
    
    try {
      const result = mode === "signup" 
        ? await signup(email, password)
        : await login(email, password);
      
      if (result.success) {
        localStorage.setItem("yuki_onboarding_complete", "true");
        localStorage.setItem("yuki_auth_method", "email");
        localStorage.setItem("yuki_user_email", email);
        window.dispatchEvent(new Event("yuki_login_update"));
        
        if (mode === "signup") {
          setSkipAutoRedirect(true);
          setShowPasskeyPrompt(true);
        } else {
          router.push(redirectUrl);
        }
      } else {
        setError(result.error || "Authentication failed");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeySignin = async () => {
    if (!email) {
      setError("Please enter your email first");
      return;
    }
    
    setPasskeyLoading(true);
    setError(null);
    
    try {
      const optionsRes = await fetch("/api/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        if (data.error === "Passkey not enabled for this account") {
          setError("Passkey not enabled. Please sign in with password.");
        } else {
          setError(data.error || "Failed to get passkey options");
        }
        return;
      }
      
      const options = await optionsRes.json();
      const credential = await startAuthentication({ optionsJSON: options });
      
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
      
      localStorage.setItem("yuki_onboarding_complete", "true");
      localStorage.setItem("yuki_auth_method", "email");
      localStorage.setItem("yuki_user_email", email);
      window.dispatchEvent(new Event("yuki_login_update"));
      router.push(redirectUrl);
    } catch {
      setError("Passkey authentication failed. Try using your password.");
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleEnablePasskey = async () => {
    setIsEnablingPasskey(true);
    
    try {
      const optionsRes = await fetch("/api/passkey/register", { method: "POST" });
      if (!optionsRes.ok) throw new Error("Failed to get registration options");
      
      const options = await optionsRes.json();
      const credential = await startRegistration({ optionsJSON: options });
      
      const verifyRes = await fetch("/api/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      
      if (!verifyRes.ok) throw new Error("Failed to verify passkey");
      
      router.push(redirectUrl);
    } catch {
      router.push(redirectUrl);
    } finally {
      setIsEnablingPasskey(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-24 px-6">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-white tracking-tight mb-2">
            {mode === "signin" ? "Welcome back" : "Get started"}
          </h1>
          <p className="text-gray-500 text-sm">
            {mode === "signin" 
              ? "Sign in to access your account" 
              : "Create an account to start saving"}
          </p>
        </div>

        {/* Email/Password Form */}
        <div className="bg-white/[0.03] rounded-lg p-6 mb-4">
          <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
              <label className="block text-xs text-gray-500 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                  required
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              <div>
              <label className="block text-xs text-gray-500 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
                  required
                  minLength={8}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

            {mode === "signup" && (
              <div>
                <label className="block text-xs text-gray-500 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
            )}

              {(error || authError) && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error || authError}</p>
                </div>
              )}

            {mode === "signup" && (
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-0.5 rounded border-white/10 bg-white/[0.03]"
                />
                <label>
                  I agree to the{" "}
                  <Link href="/documents/terms" className="text-white hover:underline">Terms</Link>
                  {" "}and{" "}
                  <Link href="/documents/privacy" className="text-white hover:underline">Privacy Policy</Link>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || passkeyLoading}
              className="w-full py-3 bg-[#0F52FB] text-white rounded-lg text-sm font-medium hover:bg-[#0F52FB]/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                mode === "signin" ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          {/* Passkey option for sign in */}
          {mode === "signin" && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#0d0d0d] px-3 text-gray-600">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePasskeySignin}
                disabled={loading || passkeyLoading || !email}
                className="w-full py-3 bg-white/[0.03] text-white border border-white/10 rounded-lg text-sm font-medium hover:bg-white/[0.05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {passkeyLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    Sign in with Passkey
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Toggle mode */}
        <p className="text-center text-sm text-gray-500 mb-6">
          {mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <button 
                onClick={() => { setMode("signup"); setError(null); }}
                className="text-white hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button 
                onClick={() => { setMode("signin"); setError(null); }}
                className="text-white hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        {/* Wallet Connect Option */}
        <div className="bg-white/[0.03] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white font-medium">External Wallet</p>
              <p className="text-xs text-gray-500">MetaMask, WalletConnect, etc.</p>
            </div>
          </div>
          
          <ConnectButton.Custom>
            {({ openConnectModal, mounted }) => {
              const ready = mounted;
              return (
                <div {...(!ready && { style: { opacity: 0, pointerEvents: 'none' } })}>
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="w-full py-3 bg-white/[0.03] text-white border border-white/10 rounded-lg text-sm font-medium hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    Connect Wallet
                  </button>
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Non-custodial · Your keys, your crypto
        </p>
      </div>

      {/* Passkey Setup Modal */}
      {showPasskeyPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[#0F52FB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#0F52FB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-white mb-2">Add a Passkey?</h2>
              <p className="text-gray-500 text-sm">
                Sign in faster with Face ID, Touch ID, or your password manager.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleEnablePasskey}
                disabled={isEnablingPasskey}
                className="w-full py-3 bg-[#0F52FB] text-white rounded-lg text-sm font-medium hover:bg-[#0F52FB]/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isEnablingPasskey ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  "Set Up Passkey"
                )}
              </button>
              
              <button
                onClick={() => router.push(redirectUrl)}
                disabled={isEnablingPasskey}
                className="w-full py-3 text-gray-500 hover:text-white text-sm transition-colors cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
