"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  useUser as useAlchemyUser,
  useSignerStatus,
  useSmartAccountClient,
  useLogout,
} from "@account-kit/react";
import { useAuth } from "@/lib/hooks/useAuth";

const BRAND_LAVENDER = "#e1a8f0";

type SettingsSection = "account" | "wallet" | "security";

export default function SettingsPage() {
  const { isLoading: authLoading } = useAuth();
  const { isConnected, isInitializing } = useSignerStatus();
  const { client } = useSmartAccountClient({});
  const alchemyUser = useAlchemyUser();
  const { logout } = useLogout();
  
  // Get wallet address from smart account client
  const walletAddress = client?.account?.address;
  
  // Section state
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  
  // Copy states
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  // Profile data state
  const [profile, setProfile] = useState<{
    handle: string;
    displayName: string | null;
    avatarUrl: string | null;
    email: string | null;
  } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      if (!walletAddress) {
        setIsLoadingProfile(false);
        return;
      }
      
      try {
        const response = await fetch('/api/profile/me', {
          headers: {
            'x-wallet-address': walletAddress,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setProfile({
            handle: data.handle || '',
            displayName: data.displayName || null,
            avatarUrl: data.avatarUrl || null,
            email: alchemyUser?.email || null,
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    
    if (isConnected && walletAddress) {
      fetchProfile();
    }
  }, [isConnected, walletAddress, alchemyUser?.email]);
  
  const handleCopyAddress = async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };
  
  const handleSignOut = async () => {
    await logout();
    window.location.href = "/login";
  };
  
  // Loading state
  if (isInitializing || authLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
      </div>
    );
  }
  
  if (!isConnected) {
    return null;
  }
  
  const sections = [
    { key: "account" as const, label: "Account" },
    { key: "wallet" as const, label: "Wallet" },
    { key: "security" as const, label: "Security" },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full flex flex-col items-center px-4 sm:px-8 lg:px-16 py-8 sm:py-12">
      <div className="w-full max-w-[1100px]">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/40 text-sm sm:text-base">
            Manage your account and wallet
          </p>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 mb-8 sm:mb-10">
          {sections.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: activeSection === key ? `${BRAND_LAVENDER}20` : "transparent",
                color: activeSection === key ? BRAND_LAVENDER : "rgba(255,255,255,0.4)"
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 sm:space-y-6"
        >
          {activeSection === "account" && (
            <>
              {/* Account Section */}
              <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-4 py-2 sm:px-5 sm:py-3">
                <p className="text-white/50 text-xs font-medium tracking-wide py-3 sm:py-4">
                  Profile
                </p>
                <div className="divide-y divide-white/[0.04]">
                  {/* Username */}
                  <div className="py-4 sm:py-5 flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-xs mb-1">Username</p>
                      <p className="text-white font-medium text-sm sm:text-base">
                        {isLoadingProfile ? '...' : (profile?.handle || 'Not set')}
                      </p>
                    </div>
                    <a 
                      href="/setup"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ 
                        backgroundColor: `${BRAND_LAVENDER}15`,
                        color: BRAND_LAVENDER
                      }}
                    >
                      Change
                    </a>
                  </div>
                  
                  {/* Display Name */}
                  <div className="py-4 sm:py-5">
                    <p className="text-white/40 text-xs mb-1">Display Name</p>
                    <p className="text-white font-medium text-sm sm:text-base">
                      {isLoadingProfile ? '...' : (profile?.displayName || 'Not set')}
                    </p>
                  </div>
                  
                  {/* Email */}
                  {alchemyUser?.email && (
                    <div className="py-4 sm:py-5">
                      <p className="text-white/40 text-xs mb-1">Email</p>
                      <p className="text-white font-medium text-sm sm:text-base">{alchemyUser.email}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeSection === "wallet" && (
            <>
              {/* Wallet Address */}
              <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-4 py-2 sm:px-5 sm:py-3">
                <p className="text-white/50 text-xs font-medium tracking-wide py-3 sm:py-4">
                  Wallet Address
                </p>
                <div className="py-4 sm:py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-mono text-sm break-all">
                        {walletAddress || 'Loading...'}
                      </p>
                      {walletAddress && (
                        <a
                          href={`https://basescan.org/address/${walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs mt-2 inline-block hover:underline"
                          style={{ color: BRAND_LAVENDER }}
                        >
                          View on Basescan →
                        </a>
                      )}
                    </div>
                    <button
                      onClick={handleCopyAddress}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                      style={{ 
                        backgroundColor: copiedAddress ? "rgba(74, 222, 128, 0.15)" : "rgba(255,255,255,0.05)",
                        color: copiedAddress ? "rgb(74, 222, 128)" : "rgba(255,255,255,0.6)"
                      }}
                    >
                      {copiedAddress ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Network */}
              <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-4 py-2 sm:px-5 sm:py-3">
                <p className="text-white/50 text-xs font-medium tracking-wide py-3 sm:py-4">
                  Network
                </p>
                <div className="py-4 sm:py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm sm:text-base">Base Mainnet</p>
                      <p className="text-white/40 text-xs">Fast, low-cost transactions on Ethereum L2</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-green-400">Connected</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gas Sponsorship */}
              <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-4 py-2 sm:px-5 sm:py-3">
                <p className="text-white/50 text-xs font-medium tracking-wide py-3 sm:py-4">
                  Gas Fees
                </p>
                <div className="py-4 sm:py-5">
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${BRAND_LAVENDER}15` }}
                    >
                      <svg className="w-5 h-5" style={{ color: BRAND_LAVENDER }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm sm:text-base">Gas Sponsored ✨</p>
                      <p className="text-white/40 text-xs mt-1">
                        All your transactions are gas-free! Yuki covers the network fees so you never need ETH.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === "security" && (
            <>
              {/* Passkey Security */}
              <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-4 py-2 sm:px-5 sm:py-3">
                <p className="text-white/50 text-xs font-medium tracking-wide py-3 sm:py-4">
                  Authentication
                </p>
                <div className="py-4 sm:py-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm sm:text-base">Smart Wallet Secured</p>
                      <p className="text-white/40 text-xs mt-1">
                        Your wallet is secured with passkey authentication. This provides hardware-level security for all transactions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Tips */}
              <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-4 py-2 sm:px-5 sm:py-3">
                <p className="text-white/50 text-xs font-medium tracking-wide py-3 sm:py-4">
                  Security Tips
                </p>
                <div className="divide-y divide-white/[0.04]">
                  <div className="py-4 sm:py-5 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-white/60">1</span>
                    </div>
                    <div>
                      <p className="text-white text-sm">Never share your passkey</p>
                      <p className="text-white/40 text-xs mt-0.5">Your passkey is stored securely on your device</p>
                    </div>
                  </div>
                  <div className="py-4 sm:py-5 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-white/60">2</span>
                    </div>
                    <div>
                      <p className="text-white text-sm">Verify transaction details</p>
                      <p className="text-white/40 text-xs mt-0.5">Always double-check addresses and amounts before confirming</p>
                    </div>
                  </div>
                  <div className="py-4 sm:py-5 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-white/60">3</span>
                    </div>
                    <div>
                      <p className="text-white text-sm">Keep your device secure</p>
                      <p className="text-white/40 text-xs mt-0.5">Use a strong PIN or biometric lock on your device</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <div className="bg-red-500/[0.05] border border-red-500/10 rounded-2xl sm:rounded-3xl px-4 py-2 sm:px-5 sm:py-3">
                <p className="text-red-400/70 text-xs font-medium tracking-wide py-3 sm:py-4">
                  Danger Zone
                </p>
                <div className="py-4 sm:py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Sign Out</p>
                      <p className="text-white/40 text-xs mt-0.5">You can sign back in anytime with your passkey</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
