/**
 * Deposit Flow Component
 * 
 * Simplified deposit flow for Alchemy Smart Wallets.
 * Shows the user their wallet address for receiving deposits.
 */

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSmartAccountClient } from '@account-kit/react';

const BRAND_LAVENDER = '#e1a8f0';

interface DepositFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositFlow({ isOpen, onClose }: DepositFlowProps) {
  const { client } = useSmartAccountClient({});
  const walletAddress = client?.account?.address;
  
  const [copiedAddress, setCopiedAddress] = useState(false);

  if (!isOpen) return null;

  const handleCopyAddress = async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-black rounded-t-3xl sm:rounded-3xl overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Deposit</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.1] transition-colors"
            >
              ×
            </button>
          </div>
          
          {walletAddress ? (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-2xl">
                  <QRCodeSVG 
                    value={walletAddress}
                    size={180}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>
              
              {/* Address */}
              <div className="space-y-2">
                <p className="text-sm text-white/50 text-center">Your wallet address</p>
                <div className="p-4 bg-white/[0.03] rounded-xl">
                  <p className="text-white font-mono text-xs sm:text-sm break-all text-center">
                    {walletAddress}
                  </p>
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="w-full py-3 rounded-xl font-medium transition-colors"
                  style={{ backgroundColor: BRAND_LAVENDER, color: '#1a0a1f' }}
                >
                  {copiedAddress ? 'Copied!' : 'Copy Address'}
                </button>
              </div>
              
              {/* Info */}
              <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/60">
                      Send USDC or yUSD on <strong>Base network</strong> to this address. 
                      Deposits typically arrive within a few seconds.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white/50 animate-spin mx-auto mb-4" />
              <p className="text-white/50">Loading wallet...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
