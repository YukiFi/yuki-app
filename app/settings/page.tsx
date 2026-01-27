"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useUser as useAlchemyUser,
  useSignerStatus,
  useSmartAccountClient,
  useLogout,
  useExportAccount,
} from "@account-kit/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";

const BRAND_LAVENDER = "#e1a8f0";

export default function SettingsPage() {
  const { isLoading: authLoading, user: authUser, refreshUser } = useAuth();
  const { isConnected, isInitializing } = useSignerStatus();
  const { client } = useSmartAccountClient({});
  const alchemyUser = useAlchemyUser();
  const { logout } = useLogout();
  
  // Get wallet address from smart account client
  const walletAddress = client?.account?.address;
  
  // Export account (for passkey management)
  const { exportAccount, isExported, isExporting, ExportAccountComponent } = useExportAccount({
    params: {
      iframeContainerId: "export-account-container",
    }
  });
  
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
  
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">Settings</h1>
          <p className="text-white/50">
            Manage your account and wallet settings
          </p>
        </div>
        
        {/* Account Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Username */}
            <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
              <div>
                <p className="text-sm text-white/50">Username</p>
                <p className="text-white font-medium">
                  {isLoadingProfile ? '...' : (profile?.handle || 'Not set')}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/setup">Change</a>
              </Button>
            </div>
            
            {/* Email */}
            {alchemyUser?.email && (
              <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
                <div>
                  <p className="text-sm text-white/50">Email</p>
                  <p className="text-white font-medium">{alchemyUser.email}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Wallet Card */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
            <CardDescription>Your smart wallet on Base</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Wallet Address */}
            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white/50">Wallet Address</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="text-xs"
                >
                  {copiedAddress ? (
                    <span className="text-green-400">Copied!</span>
                  ) : (
                    "Copy"
                  )}
                </Button>
              </div>
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
            
            {/* Security Info */}
            <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Smart Wallet Secured</p>
                  <p className="text-xs text-white/50 mt-1">
                    Your wallet is secured with passkey authentication. This provides hardware-level security for all transactions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Network Card */}
        <Card>
          <CardHeader>
            <CardTitle>Network</CardTitle>
            <CardDescription>Blockchain network information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Base Mainnet</p>
                <p className="text-xs text-white/50">Fast, low-cost transactions on Ethereum L2</p>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">Connected</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Gas Sponsorship Card */}
        <Card>
          <CardHeader>
            <CardTitle>Gas Fees</CardTitle>
            <CardDescription>Transaction fee settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-[#e1a8f0]/5 rounded-xl border border-[#e1a8f0]/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#e1a8f0]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" style={{ color: BRAND_LAVENDER }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Gas Sponsored ✨</p>
                  <p className="text-xs text-white/50 mt-1">
                    All your transactions are gas-free! Yuki covers the network fees so you never need ETH to send money.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Danger Zone */}
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
