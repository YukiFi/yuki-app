/**
 * Wallet Settings Component
 * 
 * Displays wallet info and provides access to security settings.
 * With Alchemy Smart Wallets, security is handled natively.
 */

'use client';

import { useState } from 'react';
import { useSmartAccountClient, useLogout, useUser as useAlchemyUser } from '@account-kit/react';

const BRAND_LAVENDER = '#e1a8f0';

interface WalletSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletSettings({ isOpen, onClose }: WalletSettingsProps) {
  const { client } = useSmartAccountClient({});
  const { logout } = useLogout();
  const alchemyUser = useAlchemyUser();

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  const walletAddress = client?.account?.address;

  if (!isOpen) return null;

  const handleCopyAddress = async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-black rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-white">Wallet Settings</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.1] transition-colors"
            >
              ×
            </button>
          </div>
          
          {/* Wallet Info */}
          {walletAddress && (
            <div className="space-y-4">
              {/* Address Card */}
              <div className="p-4 bg-white/[0.03] rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/50">Wallet Address</span>
                  <button
                    onClick={handleCopyAddress}
                    className="text-xs px-2 py-1 rounded bg-white/[0.06] text-white/60 hover:bg-white/[0.1] transition-colors"
                  >
                    {copiedAddress ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-white font-mono text-sm break-all">
                  {walletAddress}
                </p>
              </div>
              
              {/* Email if available */}
              {alchemyUser?.email && (
                <div className="p-4 bg-white/[0.03] rounded-xl">
                  <span className="text-sm text-white/50 block mb-1">Email</span>
                  <p className="text-white">{alchemyUser.email}</p>
                </div>
              )}
              
              {/* Security Status */}
              <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Passkey Secured</p>
                    <p className="text-xs text-white/50">Hardware-level security enabled</p>
                  </div>
                </div>
              </div>
              
              {/* View on Explorer */}
              <a
                href={`https://basescan.org/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-4 bg-white/[0.03] rounded-xl text-center text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                View on Basescan →
              </a>
            </div>
          )}
          
          {/* Sign Out */}
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            {!confirmLogout ? (
              <button
                onClick={() => setConfirmLogout(true)}
                className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-white/60 text-center">
                  Are you sure you want to sign out?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmLogout(false)}
                    className="flex-1 py-3 rounded-xl bg-white/[0.06] text-white hover:bg-white/[0.1] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
