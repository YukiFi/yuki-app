/**
 * Send Modal Component
 * 
 * A production-ready modal for sending yUSD to other addresses.
 * Uses the embedded wallet for signing and transaction submission.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletContext } from '@/lib/context/WalletContext';
import { buildYUSDTransfer, isValidAddress, formatAmount, getYUSDBalance, YUSD_DECIMALS } from '@/lib/transactions/sendYUSD';
import { createEmbeddedWalletClient, createPublicViemClient } from '@/lib/wagmi';
import { toHex } from '@/lib/crypto';
import { base } from 'viem/chains';

const BRAND_LAVENDER = '#e1a8f0';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string) => void;
}

type Step = 'amount' | 'recipient' | 'confirm' | 'unlock' | 'signing' | 'success' | 'error';

export function SendModal({ isOpen, onClose, onSuccess }: SendModalProps) {
  const { 
    encryptedWallet, 
    isUnlocked, 
    account, 
    unlockWallet,
    signTransaction
  } = useWalletContext();
  
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  
  // Fetch balance when modal opens
  useEffect(() => {
    if (isOpen && encryptedWallet?.address) {
      setIsLoadingBalance(true);
      getYUSDBalance(encryptedWallet.address as `0x${string}`)
        .then(bal => {
          setBalance(bal);
          setIsLoadingBalance(false);
        })
        .catch(() => {
          setBalance('0');
          setIsLoadingBalance(false);
        });
    }
  }, [isOpen, encryptedWallet?.address]);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('amount');
      setAmount('');
      setRecipient('');
      setPassword('');
      setError(null);
      setTxHash(null);
    }
  }, [isOpen]);
  
  const handleAmountSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (numAmount > parseFloat(balance)) {
      setError('Insufficient balance');
      return;
    }
    setError(null);
    setStep('recipient');
  };
  
  const handleRecipientSubmit = () => {
    if (!isValidAddress(recipient)) {
      setError('Invalid Ethereum address');
      return;
    }
    setError(null);
    
    // Check if wallet is unlocked
    if (isUnlocked && account) {
      setStep('confirm');
    } else {
      setStep('unlock');
    }
  };
  
  const handleUnlock = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const result = await unlockWallet(password);
    
    if (result.success) {
      setStep('confirm');
    } else {
      setError(result.error || 'Invalid password');
    }
    
    setIsLoading(false);
  };
  
  const handleSend = async () => {
    if (!account || !encryptedWallet) {
      setError('Wallet not ready');
      return;
    }
    
    setStep('signing');
    setIsLoading(true);
    setError(null);
    
    try {
      // Build the transaction
      const txData = buildYUSDTransfer(
        recipient as `0x${string}`,
        amount
      );
      
      // Get wallet client
      const walletClient = createEmbeddedWalletClient(
        account.address as `0x${string}`,
        base.id
      );
      
      const publicClient = createPublicViemClient(base.id);
      
      // Get nonce and gas estimates
      const nonce = await publicClient.getTransactionCount({
        address: account.address,
      });
      
      const gasPrice = await publicClient.getGasPrice();
      
      const gas = await publicClient.estimateGas({
        account: account.address,
        to: txData.to,
        data: txData.data as `0x${string}`,
        value: txData.value,
      });
      
      // Sign and send the transaction
      const hash = await walletClient.sendTransaction({
        to: txData.to,
        data: txData.data as `0x${string}`,
        value: txData.value,
        gas: (gas * 120n) / 100n, // 20% buffer
        gasPrice,
        nonce,
        chain: base,
      });
      
      setTxHash(hash);
      setStep('success');
      onSuccess?.(hash);
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    if (step !== 'signing') {
      onClose();
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
          onClick={handleClose}
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
              <h2 className="text-xl font-semibold text-white">
                {step === 'success' ? 'Sent!' : 'Send yUSD'}
              </h2>
              {step !== 'signing' && (
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.1] transition-colors"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Amount Step */}
            {step === 'amount' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-white/50 text-sm mb-2">Available balance</p>
                  <p className="text-2xl font-medium text-white">
                    {isLoadingBalance ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      `$${formatAmount(balance)}`
                    )}
                  </p>
                </div>
                
                <div>
                  <label className="block text-white/50 text-sm mb-2">Amount to send</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white/[0.06] rounded-2xl px-8 py-4 text-white text-xl text-center placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  {/* Quick amount buttons */}
                  <div className="flex gap-2 mt-3">
                    {['10', '25', '50', '100'].map((quickAmount) => (
                      <button
                        key={quickAmount}
                        onClick={() => setAmount(quickAmount)}
                        className="flex-1 py-2 rounded-xl bg-white/[0.06] text-white/60 text-sm hover:bg-white/[0.1] transition-colors"
                      >
                        ${quickAmount}
                      </button>
                    ))}
                    <button
                      onClick={() => setAmount(balance)}
                      className="flex-1 py-2 rounded-xl text-sm transition-colors"
                      style={{ backgroundColor: `${BRAND_LAVENDER}20`, color: BRAND_LAVENDER }}
                    >
                      Max
                    </button>
                  </div>
                </div>
                
                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
                
                <button
                  onClick={handleAmountSubmit}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="w-full py-4 rounded-2xl font-medium text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: BRAND_LAVENDER }}
                >
                  Continue
                </button>
              </div>
            )}
            
            {/* Recipient Step */}
            {step === 'recipient' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-white/50 text-sm mb-1">Sending</p>
                  <p className="text-3xl font-medium text-white">${formatAmount(amount)}</p>
                </div>
                
                <div>
                  <label className="block text-white/50 text-sm mb-2">Recipient address</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-white/[0.06] rounded-2xl px-4 py-4 text-white font-mono text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                
                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep('amount'); setError(null); }}
                    className="flex-1 py-4 rounded-2xl font-medium bg-white/[0.06] text-white/70 hover:bg-white/[0.1] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRecipientSubmit}
                    disabled={!recipient}
                    className="flex-1 py-4 rounded-2xl font-medium text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: BRAND_LAVENDER }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
            
            {/* Unlock Step */}
            {step === 'unlock' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Unlock your wallet</h3>
                  <p className="text-white/50 text-sm">Enter your password to sign this transaction</p>
                </div>
                
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-white/[0.06] rounded-2xl px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  />
                </div>
                
                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep('recipient'); setError(null); setPassword(''); }}
                    className="flex-1 py-4 rounded-2xl font-medium bg-white/[0.06] text-white/70 hover:bg-white/[0.1] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUnlock}
                    disabled={!password || isLoading}
                    className="flex-1 py-4 rounded-2xl font-medium text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: BRAND_LAVENDER }}
                  >
                    {isLoading ? 'Unlocking...' : 'Unlock'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Confirm Step */}
            {step === 'confirm' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-white/50 text-sm mb-1">Confirm sending</p>
                  <p className="text-3xl font-medium text-white">${formatAmount(amount)}</p>
                </div>
                
                <div className="bg-white/[0.03] rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/50 text-sm">To</span>
                    <span className="text-white text-sm font-mono">
                      {recipient.slice(0, 6)}...{recipient.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50 text-sm">Network</span>
                    <span className="text-white text-sm">Base</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50 text-sm">Token</span>
                    <span className="text-white text-sm">yUSD</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('recipient')}
                    className="flex-1 py-4 rounded-2xl font-medium bg-white/[0.06] text-white/70 hover:bg-white/[0.1] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSend}
                    className="flex-1 py-4 rounded-2xl font-medium text-black transition-all"
                    style={{ backgroundColor: BRAND_LAVENDER }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
            
            {/* Signing Step */}
            {step === 'signing' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-white/50 animate-spin mx-auto mb-6" />
                <h3 className="text-lg font-medium text-white mb-2">Sending...</h3>
                <p className="text-white/50 text-sm">Signing and submitting your transaction</p>
              </div>
            )}
            
            {/* Success Step */}
            {step === 'success' && (
              <div className="text-center py-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: `${BRAND_LAVENDER}20` }}
                >
                  <svg className="w-8 h-8" style={{ color: BRAND_LAVENDER }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Transaction sent!</h3>
                <p className="text-white/50 text-sm mb-6">
                  ${formatAmount(amount)} has been sent to {recipient.slice(0, 6)}...{recipient.slice(-4)}
                </p>
                
                {txHash && (
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm mb-6"
                    style={{ color: BRAND_LAVENDER }}
                  >
                    View on BaseScan
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                
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
                <h3 className="text-xl font-medium text-white mb-2">Transaction failed</h3>
                <p className="text-white/50 text-sm mb-6">{error}</p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('confirm')}
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

