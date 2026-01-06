"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SecurityPage() {
  const [authMethod, setAuthMethod] = useState<string | null>("email");

  useEffect(() => {
    const fetchAuthMethod = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setAuthMethod(data.user.hasWallet ? "wallet" : "email");
        }
      } catch (error) {
        console.error("Failed to fetch auth method", error);
      }
    };

    fetchAuthMethod();
    window.addEventListener("yuki_login_update", fetchAuthMethod);
    return () => window.removeEventListener("yuki_login_update", fetchAuthMethod);
  }, []);

  return (
    <div className="w-full py-12 animate-fade-in">
      {/* Back link */}
      <div className="mb-8">
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
      <section className="mb-10">
        <h1 className="text-2xl font-medium text-white mb-2">Security</h1>
        <p className="text-gray-500 text-sm">Your account security settings</p>
      </section>

      {/* Security Details */}
      <section className="space-y-4">
        {/* Login Method */}
        <div className="bg-white/[0.03] rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-white/[0.02]">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">Login Method</h2>
          </div>
          <div className="p-5">
            <p className="text-white">
              {authMethod === "email" ? "Email & password" : "Wallet"}
            </p>
          </div>
        </div>

        {/* Recovery Method */}
        <div className="bg-white/[0.03] rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-white/[0.02]">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">Recovery Method</h2>
          </div>
          <div className="p-5">
            <p className="text-gray-400">Coming soon</p>
            <p className="text-xs text-gray-600 mt-2">
              We&apos;re working on additional recovery options for your account.
            </p>
          </div>
        </div>

        {/* Session */}
        <div className="bg-white/[0.03] rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-white/[0.02]">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">Session</h2>
          </div>
          <div className="p-5">
            <p className="text-white">You&apos;re signed in on this device</p>
            <p className="text-xs text-gray-600 mt-2">
              Your session is active and secure.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
