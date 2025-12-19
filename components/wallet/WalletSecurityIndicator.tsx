/**
 * Wallet Security Indicator
 * 
 * Displays the current security level of the wallet.
 */

'use client';

import { useWalletContext } from '@/lib/context/WalletContext';

interface WalletSecurityIndicatorProps {
  compact?: boolean;
  onClick?: () => void;
}

export function WalletSecurityIndicator({ compact = false, onClick }: WalletSecurityIndicatorProps) {
  const { encryptedWallet, hasWallet, isUnlocked } = useWalletContext();

  if (!hasWallet) return null;

  const isPasskeyEnabled = encryptedWallet?.securityLevel === 'passkey_enabled';
  const securityLevel = isPasskeyEnabled ? 'Strong' : 'Basic';
  const securityColor = isPasskeyEnabled ? 'green' : 'yellow';

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-${securityColor}-500/10 border border-${securityColor}-500/20 hover:bg-${securityColor}-500/20 transition-colors`}
      >
        <div className={`w-1.5 h-1.5 rounded-full bg-${securityColor}-400`}></div>
        <span className={`text-[10px] font-medium text-${securityColor}-400`}>
          {securityLevel}
        </span>
        {isUnlocked && (
          <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <div className={`p-3 rounded-lg bg-${securityColor}-500/10 border border-${securityColor}-500/20`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-${securityColor}-400`}></div>
          <span className={`text-xs font-medium text-${securityColor}-400`}>
            Security: {securityLevel}
          </span>
        </div>
        <span className="text-[10px] text-gray-500">
          {isPasskeyEnabled ? 'Password + Passkey' : 'Password Only'}
        </span>
      </div>
      {isUnlocked && (
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
          <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] text-green-400">Wallet Unlocked</span>
        </div>
      )}
    </div>
  );
}
