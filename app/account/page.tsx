"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      const email = localStorage.getItem("yuki_user_email");
      const wallet = localStorage.getItem("yuki_wallet_address");
      
      setIsLoggedIn(status === "true");
      setUserEmail(email);
      setWalletAddress(wallet);
      
      if (status !== "true") {
        router.push("/signin");
      }
    };

    checkLoginStatus();
    window.addEventListener("yuki_login_update", checkLoginStatus);
    return () => window.removeEventListener("yuki_login_update", checkLoginStatus);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("yuki_onboarding_complete");
    localStorage.removeItem("yuki_auth_method");
    localStorage.removeItem("yuki_user_email");
    localStorage.removeItem("yuki_wallet_address");
    localStorage.removeItem("yuki_balances");
    window.dispatchEvent(new Event("yuki_login_update"));
    router.push("/");
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 pb-24 animate-fade-in">
      {/* Back link */}
      <div className="pt-8 pb-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {/* Header */}
      <section className="pb-10">
        <h1 className="text-2xl font-medium text-white mb-2">Account</h1>
        <p className="text-gray-500 text-sm">Your account information</p>
      </section>

      {/* Account Details */}
      <section className="space-y-6">
        {/* Email */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Email</p>
          <p className="text-white">{userEmail || "Not set"}</p>
        </div>

        {/* Wallet Address */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Wallet address</p>
          <p className="text-white font-mono text-sm">
            {walletAddress ? formatAddress(walletAddress) : "0x1234...5678"}
          </p>
          <p className="text-xs text-gray-600 mt-2">Read-only. Managed by your login method.</p>
        </div>

        {/* Fiat Provider */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Fiat provider</p>
          <p className="text-white">Connected (Demo)</p>
          <p className="text-xs text-gray-600 mt-2">Enables deposits and withdrawals in your local currency.</p>
        </div>
      </section>

      {/* Log out */}
      <section className="mt-12 pt-8 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          Log out
        </button>
      </section>
    </div>
  );
}
