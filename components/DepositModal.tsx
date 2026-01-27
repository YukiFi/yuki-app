/**
 * Deposit Modal Component
 * 
 * Allows users to deposit fiat via Coinbase Onramp.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSmartAccountClient } from '@account-kit/react';

const BRAND_LAVENDER = '#e1a8f0';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'amount' | 'loading' | 'redirect' | 'error';

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { client } = useSmartAccountClient({});
  
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [coinbaseAvailable, setCoinbaseAvailable] = useState<boolean | null>(null);
  
  // Check if Coinbase integration is available
  useEffect(() => {
    if (isOpen) {
      fetch('/api/coinbase/onramp', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setCoinbaseAvailable(data.available))
        .catch(() => setCoinbaseAvailable(false));
    }
  }, [isOpen]);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('amount');
      setAmount('');
      setError(null);
    }
  }, [isOpen]);
  
  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      setError('Minimum deposit is $1');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setStep('loading');
    
    try {
      const response = await fetch('/api/coinbase/onramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate deposit');
      }
      
      // Open Coinbase in a new tab
      window.open(data.onrampUrl, '_blank', 'noopener,noreferrer');
      
      setStep('redirect');
    } catch (err) {
      console.error('Deposit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate deposit');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };
  
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
              <h2 className="text-xl font-semibold text-white">Add Money</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.1] transition-colors"
              >
                ×
              </button>
            </div>
            
            {/* Amount Step */}
            {step === 'amount' && (
              <div className="space-y-6">
                {coinbaseAvailable === false ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Deposits not available</h3>
                    <p className="text-white/50 text-sm mb-4">
                      Coinbase integration is not configured. Please contact support.
                    </p>
                    
                    <div className="bg-white/[0.03] rounded-2xl p-4 text-left">
                      <p className="text-white/50 text-xs mb-2">Your wallet address</p>
                      <p className="text-white font-mono text-sm break-all">
                        {client?.account?.address || 'No wallet'}
                      </p>
                      <p className="text-white/40 text-xs mt-2">
                        You can receive USDC on Base directly to this address.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="text-white/50 text-sm mb-2">Enter amount to deposit</p>
                    </div>
                    
                    <div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-2xl">$</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-white/[0.06] rounded-2xl px-10 py-6 text-white text-3xl text-center placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                          step="1"
                          min="1"
                        />
                      </div>
                      
                      {/* Quick amount buttons */}
                      <div className="flex gap-2 mt-4">
                        {['25', '50', '100', '250', '500'].map((quickAmount) => (
                          <button
                            key={quickAmount}
                            onClick={() => setAmount(quickAmount)}
                            className="flex-1 py-3 rounded-xl bg-white/[0.06] text-white/60 text-sm hover:bg-white/[0.1] transition-colors"
                          >
                            ${quickAmount}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Payment method */}
                    <div className="bg-white/[0.03] rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">Coinbase</p>
                          <p className="text-white/40 text-xs">Card, bank, or Coinbase balance</p>
                        </div>
                        <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    
                    {error && (
                      <p className="text-red-400 text-sm text-center">{error}</p>
                    )}
                    
                    <button
                      onClick={handleDeposit}
                      disabled={!amount || parseFloat(amount) < 1 || isLoading}
                      className="w-full py-4 rounded-2xl font-medium text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: BRAND_LAVENDER }}
                    >
                      Continue with Coinbase
                    </button>
                    
                    <p className="text-white/30 text-xs text-center">
                      You'll be redirected to Coinbase to complete your purchase
                    </p>
                  </>
                )}
              </div>
            )}
            
            {/* Loading Step */}
            {step === 'loading' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-white/50 animate-spin mx-auto mb-6" />
                <h3 className="text-lg font-medium text-white mb-2">Preparing...</h3>
                <p className="text-white/50 text-sm">Setting up your deposit with Coinbase</p>
              </div>
            )}
            
            {/* Redirect Step */}
            {step === 'redirect' && (
              <div className="text-center py-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: `${BRAND_LAVENDER}20` }}
                >
                  <svg className="w-8 h-8" style={{ color: BRAND_LAVENDER }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Complete in Coinbase</h3>
                <p className="text-white/50 text-sm mb-6">
                  A new tab has opened. Complete your purchase with Coinbase and your funds will arrive in your wallet.
                </p>
                
                <div className="bg-white/[0.03] rounded-2xl p-4 mb-6">
                  <p className="text-white/50 text-xs mb-1">Funds will be sent to</p>
                  <p className="text-white font-mono text-sm break-all">
                    {client?.account?.address}
                  </p>
                </div>
                
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl font-medium text-black transition-all"
                  style={{ backgroundColor: BRAND_LAVENDER }}
                >
                  Done
                </button>
              </div>
            )}
            
            {/* Error Step */}
            {step === 'error' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Something went wrong</h3>
                <p className="text-white/50 text-sm mb-6">{error}</p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('amount')}
                    className="flex-1 py-4 rounded-2xl font-medium bg-white/[0.06] text-white/70 hover:bg-white/[0.1] transition-colors"
                  >
                    Try again
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 rounded-2xl font-medium text-black transition-all"
                    style={{ backgroundColor: BRAND_LAVENDER }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

