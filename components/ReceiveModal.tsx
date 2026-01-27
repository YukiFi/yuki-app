/**
 * Receive Modal Component
 * 
 * Displays wallet address and QR code for receiving funds.
 */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useSmartAccountClient } from '@account-kit/react';

const BRAND_LAVENDER = '#e1a8f0';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiveModal({ isOpen, onClose }: ReceiveModalProps) {
  const { client } = useSmartAccountClient({});
  const [copied, setCopied] = useState(false);
  
  const address = client?.account?.address || '';
  
  const handleCopy = useCallback(async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [address]);
  
  const handleShare = useCallback(async () => {
    if (!address) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Yuki Wallet Address',
          text: `Send yUSD to my address: ${address}`,
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  }, [address, handleCopy]);
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full sm:max-w-md bg-black rounded-t-3xl sm:rounded-3xl overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Receive</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.1] transition-colors"
              >
                ×
              </button>
            </div>
            
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl mb-6">
                {address ? (
                  <QRCodeSVG
                    value={address}
                    size={200}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] bg-gray-200 animate-pulse rounded" />
                )}
              </div>
              
              {/* Network Badge */}
              <div 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ backgroundColor: `${BRAND_LAVENDER}15` }}
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: BRAND_LAVENDER }}
                />
                <span className="text-xs font-medium" style={{ color: BRAND_LAVENDER }}>
                  Base Network
                </span>
              </div>
              
              {/* Address Display */}
              <div className="w-full bg-white/[0.03] rounded-2xl p-4 mb-4">
                <p className="text-white/50 text-xs text-center mb-2">Your wallet address</p>
                <p className="text-white font-mono text-sm text-center break-all leading-relaxed">
                  {address || 'No wallet address'}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-medium transition-all"
                  style={{ 
                    backgroundColor: copied ? `${BRAND_LAVENDER}20` : 'rgba(255,255,255,0.06)',
                    color: copied ? BRAND_LAVENDER : 'rgba(255,255,255,0.7)'
                  }}
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-medium text-black transition-all"
                  style={{ backgroundColor: BRAND_LAVENDER }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
              
              {/* Info */}
              <div className="mt-6 text-center">
                <p className="text-white/40 text-xs">
                  Only send USDC or yUSD on Base network to this address
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

