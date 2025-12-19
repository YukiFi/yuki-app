/**
 * Passkey Upgrade Banner
 * 
 * Shown after first deposit to encourage users to add a passkey
 * for enhanced security.
 */

'use client';

import { useState } from 'react';
import { useWalletContext } from '@/lib/context/WalletContext';

interface PasskeyUpgradeBannerProps {
  onUpgrade?: () => void;
}

export function PasskeyUpgradeBanner({ onUpgrade }: PasskeyUpgradeBannerProps) {
  const { encryptedWallet, hasWallet, upgradeToPasskey } = useWalletContext();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Don't show if no wallet, already upgraded, or dismissed
  if (!hasWallet || encryptedWallet?.securityLevel === 'passkey_enabled' || isDismissed || success) {
    return null;
  }

  const handleUpgrade = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsUpgrading(true);
    setError(null);

    const result = await upgradeToPasskey(password);

    if (result.success) {
      setSuccess(true);
      setShowPasswordModal(false);
      onUpgrade?.();
    } else {
      setError(result.error || 'Failed to enable passkey');
    }

    setIsUpgrading(false);
  };

  return (
    <>
      {/* Banner */}
      <div className="glass rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 mb-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-fdfffc mb-1">
                Protect your wallet with a passkey
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Add a passkey for stronger security. Passkeys are phishing-resistant and sync across your devices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-yellow-500 text-dark-900 rounded-lg text-sm font-medium hover:bg-yellow-400 transition-colors"
            >
              Enable Passkey
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 text-gray-400 hover:text-fdfffc transition-colors rounded-lg hover:bg-white/5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Security comparison */}
        <div className="mt-4 pt-4 border-t border-yellow-500/20 grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <span className="text-xs font-medium text-gray-400">Current: Basic</span>
            </div>
            <p className="text-[10px] text-gray-500">Password only</p>
          </div>
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs font-medium text-green-400">Upgrade: Strong</span>
            </div>
            <p className="text-[10px] text-gray-400">Password + Passkey</p>
          </div>
        </div>
      </div>

      {/* Password Modal for Upgrade */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          />
          
          <div className="relative w-full max-w-md mx-4 glass rounded-2xl border border-white/10 shadow-2xl animate-fade-in">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-fdfffc mb-2">Enable Passkey</h3>
                <p className="text-sm text-gray-400">
                  Enter your password to unlock and set up your passkey.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your wallet password"
                    disabled={isUpgrading}
                    className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors disabled:opacity-50"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    disabled={isUpgrading}
                    className="flex-1 py-3 bg-white/5 text-gray-300 rounded-lg font-medium border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpgrade}
                    disabled={isUpgrading || !password}
                    className="flex-1 py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUpgrading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
