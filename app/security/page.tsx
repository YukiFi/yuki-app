"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SecurityPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      const method = localStorage.getItem("yuki_auth_method");
      
      setIsLoggedIn(status === "true");
      setAuthMethod(method);
      
      if (status !== "true") {
        router.push("/signin");
      }
    };

    checkLoginStatus();
    window.addEventListener("yuki_login_update", checkLoginStatus);
    return () => window.removeEventListener("yuki_login_update", checkLoginStatus);
  }, [router]);

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
        <h1 className="text-2xl font-medium text-white mb-2">Security</h1>
        <p className="text-gray-500 text-sm">Your account security settings</p>
      </section>

      {/* Security Details */}
      <section className="space-y-6">
        {/* Login Method */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Login method</p>
          <p className="text-white">
            {authMethod === "email" ? "Email & password" : "Wallet"}
          </p>
        </div>

        {/* Recovery Method */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Recovery method</p>
          <p className="text-gray-400">Coming soon</p>
          <p className="text-xs text-gray-600 mt-2">
            We&apos;re working on additional recovery options for your account.
          </p>
        </div>

        {/* Session */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Session</p>
          <p className="text-white">You&apos;re signed in on this device</p>
          <p className="text-xs text-gray-600 mt-2">
            Your session is active and secure.
          </p>
        </div>
      </section>
    </div>
  );
}
