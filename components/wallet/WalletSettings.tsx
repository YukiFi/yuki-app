/**
 * Wallet Settings Component
 * 
 * Displays wallet info and provides access to security settings.
 */

'use client';

import { useState } from 'react';
import { useWalletContext } from '@/lib/context/WalletContext';
import { ExportPrivateKey } from './ExportPrivateKey';
import { PasskeyUpgradeBanner } from './PasskeyUpgradeBanner';

interface WalletSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletSettings({ isOpen, onClose }: WalletSettingsProps) {
  const { 
    encryptedWallet, 
    hasWallet, 
    isUnlocked, 
    lockWallet,
    logout,
    user,
  } = useWalletContext();

  const [showExport, setShowExport] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!isOpen) return null;

  const isPasskeyEnabled = encryptedWallet?.securityLevel === 'passkey_enabled';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-md mx-4 glass rounded-2xl border border-white/10 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-fdfffc">Wallet Settings</h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-fdfffc transition-colors rounded-lg hover:bg-white/5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Account Info */}
            <div className="p-4 bg-white/5 border border-white/5 rounded-lg mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                  <span className="text-lg font-medium text-accent-primary">
                    {user?.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-fdfffc">{user?.email}</p>
                  <p className="text-xs text-gray-500">Embedded Wallet</p>
                </div>
              </div>
              
              {hasWallet && encryptedWallet && (
                <div className="pt-3 border-t border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                  <p className="text-sm font-mono text-fdfffc break-all">
                    {encryptedWallet.address}
                  </p>
                </div>
              )}
            </div>

            {/* Security Level */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Security</h4>
              <div className={`p-4 rounded-lg ${isPasskeyEnabled ? 'bg-green-500/10 border border-green-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isPasskeyEnabled ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                    <span className={`text-sm font-medium ${isPasskeyEnabled ? 'text-green-400' : 'text-yellow-400'}`}>
                      {isPasskeyEnabled ? 'Strong Security' : 'Basic Security'}
                    </span>
                  </div>
                  {isUnlocked && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Unlocked
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {isPasskeyEnabled 
                    ? 'Your wallet is protected with password + passkey'
                    : 'Your wallet is protected with password only'}
                </p>
              </div>
            </div>

            {/* Passkey Upgrade Banner (if not enabled) */}
            {!isPasskeyEnabled && hasWallet && (
              <div className="mb-4">
                <button
                  className="w-full p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-lg text-left hover:bg-accent-primary/20 transition-colors"
                  onClick={() => {/* Would show upgrade modal */}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-fdfffc">Add Passkey</p>
                        <p className="text-xs text-gray-400">Recommended for security</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Actions</h4>
              
              {isUnlocked && (
                <button
                  onClick={lockWallet}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-left hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm text-fdfffc">Lock Wallet</span>
                  </div>
                </button>
              )}

              <button
                onClick={() => setShowExport(true)}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-left hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-sm text-fdfffc">Export Private Key</span>
                </div>
                <span className="text-xs text-red-400">High Risk</span>
              </button>

              <button
                onClick={() => setConfirmLogout(true)}
                className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-left hover:bg-red-500/20 transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm text-red-400">Log Out</span>
              </button>
            </div>

            {/* Security Info */}
            <div className="mt-6 pt-4 border-t border-white/5">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
                <span>Non-custodial • Your keys never leave your browser</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Private Key Modal */}
      <ExportPrivateKey
        isOpen={showExport}
        onClose={() => setShowExport(false)}
      />

      {/* Logout Confirmation */}
      {confirmLogout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmLogout(false)}
          />
          <div className="relative w-full max-w-sm mx-4 glass rounded-2xl border border-white/10 shadow-2xl p-6">
            <h3 className="text-lg font-medium text-fdfffc mb-2">Log Out?</h3>
            <p className="text-sm text-gray-400 mb-4">
              Make sure you have backed up your private key before logging out.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 py-2.5 bg-white/5 text-gray-300 rounded-lg font-medium border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await logout();
                  window.location.href = '/signin';
                }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
