/**
 * Withdraw Modal Component
 * 
 * Allows users to withdraw to fiat via Coinbase or external wallet.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletContext } from '@/lib/context/WalletContext';
import { buildUSDCTransfer, getUSDCBalance, formatAmount, isValidAddress, USDC_ADDRESS } from '@/lib/transactions/sendYUSD';
import { createEmbeddedWalletClient, createPublicViemClient } from '@/lib/wagmi';
import { base } from 'viem/chains';

const BRAND_LAVENDER = '#e1a8f0';

// Coinbase deposit address for offramp (placeholder - get from Coinbase API)
const COINBASE_DEPOSIT_ADDRESS = process.env.NEXT_PUBLIC_COINBASE_DEPOSIT_ADDRESS || '';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string) => void;
}

type WithdrawMethod = 'bank' | 'external';
type Step = 'method' | 'amount' | 'external_address' | 'unlock' | 'confirm' | 'signing' | 'success' | 'error';

export function WithdrawModal({ isOpen, onClose, onSuccess }: WithdrawModalProps) {
  const { 
    encryptedWallet, 
    isUnlocked, 
    account, 
    unlockWallet 
  } = useWalletContext();
  
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<WithdrawMethod>('bank');
  const [amount, setAmount] = useState('');
  const [externalAddress, setExternalAddress] = useState('');
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
      getUSDCBalance(encryptedWallet.address as `0x${string}`)
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
      setStep('method');
      setMethod('bank');
      setAmount('');
      setExternalAddress('');
      setPassword('');
      setError(null);
      setTxHash(null);
    }
  }, [isOpen]);
  
  const handleMethodSelect = (selectedMethod: WithdrawMethod) => {
    setMethod(selectedMethod);
    setStep('amount');
  };
  
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
    
    if (method === 'external') {
      setStep('external_address');
    } else {
      // For bank withdrawal, check if wallet is unlocked
      if (isUnlocked && account) {
        setStep('confirm');
      } else {
        setStep('unlock');
      }
    }
  };
  
  const handleExternalAddressSubmit = () => {
    if (!isValidAddress(externalAddress)) {
      setError('Invalid Ethereum address');
      return;
    }
    setError(null);
    
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
  
  const handleWithdraw = async () => {
    if (!account || !encryptedWallet) {
      setError('Wallet not ready');
      return;
    }
    
    const destination = method === 'bank' 
      ? COINBASE_DEPOSIT_ADDRESS 
      : externalAddress;
    
    if (!destination) {
      setError('No destination address');
      return;
    }
    
    setStep('signing');
    setIsLoading(true);
    setError(null);
    
    try {
      // Build the USDC transfer transaction
      const txData = buildUSDCTransfer(
        destination as `0x${string}`,
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
        gas: (gas * 120n) / 100n,
        gasPrice,
        nonce,
        chain: base,
      });
      
      setTxHash(hash);
      setStep('success');
      onSuccess?.(hash);
    } catch (err) {
      console.error('Withdrawal error:', err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
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
          onClick={step !== 'signing' ? onClose : undefined}
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
                {step === 'success' ? 'Withdrawn!' : 'Withdraw'}
              </h2>
              {step !== 'signing' && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.1] transition-colors"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Method Selection */}
            {step === 'method' && (
              <div className="space-y-4">
                <p className="text-white/50 text-sm text-center mb-6">Where do you want to send your funds?</p>
                
                <button
                  onClick={() => handleMethodSelect('bank')}
                  disabled={!COINBASE_DEPOSIT_ADDRESS}
                  className="w-full bg-white/[0.03] rounded-2xl p-4 text-left hover:bg-white/[0.06] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">To bank account</p>
                      <p className="text-white/40 text-sm">Via Coinbase • 1-3 business days</p>
                    </div>
                    <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                
                <button
                  onClick={() => handleMethodSelect('external')}
                  className="w-full bg-white/[0.03] rounded-2xl p-4 text-left hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">To external wallet</p>
                      <p className="text-white/40 text-sm">Any Ethereum address • Instant</p>
                    </div>
                    <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            )}
            
            {/* Amount Step */}
            {step === 'amount' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-white/50 text-sm mb-2">Available to withdraw</p>
                  <p className="text-2xl font-medium text-white">
                    {isLoadingBalance ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      `$${formatAmount(balance)}`
                    )}
                  </p>
                </div>
                
                <div>
                  <label className="block text-white/50 text-sm mb-2">Amount</label>
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
                  
                  <button
                    onClick={() => setAmount(balance)}
                    className="w-full mt-3 py-2 rounded-xl text-sm transition-colors"
                    style={{ backgroundColor: `${BRAND_LAVENDER}20`, color: BRAND_LAVENDER }}
                  >
                    Withdraw all
                  </button>
                </div>
                
                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep('method'); setError(null); }}
                    className="flex-1 py-4 rounded-2xl font-medium bg-white/[0.06] text-white/70 hover:bg-white/[0.1] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleAmountSubmit}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="flex-1 py-4 rounded-2xl font-medium text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: BRAND_LAVENDER }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
            
            {/* External Address Step */}
            {step === 'external_address' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-white/50 text-sm mb-1">Withdrawing</p>
                  <p className="text-3xl font-medium text-white">${formatAmount(amount)}</p>
                </div>
                
                <div>
                  <label className="block text-white/50 text-sm mb-2">Destination address</label>
                  <input
                    type="text"
                    value={externalAddress}
                    onChange={(e) => setExternalAddress(e.target.value)}
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
                    onClick={handleExternalAddressSubmit}
                    disabled={!externalAddress}
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
                
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-white/[0.06] rounded-2xl px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
                
                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep('amount'); setError(null); setPassword(''); }}
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
                  <p className="text-white/50 text-sm mb-1">Confirm withdrawal</p>
                  <p className="text-3xl font-medium text-white">${formatAmount(amount)}</p>
                </div>
                
                <div className="bg-white/[0.03] rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/50 text-sm">To</span>
                    <span className="text-white text-sm font-mono">
                      {method === 'bank' 
                        ? 'Coinbase (Bank Transfer)'
                        : `${externalAddress.slice(0, 6)}...${externalAddress.slice(-4)}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50 text-sm">Network</span>
                    <span className="text-white text-sm">Base</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50 text-sm">Token</span>
                    <span className="text-white text-sm">USDC</span>
                  </div>
                  {method === 'bank' && (
                    <div className="flex justify-between">
                      <span className="text-white/50 text-sm">Est. arrival</span>
                      <span className="text-white text-sm">1-3 business days</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('amount')}
                    className="flex-1 py-4 rounded-2xl font-medium bg-white/[0.06] text-white/70 hover:bg-white/[0.1] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleWithdraw}
                    className="flex-1 py-4 rounded-2xl font-medium text-black transition-all"
                    style={{ backgroundColor: BRAND_LAVENDER }}
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            )}
            
            {/* Signing Step */}
            {step === 'signing' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-white/50 animate-spin mx-auto mb-6" />
                <h3 className="text-lg font-medium text-white mb-2">Processing...</h3>
                <p className="text-white/50 text-sm">Signing and submitting your withdrawal</p>
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
                <h3 className="text-xl font-medium text-white mb-2">Withdrawal submitted!</h3>
                <p className="text-white/50 text-sm mb-6">
                  {method === 'bank'
                    ? 'Your funds are on the way to Coinbase. Bank transfer typically takes 1-3 business days.'
                    : `$${formatAmount(amount)} has been sent to ${externalAddress.slice(0, 6)}...${externalAddress.slice(-4)}`
                  }
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
                <h3 className="text-xl font-medium text-white mb-2">Withdrawal failed</h3>
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

